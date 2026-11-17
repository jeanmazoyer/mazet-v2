"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { moveDossierAction } from "@/app/[locale]/(app)/dossiers/actions";
import { Button } from "@/components/ui/button";
import { PIPELINE_STAGES, type DossierStatus } from "@/lib/dossiers";
import { cn } from "@/lib/utils";

// Chevrons emboîtés : pointe à droite, encoche à gauche (sauf le premier).
const POINT = "0.6rem";
const FIRST = `polygon(0 0, calc(100% - ${POINT}) 0, 100% 50%, calc(100% - ${POINT}) 100%, 0 100%)`;
const NEXT = `polygon(0 0, calc(100% - ${POINT}) 0, 100% 50%, calc(100% - ${POINT}) 100%, 0 100%, ${POINT} 50%)`;

// Barre d'étapes du dossier. Cliquer une étape y place le dossier ; les étapes
// franchies sont en vert. « Perdu » est une issue à part, avec réouverture possible.
export function StageBar({
  dossierId,
  status,
  canWrite,
}: {
  dossierId: string;
  status: DossierStatus;
  canWrite: boolean;
}) {
  const t = useTranslations("dossiers");
  const te = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const lost = status === "perdu";
  const currentIndex = PIPELINE_STAGES.findIndex((s) => s === status);

  function go(next: DossierStatus) {
    if (next === status) return;
    setError(null);
    startTransition(async () => {
      const result = await moveDossierAction(dossierId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <ol aria-label={t("stageBar")} className="flex min-w-0 flex-1 basis-80">
          {PIPELINE_STAGES.map((stage, index) => {
            const reached = !lost && index <= currentIndex;
            const isCurrent = !lost && index === currentIndex;
            return (
              <li key={stage} className={cn("min-w-0 flex-1", index > 0 && "-ml-1")}>
                <button
                  type="button"
                  disabled={!canWrite || pending}
                  aria-current={isCurrent ? "step" : undefined}
                  title={t(`statuses.${stage}`)}
                  onClick={() => go(stage)}
                  style={{ clipPath: index === 0 ? FIRST : NEXT }}
                  className={cn(
                    "h-8 w-full truncate px-3 text-xs font-medium outline-none transition-colors focus-visible:underline disabled:cursor-default",
                    reached ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                    canWrite && !reached && "hover:bg-border",
                    isCurrent && "font-semibold",
                  )}
                >
                  <span className={cn(!isCurrent && "sr-only sm:not-sr-only")}>{t(`statuses.${stage}`)}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {canWrite ? (
          lost ? (
            <Button variant="outline" size="sm" disabled={pending} onClick={() => go("demande")}>
              {t("reopen")}
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => go("perdu")}
              className="bg-status-red text-white hover:bg-status-red/90 dark:text-black"
            >
              {t("markLost")}
            </Button>
          )
        ) : null}
      </div>

      {lost ? (
        <p className="rounded-md border border-status-red/40 bg-card px-3 py-2 text-sm text-status-red">
          {t("lostBanner")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-status-red">
          {te(error)}
        </p>
      ) : null}
    </div>
  );
}
