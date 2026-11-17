"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ERROR_IDS } from "@/constants/errorIds";
import { guardCsrf } from "@/features/identity/actions/shared";
import { createContext } from "@/server/trpc/context";
import { fetchFeedText } from "./feedFetch";
import { addCalendarFeed, syncCalendarFeed } from "./feedSync";

export type FeedActionResult = { ok: true } | { ok: false; error: { id: string } };

const addInput = z.object({ label: z.string().max(200), url: z.string().max(2000) });
const syncInput = z.object({ feedId: z.string().uuid() });

const failure = (id: string): FeedActionResult => ({ ok: false, error: { id } });

export async function addCalendarFeedAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<FeedActionResult> {
  const csrf = await guardCsrf(csrfToken);
  if (!csrf.ok) return failure(ERROR_IDS.AUTH_STATE_MISMATCH);
  const ctx = await createContext();
  if (ctx.actor === null) return failure(ERROR_IDS.AUTH_SESSION_DEAD);
  const parsed = addInput.safeParse(input);
  if (!parsed.success) return failure(ERROR_IDS.FEED_INVALID);

  const result = await addCalendarFeed(ctx.db, ctx.actor, parsed.data, AbortSignal.timeout(10_000));
  if (!result.ok) return failure(result.error.id);
  revalidatePath("/calendar");
  return { ok: true };
}

export async function syncCalendarFeedAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<FeedActionResult> {
  const csrf = await guardCsrf(csrfToken);
  if (!csrf.ok) return failure(ERROR_IDS.AUTH_STATE_MISMATCH);
  const ctx = await createContext();
  if (ctx.actor === null) return failure(ERROR_IDS.AUTH_SESSION_DEAD);
  const parsed = syncInput.safeParse(input);
  if (!parsed.success) return failure(ERROR_IDS.FEED_NOT_FOUND);

  const result = await syncCalendarFeed(
    ctx.db,
    ctx.actor,
    parsed.data.feedId,
    fetchFeedText,
    AbortSignal.timeout(30_000),
  );
  if (!result.ok) return failure(result.error.id);
  revalidatePath("/calendar");
  return { ok: true };
}
