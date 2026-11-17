"use server";

import { revalidatePath } from "next/cache";
import { errorCode, type FormState } from "@/lib/action-helpers";
import { getCurrentUser } from "@/lib/current-user";
import { cancelReservation, createReservation } from "@/lib/services/reservations";

export async function createReservationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "forbidden" };

  try {
    await createReservation(user, {
      dossierId: formData.get("dossierId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      kind: formData.get("kind"),
      optionExpiresOn: formData.get("optionExpiresOn"),
    });
  } catch (error) {
    const code = errorCode(error);
    if (code) return { error: code };
    throw error;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function cancelReservationAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    await cancelReservation(user, String(formData.get("reservationId") ?? ""));
  } catch (error) {
    // Droit manquant ou réservation introuvable : rien n'est modifié, la page se recharge telle quelle.
    if (!errorCode(error)) throw error;
  }

  revalidatePath("/", "layout");
}
