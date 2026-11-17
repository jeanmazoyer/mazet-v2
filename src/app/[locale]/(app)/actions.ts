"use server";

import { signOut } from "@/auth";

export async function signOutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "fr");
  await signOut({ redirectTo: `/${locale}/login` });
}
