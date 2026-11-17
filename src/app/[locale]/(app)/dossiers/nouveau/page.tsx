import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { createDossierAction } from "@/app/[locale]/(app)/dossiers/actions";
import { DossierForm } from "@/components/dossiers/dossier-form";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { can } from "@/lib/permissions";

export default async function NewDossierPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || !can(user.role, "dossier.write")) notFound();

  const t = await getTranslations("dossiers");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/dossiers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("newTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("newSubtitle")}</p>
      </header>
      <Card className="p-6">
        <DossierForm action={createDossierAction} submitLabel={t("form.create")} />
      </Card>
    </div>
  );
}
