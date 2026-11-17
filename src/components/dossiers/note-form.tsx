"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { addNoteAction } from "@/app/[locale]/(app)/dossiers/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

export function NoteForm({ dossierId }: { dossierId: string }) {
  const t = useTranslations("dossiers.detail");
  const te = useTranslations("errors");
  const [state, formAction, pending] = useActionState(addNoteAction, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="space-y-2">
      <input type="hidden" name="dossierId" value={dossierId} />
      <label htmlFor="note-body" className="sr-only">
        {t("notes")}
      </label>
      <Textarea id="note-body" name="body" required maxLength={5000} placeholder={t("notePlaceholder")} />
      {state.error ? (
        <p role="alert" className="text-sm text-status-red">
          {te(state.error)}
        </p>
      ) : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {t("addNote")}
      </Button>
    </form>
  );
}
