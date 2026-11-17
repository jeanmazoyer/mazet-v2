import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/current-user";
import { can } from "@/lib/permissions";
import {
  DOSSIER_STATUSES,
  FIXTURE_DOSSIERS,
  type DossierStatus,
  type FixtureDossier,
} from "@/features/dossiers/fixtures";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<DossierStatus, "neutral" | "sage" | "strong" | "muted"> = {
  demande: "neutral",
  visite: "neutral",
  option: "sage",
  devis_envoye: "sage",
  signe: "strong",
  solde: "strong",
  perdu: "muted",
};

export default async function DossiersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ statut?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || !can(user.role, "dossier.read")) notFound();

  const { statut } = await searchParams;
  const activeStatus = DOSSIER_STATUSES.find((s) => s === statut);
  const rows: FixtureDossier[] = activeStatus
    ? FIXTURE_DOSSIERS.filter((d) => d.status === activeStatus)
    : FIXTURE_DOSSIERS;

  const t = await getTranslations("dossiers");
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button disabled title={t("newDossier")}>
          {t("newDossier")}
        </Button>
      </header>

      <nav aria-label={t("title")} className="flex flex-wrap gap-2">
        <FilterLink href="/dossiers" active={!activeStatus}>
          {t("filterAll")}
        </FilterLink>
        {DOSSIER_STATUSES.map((s) => (
          <FilterLink key={s} href={`/dossiers?statut=${s}`} active={activeStatus === s}>
            {t(`statuses.${s}`)}
          </FilterLink>
        ))}
      </nav>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.reference")}</TableHead>
              <TableHead>{t("columns.client")}</TableHead>
              <TableHead>{t("columns.type")}</TableHead>
              <TableHead>{t("columns.date")}</TableHead>
              <TableHead>{t("columns.guests")}</TableHead>
              <TableHead>{t("columns.source")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => (
              <TableRow key={d.ref}>
                <TableCell className="font-mono text-xs">{d.ref}</TableCell>
                <TableCell className="font-medium">{d.client}</TableCell>
                <TableCell>{t(`types.${d.type}`)}</TableCell>
                <TableCell>{dateFmt.format(new Date(d.targetDate))}</TableCell>
                <TableCell>{t("guests", { count: d.guests })}</TableCell>
                <TableCell className="text-muted-foreground">{d.source}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[d.status]}>{t(`statuses.${d.status}`)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent",
      )}
    >
      {children}
    </Link>
  );
}
