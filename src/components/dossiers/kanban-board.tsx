"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { moveDossierAction } from "@/app/[locale]/(app)/dossiers/actions";
import { StatusDot } from "@/components/status-dot";
import { Link } from "@/i18n/navigation";
import { DOSSIER_STATUSES, formatRef, type DossierStatus } from "@/lib/dossiers";
import type { DossierListItem } from "@/lib/services/dossiers";
import { cn } from "@/lib/utils";

// Tableau par statut. Glisser une carte change le statut ; le menu « Déplacer vers »
// de chaque carte fait la même chose au clavier et au toucher.
// Le serveur revérifie le droit à chaque déplacement.
export function KanbanBoard({ dossiers, canWrite }: { dossiers: DossierListItem[]; canWrite: boolean }) {
  const t = useTranslations("dossiers");
  const te = useTranslations("errors");
  const locale = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });

  const [optimistic, applyMove] = useOptimistic(
    dossiers,
    (state: DossierListItem[], move: { id: string; status: DossierStatus }) =>
      state.map((d) => (d.id === move.id ? { ...d, status: move.status } : d)),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<DossierStatus | null>(null);

  function move(id: string, status: DossierStatus) {
    const current = optimistic.find((d) => d.id === id);
    if (!current || current.status === status) return;
    setError(null);
    startTransition(async () => {
      applyMove({ id, status });
      const result = await moveDossierAction(id, status);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-md border border-status-red/40 px-3 py-2 text-sm text-status-red">
          {te(error)}
        </p>
      ) : null}

      {/* Pas de défilement horizontal : les colonnes se partagent la largeur,
          puis passent à la ligne sur les écrans plus étroits. */}
      <div>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 xl:gap-2">
          {DOSSIER_STATUSES.map((status) => {
            const cards = optimistic.filter((d) => d.status === status);
            return (
              <li
                key={status}
                data-status={status}
                onDragOver={(e) => {
                  if (!canWrite || !draggingId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overStatus !== status) setOverStatus(status);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverStatus(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || draggingId;
                  setOverStatus(null);
                  setDraggingId(null);
                  if (canWrite && id) move(id, status);
                }}
                className={cn(
                  "flex min-w-0 flex-col rounded-lg border border-border bg-muted transition-colors",
                  overStatus === status && "border-foreground bg-accent",
                )}
              >
                <h2 className="flex items-center gap-2 px-2.5 pt-2.5 pb-2 text-sm font-medium">
                  <StatusDot status={status} />
                  <span className="min-w-0 truncate">{t(`statuses.${status}`)}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{cards.length}</span>
                </h2>

                <ul className="flex min-h-16 flex-1 flex-col gap-2 px-1.5 pb-1.5 xl:min-h-24">
                  {cards.length === 0 ? (
                    <li className="px-1 py-2 text-xs text-muted-foreground">{t("emptyColumn")}</li>
                  ) : null}
                  {cards.map((d) => (
                    <li
                      key={d.id}
                      data-dossier={formatRef(d.number)}
                      draggable={canWrite}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", d.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(d.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverStatus(null);
                      }}
                      className={cn(
                        // `relative` : garde les libellés sr-only dans la zone de défilement du tableau.
                        "relative min-w-0 rounded-md border border-border bg-card p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
                        canWrite && "cursor-grab active:cursor-grabbing",
                        draggingId === d.id && "opacity-50",
                      )}
                    >
                      <p className="font-mono text-xs text-muted-foreground">{formatRef(d.number)}</p>
                      <Link
                        href={`/dossiers/${d.id}`}
                        draggable={false}
                        className="mt-0.5 block text-sm font-medium break-words underline-offset-4 hover:underline"
                      >
                        {d.clientName}
                      </Link>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {t(`types.${d.type}`)}
                        {d.guests !== null ? ` · ${t("guests", { count: d.guests })}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {d.targetDate ? dateFmt.format(new Date(`${d.targetDate}T00:00:00Z`)) : t("noDate")}
                      </p>

                      {canWrite ? (
                        <label className="mt-2 block">
                          <span className="sr-only">{t("moveLabel", { ref: formatRef(d.number) })}</span>
                          <select
                            value={d.status}
                            onChange={(e) => move(d.id, e.target.value as DossierStatus)}
                            className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
                          >
                            {DOSSIER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s === d.status ? t(`statuses.${s}`) : `${t("moveTo")} : ${t(`statuses.${s}`)}`}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
