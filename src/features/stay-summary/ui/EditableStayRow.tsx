"use client";
import type React from "react";
import { useState } from "react";
import { FieldRow } from "@/features/deal-workspace/sidebar/FieldRow";
import { InlineEditFooter } from "@/features/inline-edit/InlineEditFooter";
import { InlineFieldShell } from "@/features/inline-edit/InlineFieldShell";

// One fact of the booking, read as text and edited in place: a click on the row swaps the text
// for the editor suited to its kind (date, time, list, number, text), with Save and Cancel under
// it. The row owns the draft; the parent says how to show it and how to save it.
export function EditableStayRow<T>({
  label,
  display,
  emptyPrompt,
  initial,
  isDirty,
  renderEditor,
  onSave,
  onStartEditInstead,
}: {
  label: string;
  // What the row shows when it is not being edited; null for a fact not recorded yet.
  display: React.ReactNode | null;
  emptyPrompt: string;
  initial: T;
  isDirty: (draft: T) => boolean;
  renderEditor: (draft: T, setDraft: (next: T) => void) => React.ReactNode;
  // Resolves to an error message to show, or null when the change was saved.
  onSave: (draft: T) => Promise<string | null>;
  // When set, a click opens something else (the whole section's editor) instead of this row's.
  onStartEditInstead?: () => void;
}): React.ReactNode {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<T>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function start(): void {
    if (onStartEditInstead !== undefined) {
      onStartEditInstead();
      return;
    }
    setDraft(initial);
    setError(null);
    setEditing(true);
  }

  function save(): void {
    setPending(true);
    setError(null);
    void onSave(draft).then((message) => {
      setPending(false);
      if (message === null) setEditing(false);
      else setError(message);
    });
  }

  return (
    <FieldRow label={label} empty={display === null}>
      <InlineFieldShell
        label={label}
        editing={editing}
        onStartEdit={start}
        value={display}
        emptyPrompt={emptyPrompt}
      >
        <div>
          {renderEditor(draft, setDraft)}
          {error !== null ? (
            <span role="alert" className="mt-1 block text-destructive text-xs">
              {error}
            </span>
          ) : null}
          <InlineEditFooter
            onCancel={() => setEditing(false)}
            onSave={save}
            saveDisabled={!isDirty(draft)}
            pending={pending}
          />
        </div>
      </InlineFieldShell>
    </FieldRow>
  );
}
