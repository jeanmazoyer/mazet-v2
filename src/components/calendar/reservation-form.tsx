"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createReservationAction } from "@/app/[locale]/(app)/calendrier/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { RESERVATION_KINDS } from "@/lib/dossiers";

// Sert au calendrier (choix du dossier) et à la fiche dossier (dossier imposé).
// En cas de chevauchement, c'est la base qui refuse et le message l'explique.
export function ReservationForm({
  dossiers,
  dossierId,
  idPrefix = "resa",
}: {
  dossiers?: { id: string; label: string }[];
  dossierId?: string;
  idPrefix?: string;
}) {
  const t = useTranslations("calendar");
  const te = useTranslations("errors");
  const [state, formAction, pending] = useActionState(createReservationAction, {});
  const [kind, setKind] = useState<string>("option");

  return (
    <form action={formAction} className="space-y-4">
      {dossierId ? (
        <input type="hidden" name="dossierId" value={dossierId} />
      ) : (
        <Field label={t("form.dossier")} htmlFor={`${idPrefix}-dossier`}>
          <Select id={`${idPrefix}-dossier`} name="dossierId" required defaultValue="">
            <option value="" disabled>
              {t("form.chooseDossier")}
            </option>
            {(dossiers ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.startDate")} htmlFor={`${idPrefix}-start`}>
          <Input id={`${idPrefix}-start`} name="startDate" type="date" required />
        </Field>
        <Field label={t("form.endDate")} htmlFor={`${idPrefix}-end`}>
          <Input id={`${idPrefix}-end`} name="endDate" type="date" required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.kind")} htmlFor={`${idPrefix}-kind`}>
          <Select id={`${idPrefix}-kind`} name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {RESERVATION_KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`kinds.${k}`)}
              </option>
            ))}
          </Select>
        </Field>
        {kind === "option" ? (
          <Field label={t("form.expiresOn")} htmlFor={`${idPrefix}-expires`}>
            <Input id={`${idPrefix}-expires`} name="optionExpiresOn" type="date" required />
          </Field>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className="rounded-md border border-status-red/40 px-3 py-2 text-sm text-status-red">
          {te(state.error)}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-status-green">
          {t("created")}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {t("form.create")}
      </Button>
    </form>
  );
}
