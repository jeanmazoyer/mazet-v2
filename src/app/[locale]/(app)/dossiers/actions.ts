"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { errorCode, localeOf, type FormState } from "@/lib/action-helpers";
import { getCurrentUser } from "@/lib/current-user";
import {
  addDossierNote,
  changeDossierStatus,
  createDossier,
  updateDossier,
  type DossierInput,
} from "@/lib/services/dossiers";

// Les droits sont vérifiés dans les services, à chaque appel : ces actions
// ne font que lire le formulaire et traduire les erreurs attendues.

function inputOf(formData: FormData): DossierInput {
  return {
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail"),
    clientPhone: formData.get("clientPhone"),
    clientLanguage: formData.get("clientLanguage"),
    clientCountry: formData.get("clientCountry"),
    type: formData.get("type"),
    targetDate: formData.get("targetDate"),
    guests: formData.get("guests"),
    source: formData.get("source"),
  };
}

export async function createDossierAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "forbidden" };

  let id: string;
  try {
    id = (await createDossier(user, inputOf(formData))).id;
  } catch (error) {
    const code = errorCode(error);
    if (code) return { error: code };
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(`/${localeOf(formData)}/dossiers/${id}`);
}

export async function updateDossierAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "forbidden" };

  try {
    await updateDossier(user, String(formData.get("dossierId") ?? ""), inputOf(formData));
  } catch (error) {
    const code = errorCode(error);
    if (code) return { error: code };
    throw error;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addNoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "forbidden" };

  try {
    await addDossierNote(user, String(formData.get("dossierId") ?? ""), formData.get("body"));
  } catch (error) {
    const code = errorCode(error);
    if (code) return { error: code };
    throw error;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function moveDossierAction(dossierId: string, status: string): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "forbidden" };

  try {
    await changeDossierStatus(user, dossierId, status);
  } catch (error) {
    const code = errorCode(error);
    if (code) return { error: code };
    throw error;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
