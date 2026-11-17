import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { can } from "@/lib/permissions";

// Page d'arrivée selon le rôle : un partenaire n'a pas accès aux dossiers.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  redirect(can(user.role, "dossier.read") ? `/${locale}/dossiers` : `/${locale}/calendrier`);
}
