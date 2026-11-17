import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/components/dossiers/kanban-board";
import { StatusDot } from "@/components/status-dot";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { formatRef } from "@/lib/dossiers";
import { can } from "@/lib/permissions";
import { listDossiers } from "@/lib/services/dossiers";
import { cn } from "@/lib/utils";

export default async function DossiersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ vue?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || !can(user.role, "dossier.read")) notFound();

  const { vue } = await searchParams;
  const view = vue === "liste" ? "liste" : "tableau";
  const canWrite = can(user.role, "dossier.write");
  const dossiers = await listDossiers(user);

  const t = await getTranslations("dossiers");
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <nav aria-label={t("title")} className="flex rounded-md border border-border p-0.5 text-sm">
            <ViewLink href="/dossiers" active={view === "tableau"}>
              {t("viewBoard")}
            </ViewLink>
            <ViewLink href="/dossiers?vue=liste" active={view === "liste"}>
              {t("viewList")}
            </ViewLink>
          </nav>
          {canWrite ? (
            <Link href="/dossiers/nouveau" className={buttonVariants()}>
              <Plus />
              {t("newDossier")}
            </Link>
          ) : null}
        </div>
      </header>

      {dossiers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : view === "tableau" ? (
        <KanbanBoard dossiers={dossiers} canWrite={canWrite} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
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
              {dossiers.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{formatRef(d.number)}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/dossiers/${d.id}`} className="underline-offset-4 hover:underline">
                      {d.clientName}
                    </Link>
                  </TableCell>
                  <TableCell>{t(`types.${d.type}`)}</TableCell>
                  <TableCell>
                    {d.targetDate ? dateFmt.format(new Date(`${d.targetDate}T00:00:00Z`)) : "—"}
                  </TableCell>
                  <TableCell>{d.guests !== null ? t("guests", { count: d.guests }) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{d.source ?? "—"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <StatusDot status={d.status} />
                      {t(`statuses.${d.status}`)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ViewLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-[4px] px-3 py-1 transition-colors",
        active ? "bg-secondary font-medium text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
