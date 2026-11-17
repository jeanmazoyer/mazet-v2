"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import type { FormState } from "@/lib/action-helpers";
import { CLIENT_LANGUAGES, DOSSIER_TYPES } from "@/lib/dossiers";

export type DossierFormValues = {
  dossierId?: string;
  clientName?: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientLanguage?: string;
  clientCountry?: string | null;
  type?: string;
  targetDate?: string | null;
  guests?: number | null;
  source?: string | null;
};

export function DossierForm({
  action,
  values = {},
  submitLabel,
  disabled = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  values?: DossierFormValues;
  submitLabel: string;
  disabled?: boolean;
}) {
  const t = useTranslations("dossiers");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {values.dossierId ? <input type="hidden" name="dossierId" value={values.dossierId} /> : null}

      <fieldset disabled={disabled || pending} className="space-y-4">
        <legend className="text-sm font-medium text-muted-foreground">{t("form.client")}</legend>
        <Field label={t("form.clientName")} htmlFor="clientName">
          <Input id="clientName" name="clientName" required maxLength={200} defaultValue={values.clientName ?? ""} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("form.clientEmail")} htmlFor="clientEmail" hint={tc("optional")}>
            <Input id="clientEmail" name="clientEmail" type="email" defaultValue={values.clientEmail ?? ""} />
          </Field>
          <Field label={t("form.clientPhone")} htmlFor="clientPhone" hint={tc("optional")}>
            <Input id="clientPhone" name="clientPhone" type="tel" defaultValue={values.clientPhone ?? ""} />
          </Field>
          <Field label={t("form.clientLanguage")} htmlFor="clientLanguage">
            <Select id="clientLanguage" name="clientLanguage" defaultValue={values.clientLanguage ?? "fr"}>
              {CLIENT_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {t(`languages.${l}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("form.clientCountry")} htmlFor="clientCountry" hint={tc("optional")}>
            <Input id="clientCountry" name="clientCountry" defaultValue={values.clientCountry ?? ""} />
          </Field>
        </div>
      </fieldset>

      <fieldset disabled={disabled || pending} className="space-y-4">
        <legend className="text-sm font-medium text-muted-foreground">{t("form.request")}</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("form.type")} htmlFor="type">
            <Select id="type" name="type" defaultValue={values.type ?? "mariage"}>
              {DOSSIER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`types.${type}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("form.targetDate")} htmlFor="targetDate" hint={tc("optional")}>
            <Input id="targetDate" name="targetDate" type="date" defaultValue={values.targetDate ?? ""} />
          </Field>
          <Field label={t("form.guests")} htmlFor="guests" hint={tc("optional")}>
            <Input id="guests" name="guests" type="number" min={0} step={1} defaultValue={values.guests ?? ""} />
          </Field>
        </div>
        <Field label={t("form.source")} htmlFor="source" hint={tc("optional")}>
          <Input
            id="source"
            name="source"
            placeholder={t("form.sourcePlaceholder")}
            defaultValue={values.source ?? ""}
          />
        </Field>
      </fieldset>

      {state.error ? (
        <p role="alert" className="text-sm text-status-red">
          {te(state.error)}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-status-green">
          {tc("saved")}
        </p>
      ) : null}

      {disabled ? null : (
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
      )}
    </form>
  );
}
