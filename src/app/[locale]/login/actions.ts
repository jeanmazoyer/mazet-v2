"use server";

import { signIn } from "@/auth";

export async function signInWithGoogle(formData: FormData) {
  const locale = String(formData.get("locale") ?? "fr");
  await signIn("google", { redirectTo: `/${locale}/dossiers` });
}
