"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRightLeft } from "lucide-react";
import { moveDossierAction } from "@/app/[locale]/(app)/dossiers/actions";
import { Link } from "@/i18n/navigation";
import { DOSSIER_STATUSES, PIPELINE_STAGES, formatRef, type DossierStatus } from "@/lib/dossiers";
import type { DossierListItem } from "@/lib/services/dossiers";
import { cn } from "@/lib/utils";

// Pipeline : une colonne par étape. Glisser une carte change l'étape ; le bouton
// « Déplacer » de chaque carte fait la même chose au clavier et au toucher.
// Les dossiers perdus sortent du tableau (zone de dépôt en bas pendant le glisser).
// Pas de défilement horizontal : les colonnes se partagent la largeur disponible.
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
  const [overTarget, setOverTarget] = useState<DossierStatus | null>(null);

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

  function dropHandlers(status: DossierStatus) {
    return {
      onDragOver: (e: React.DragEvent) => {
        if (!canWrite || !draggingId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (overTarget !== status) setOverTarget(status);
      },
      onDragLeave: (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverTarget(null);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain") || draggingId;
        setOverTarget(null);
        setDraggingId(null);
        if (canWrite && id) move(id, status);
      },
    };
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-md border border-status-red/40 bg-card px-3 py-2 text-sm text-status-red">
          {te(error)}
        </p>
      ) : null}

      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {PIPELINE_STAGES.map((status) => {
          const cards = optimistic.filter((d) => d.status === status);
          return (
            <li
              key={status}
              data-status={status}
              {...dropHandlers(status)}
              className={cn(
                "flex min-w-0 flex-col rounded-lg bg-muted transition-colors xl:min-h-[calc(100dvh-13rem)]",
                overTarget === status && "bg-accent ring-2 ring-primary ring-inset",
              )}
            >
              <div className="px-3 pt-3 pb-2">
                <h2 className="truncate text-sm font-semibold">{t(`statuses.${status}`)}</h2>
                <p className="text-xs text-muted-foreground">{t("count", { count: cards.length })}</p>
              </div>

              <ul className="flex flex-1 flex-col gap-1.5 px-1.5 pb-1.5">
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
                      setOverTarget(null);
                    }}
                    className={cn(
                      // `relative` : garde les éléments positionnés (menu, libellés sr-only) dans la carte.
                      "relative min-w-0 rounded-md border border-border bg-card p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)]",
                      canWrite && "cursor-grab active:cursor-grabbing",
                      draggingId === d.id && "opacity-50",
                    )}
                  >
                    <Link
                      href={`/dossiers/${d.id}`}
                      draggable={false}
                      className="block text-sm font-semibold break-words underline-offset-4 hover:underline"
                    >
                      {d.clientName}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`types.${d.type}`)}
                      {d.guests !== null ? ` · ${t("guests", { count: d.guests })}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.targetDate ? dateFmt.format(new Date(`${d.targetDate}T00:00:00Z`)) : t("noDate")}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">{formatRef(d.number)}</span>
                      {canWrite ? (
                        <span className="relative inline-flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25 hover:bg-accent hover:text-foreground">
                          <ArrowRightLeft className="size-3" aria-hidden="true" />
                          <select
                            aria-label={t("move", { ref: formatRef(d.number) })}
                            title={t("move", { ref: formatRef(d.number) })}
                            value={d.status}
                            onChange={(e) => move(d.id, e.target.value as DossierStatus)}
                            className="absolute inset-0 size-full cursor-pointer opacity-0"
                          >
                            {DOSSIER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {t(`statuses.${s}`)}
                              </option>
                            ))}
                          </select>
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      {canWrite && draggingId ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center p-4">
          <div
            data-drop="perdu"
            {...dropHandlers("perdu")}
            className={cn(
              "pointer-events-auto w-full max-w-xl rounded-lg border-2 border-dashed border-status-red bg-card px-4 py-4 text-center text-sm font-medium text-status-red shadow-lg",
              overTarget === "perdu" && "bg-status-red/10",
            )}
          >
            {t("dropLost")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
