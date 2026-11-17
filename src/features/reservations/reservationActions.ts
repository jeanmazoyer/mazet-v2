"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ERROR_IDS } from "@/constants/errorIds";
import { guardCsrf } from "@/features/identity/actions/shared";
import { createContext } from "@/server/trpc/context";
import { cancelReservation, createReservation } from "./reservationRepo";

// Mutations come from a form on the page, so they pass the CSRF guard first, then validate the
// input at this boundary, then delegate to the repo that enforces the rules.

export type ReservationActionResult = { ok: true } | { ok: false; error: { id: string } };

const newReservationInput = z.object({
  dealId: z.string().uuid(),
  startDate: z.string().max(10),
  endDate: z.string().max(10),
  kind: z.enum(["option", "firm"]),
  optionExpiresOn: z.string().max(10).nullable(),
});

const cancelInput = z.object({ reservationId: z.string().uuid() });

function fail(id: string): ReservationActionResult {
  return { ok: false, error: { id } };
}

export async function createReservationAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<ReservationActionResult> {
  const csrf = await guardCsrf(csrfToken);
  if (!csrf.ok) return fail(ERROR_IDS.AUTH_STATE_MISMATCH);

  const ctx = await createContext();
  if (ctx.actor === null) return fail(ERROR_IDS.AUTH_SESSION_DEAD);

  const parsed = newReservationInput.safeParse(input);
  if (!parsed.success) return fail(ERROR_IDS.RESERVATION_INVALID);

  const result = await createReservation(
    ctx.db,
    ctx.actor,
    {
      ...parsed.data,
      optionExpiresOn: parsed.data.kind === "option" ? parsed.data.optionExpiresOn : null,
    },
    AbortSignal.timeout(10_000),
  );
  if (!result.ok) return fail(result.error.id);

  revalidatePath("/calendar");
  return { ok: true };
}

export async function cancelReservationAction(
  input: unknown,
  csrfToken: string | null = null,
): Promise<ReservationActionResult> {
  const csrf = await guardCsrf(csrfToken);
  if (!csrf.ok) return fail(ERROR_IDS.AUTH_STATE_MISMATCH);

  const ctx = await createContext();
  if (ctx.actor === null) return fail(ERROR_IDS.AUTH_SESSION_DEAD);

  const parsed = cancelInput.safeParse(input);
  if (!parsed.success) return fail(ERROR_IDS.RESERVATION_NOT_FOUND);

  const result = await cancelReservation(
    ctx.db,
    ctx.actor,
    parsed.data.reservationId,
    AbortSignal.timeout(10_000),
  );
  if (!result.ok) return fail(result.error.id);

  revalidatePath("/calendar");
  return { ok: true };
}
