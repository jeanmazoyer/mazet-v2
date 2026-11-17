"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { moveDossierAction } from "@/app/[locale]/(app)/dossiers/actions";
import { StatusDot } from "@/components/status-dot";
import { Select } from "@/components/ui/field";
import { DOSSIER_STATUSES, type DossierStatus } from "@/lib/dossiers";

export function StatusSelect({
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

  return (
    <div className="space-y-1.5">
      <label htmlFor="dossier-status" className="flex items-center gap-2 text-sm font-medium">
        <StatusDot status={status} />
        {t("detail.status")}
      </label>
      <Select
        id="dossier-status"
        value={status}
        disabled={!canWrite || pending}
        onChange={(e) => {
          const next = e.target.value;
          setError(null);
          startTransition(async () => {
            const result = await moveDossierAction(dossierId, next);
            if (result.error) setError(result.error);
          });
        }}
      >
        {DOSSIER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`statuses.${s}`)}
          </option>
        ))}
      </Select>
      {error ? (
        <p role="alert" className="text-sm text-status-red">
          {te(error)}
        </p>
      ) : null}
    </div>
  );
}
