import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/current-user";

// Toute page de l'application passe par ici : sans compte autorisé, pas d'accès.
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  return <AppShell user={user}>{children}</AppShell>;
}
