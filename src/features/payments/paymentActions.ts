"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ERROR_IDS } from "@/constants/errorIds";
import { guardCsrf } from "@/features/identity/actions/shared";
import { createContext } from "@/server/trpc/context";
import { addPaymentLine, recordPayment } from "./paymentRepo";
import { MAX_PAYMENT_REFERENCE_LENGTH, PAYMENT_KINDS, parseAmountText } from "./paymentRules";

export type PaymentActionResult = { ok: true } | { ok: false; error: { id: string } };

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// Amounts arrive as the typed text ("1 250,00") and are converted to cents here, once.
const addInput = z.object({
  dealId: z.string().uuid(),
  kind: z.enum(PAYMENT_KINDS),
  amountText: z.string().max(20),
  dueOn: z.string().regex(ISO_DAY),
});

const settleInput = z.object({
  dealId: z.string().uuid(),
  lineId: z.string().uuid(),
  paidOn: z.string().regex(ISO_DAY),
  reference: z.string().max(MAX_PAYMENT_REFERENCE_LENGTH).nullable(),
});

function fail(id: string): PaymentActionResult {
  return { ok: false, error: { id } };
}

export async function addPaymentLineAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<PaymentActionResult> {
  const csrf = await guardCsrf(csrfToken);
  if (!csrf.ok) return fail(ERROR_IDS.AUTH_STATE_MISMATCH);

  const ctx = await createContext();
  if (ctx.actor === null) return fail(ERROR_IDS.AUTH_SESSION_DEAD);

  const parsed = addInput.safeParse(input);
  if (!parsed.success) return fail(ERROR_IDS.PAYMENT_INVALID);
  const cents = parseAmountText(parsed.data.amountText);
  if (cents === null) return fail(ERROR_IDS.PAYMENT_INVALID);

  const { dealId, kind, dueOn } = parsed.data;
  const result = await addPaymentLine(
    ctx.db,
    ctx.actor,
    dealId,
    { kind, amountCents: cents, dueOn },
    AbortSignal.timeout(10_000),
  );
  if (!result.ok) return fail(result.error.id);

  revalidatePath(`/deals/${dealId}/payments`);
  return { ok: true };
}

export async function recordPaymentAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<PaymentActionResult> {
  const csrf = await guardCsrf(csrfToken);
  if (!csrf.ok) return fail(ERROR_IDS.AUTH_STATE_MISMATCH);

  const ctx = await createContext();
  if (ctx.actor === null) return fail(ERROR_IDS.AUTH_SESSION_DEAD);

  const parsed = settleInput.safeParse(input);
  if (!parsed.success) return fail(ERROR_IDS.PAYMENT_INVALID);

  const { dealId, lineId, paidOn, reference } = parsed.data;
  const result = await recordPayment(
    ctx.db,
    ctx.actor,
    dealId,
    lineId,
    { paidOn, reference: reference === null || reference.trim() === "" ? null : reference.trim() },
    AbortSignal.timeout(10_000),
  );
  if (!result.ok) return fail(result.error.id);

  revalidatePath(`/deals/${dealId}/payments`);
  return { ok: true };
}
