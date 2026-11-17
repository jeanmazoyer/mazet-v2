import { KanbanSquare, List, Plus, X } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/components/dossiers/kanban-board";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { DOSSIER_STATUSES, formatRef, isOneOf } from "@/lib/dossiers";
import { can } from "@/lib/permissions";
import { listDossiers } from "@/lib/services/dossiers";
import { cn } from "@/lib/utils";

export default async function DossiersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ vue?: string; q?: string; statut?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || !can(user.role, "dossier.read")) notFound();

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const status = isOneOf(DOSSIER_STATUSES, sp.statut) ? sp.statut : undefined;
  // Une recherche ou un filtre d'étape s'affiche toujours en liste.
  const view = sp.vue === "liste" || q || status ? "liste" : "tableau";
  const canWrite = can(user.role, "dossier.write");

  const all = await listDossiers(user);
  const rows = view === "liste" && (q || status) ? await listDossiers(user, { q, status }) : all;
  const lostCount = all.filter((d) => d.status === "perdu").length;
  const openCount = all.length - lostCount;

  const t = await getTranslations("dossiers");
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const listHref = (s?: string) => {
    const query = new URLSearchParams({ vue: "liste" });
    if (s) query.set("statut", s);
    if (q) query.set("q", q);
    return `/dossiers?${query.toString()}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="sr-only">{t("title")}</h1>

      <div className="flex flex-wrap items-center gap-2">
        <nav aria-label={t("title")} className="flex rounded-md border border-border bg-card p-0.5 text-sm">
          <ViewLink href="/dossiers" active={view === "tableau"} label={t("viewBoard")}>
            <KanbanSquare className="size-4" />
          </ViewLink>
          <ViewLink href="/dossiers?vue=liste" active={view === "liste"} label={t("viewList")}>
            <List className="size-4" />
          </ViewLink>
        </nav>
        {canWrite ? (
          <Link href="/dossiers/nouveau" className={buttonVariants()}>
            <Plus />
            {t("newDossier")}
          </Link>
        ) : null}

        <p className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{t("count", { count: view === "tableau" ? openCount : rows.length })}</span>
          {view === "tableau" && lostCount > 0 ? (
            <Link href="/dossiers?vue=liste&statut=perdu" className="underline underline-offset-4 hover:text-foreground">
              {t("lostLink", { count: lostCount })}
            </Link>
          ) : null}
        </p>
      </div>

      {view === "liste" ? (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <FilterChip href={listHref()} active={!status}>
            {t("allStatuses")}
          </FilterChip>
          {DOSSIER_STATUSES.map((s) => (
            <FilterChip key={s} href={listHref(s)} active={status === s}>
              {t(`statuses.${s}`)}
            </FilterChip>
          ))}
          {q ? (
            <span className="ml-2 inline-flex items-center gap-2 text-muted-foreground">
              {t("searchResults", { q })}
              <Link
                href={status ? `/dossiers?vue=liste&statut=${status}` : "/dossiers?vue=liste"}
                aria-label={t("clearSearch")}
                title={t("clearSearch")}
                className="inline-flex size-6 items-center justify-center rounded-full border border-border bg-card hover:bg-accent"
              >
                <X className="size-3" />
              </Link>
            </span>
          ) : null}
        </div>
      ) : null}

      {all.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : view === "tableau" ? (
        <KanbanBoard dossiers={all} canWrite={canWrite} />
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {t("noResults")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.reference")}</TableHead>
                <TableHead>{t("columns.client")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.type")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("columns.date")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("columns.guests")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("columns.source")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{formatRef(d.number)}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/dossiers/${d.id}`} className="underline-offset-4 hover:underline">
                      {d.clientName}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{t(`types.${d.type}`)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {d.targetDate ? dateFmt.format(new Date(`${d.targetDate}T00:00:00Z`)) : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {d.guests !== null ? t("guests", { count: d.guests }) : "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{d.source ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} label={t(`statuses.${d.status}`)} />
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

function StatusBadge({ status, label }: { status: string; label: string }) {
  if (status === "perdu") return <Badge className="border-status-red/40 bg-card text-status-red">{label}</Badge>;
  if (status === "signe" || status === "solde") return <Badge tone="strong">{label}</Badge>;
  return <Badge>{label}</Badge>;
}

function ViewLink({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 transition-colors",
        active ? "bg-secondary font-medium text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {label}
    </Link>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground hover:bg-accent",
      )}
    >
      {children}
    </Link>
  );
}
