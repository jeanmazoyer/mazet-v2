"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ERROR_IDS } from "@/constants/errorIds";
import { guardCsrf } from "@/features/identity/actions/shared";
import { createContext } from "@/server/trpc/context";
import { updateDealPiece } from "./pieceRepo";
import { MAX_REFERENCE_LENGTH, PIECE_KINDS, PIECE_STATUSES } from "./pieceRules";

export type PieceActionResult = { ok: true } | { ok: false; error: { id: string } };

const updateInput = z.object({
  dealId: z.string().uuid(),
  kind: z.enum(PIECE_KINDS),
  status: z.enum(PIECE_STATUSES),
  reference: z.string().max(MAX_REFERENCE_LENGTH).nullable(),
  expiresOn: z.string().max(10).nullable(),
});

function fail(id: string): PieceActionResult {
  return { ok: false, error: { id } };
}

export async function updateDealPieceAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<PieceActionResult> {
  const csrf = await guardCsrf(csrfToken);
  if (!csrf.ok) return fail(ERROR_IDS.AUTH_STATE_MISMATCH);

  const ctx = await createContext();
  if (ctx.actor === null) return fail(ERROR_IDS.AUTH_SESSION_DEAD);

  const parsed = updateInput.safeParse(input);
  if (!parsed.success) return fail(ERROR_IDS.PIECE_INVALID);

  const { dealId, ...patch } = parsed.data;
  const result = await updateDealPiece(
    ctx.db,
    ctx.actor,
    dealId,
    patch,
    AbortSignal.timeout(10_000),
  );
  if (!result.ok) return fail(result.error.id);

  revalidatePath(`/deals/${dealId}/pieces`);
  return { ok: true };
}
