"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ERROR_IDS } from "@/constants/errorIds";
import type { Db } from "@/db/client";
import { guardCsrf } from "@/features/identity/actions/shared";
import type { HydratedActor } from "@/server/hydrateActor";
import { createContext } from "@/server/trpc/context";
import { parseMoneyToCents, VAT_RATES_BP } from "./quoteMath";
import { acceptQuote, createQuote, markQuoteSent, upsertPriceItem } from "./quoteRepo";

// Every action: CSRF first, then the session, then the input shape, then the repo (which applies
// the rules). The page is revalidated only after a successful write.

export type QuoteActionResult = { ok: true } | { ok: false; error: { id: string } };

const uuid = z.string().uuid();

const createQuoteInput = z.object({
  dealId: uuid,
  language: z.enum(["fr", "en"]),
  validUntil: z.string().max(10).nullable(),
  notes: z.string().max(2000).nullable(),
  lines: z
    .array(z.object({ priceItemId: uuid, quantity: z.number().int().min(1).max(1000) }))
    .min(1)
    .max(50),
});

const statusInput = z.object({ dealId: uuid, quoteId: uuid });

const priceItemInput = z.object({
  id: uuid.optional(),
  labelFr: z.string().trim().min(1).max(120),
  labelEn: z.string().trim().min(1).max(120),
  unit: z.enum(["flat", "per_day", "per_person"]),
  price: z.string().max(20),
  vatRateBp: z.number().int(),
  active: z.boolean(),
});

type Authorized = { ok: true; db: Db; actor: HydratedActor } | { ok: false; error: { id: string } };

async function authorize(csrfToken: string | null): Promise<Authorized> {
  const csrf = await guardCsrf(csrfToken);
  if (!csrf.ok) return { ok: false, error: { id: ERROR_IDS.AUTH_STATE_MISMATCH } };
  const ctx = await createContext();
  if (ctx.actor === null) return { ok: false, error: { id: ERROR_IDS.AUTH_SESSION_DEAD } };
  return { ok: true, db: ctx.db, actor: ctx.actor };
}

const failure = (id: string): QuoteActionResult => ({ ok: false, error: { id } });

export async function createQuoteAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<QuoteActionResult> {
  const auth = await authorize(csrfToken);
  if (!auth.ok) return failure(auth.error.id);
  const parsed = createQuoteInput.safeParse(input);
  if (!parsed.success) return failure(ERROR_IDS.QUOTE_INVALID);

  const { dealId, language, lines, validUntil, notes } = parsed.data;
  const result = await createQuote(
    auth.db,
    auth.actor,
    dealId,
    {
      language,
      lines,
      validUntil: validUntil === null || validUntil === "" ? null : validUntil,
      notes: notes === null || notes.trim() === "" ? null : notes.trim(),
    },
    AbortSignal.timeout(10_000),
  );
  if (!result.ok) return failure(result.error.id);
  revalidatePath(`/deals/${dealId}/quotes`);
  return { ok: true };
}

export async function markQuoteSentAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<QuoteActionResult> {
  return changeStatus(input, csrfToken, markQuoteSent);
}

export async function acceptQuoteAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<QuoteActionResult> {
  return changeStatus(input, csrfToken, acceptQuote);
}

async function changeStatus(
  input: unknown,
  csrfToken: string | null,
  change: typeof markQuoteSent,
): Promise<QuoteActionResult> {
  const auth = await authorize(csrfToken);
  if (!auth.ok) return failure(auth.error.id);
  const parsed = statusInput.safeParse(input);
  if (!parsed.success) return failure(ERROR_IDS.QUOTE_NOT_FOUND);

  const result = await change(
    auth.db,
    auth.actor,
    parsed.data.quoteId,
    AbortSignal.timeout(10_000),
  );
  if (!result.ok) return failure(result.error.id);
  revalidatePath(`/deals/${parsed.data.dealId}/quotes`);
  return { ok: true };
}

export async function upsertPriceItemAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<QuoteActionResult> {
  const auth = await authorize(csrfToken);
  if (!auth.ok) return failure(auth.error.id);
  const parsed = priceItemInput.safeParse(input);
  if (!parsed.success) return failure(ERROR_IDS.QUOTE_INVALID);

  const { price, ...rest } = parsed.data;
  const cents = parseMoneyToCents(price);
  if (cents === null || !(VAT_RATES_BP as readonly number[]).includes(rest.vatRateBp)) {
    return failure(ERROR_IDS.QUOTE_INVALID);
  }
  const result = await upsertPriceItem(
    auth.db,
    auth.actor,
    { ...rest, unitPriceCents: cents },
    AbortSignal.timeout(10_000),
  );
  if (!result.ok) return failure(result.error.id);
  revalidatePath("/prices");
  return { ok: true };
}
