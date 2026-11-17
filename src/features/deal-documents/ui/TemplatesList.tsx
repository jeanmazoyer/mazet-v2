"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { STRINGS } from "@/constants/strings";
import { extractDriveFileId } from "@/features/document-templates/googleDrive/fileId";
import {
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
} from "@/features/document-templates/templateRules";
import { trpc } from "@/lib/trpc-client";

const CATEGORY_OPTIONS = TEMPLATE_CATEGORIES.map((c) => ({
  value: c,
  label: STRINGS.documentsTab.categories[c],
}));

// The template library. An administrator adds a template by pasting its Google Doc link; the
// document stays where it is in Drive and the app keeps a reference to it.
export function TemplatesList(): React.ReactNode {
  const utils = trpc.useUtils();
  const query = trpc.dealDocuments.templates.list.useQuery();
  const create = trpc.dealDocuments.templates.create.useMutation({
    onSuccess: () => void utils.dealDocuments.templates.list.invalidate(),
  });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("contract");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const t = STRINGS.documentsTab;

  const submit = (): void => {
    setMessage(null);
    const driveFileId = extractDriveFileId(link);
    if (driveFileId === null) {
      setMessage({ tone: "error", text: t.invalidLink });
      return;
    }
    startTransition(() => {
      create.mutate(
        { title: title.trim(), category, driveFileId },
        {
          onSuccess: () => {
            setTitle("");
            setLink("");
            setMessage({ tone: "ok", text: t.templateSaved });
          },
          onError: (e) => {
            const messages: Record<string, string> = t.errors;
            setMessage({ tone: "error", text: messages[e.message] ?? t.createError });
          },
        },
      );
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {query.isPending ? (
        <p className="text-sm text-muted-foreground">{STRINGS.dealRecords.loading}</p>
      ) : query.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {STRINGS.dealRecords.loadError}
        </p>
      ) : query.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noTemplates}</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {query.data.map((tpl) => (
            <li key={tpl.id} className="p-4 text-sm">
              <p className="font-medium">{tpl.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.categories[tpl.category as TemplateCategory]}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[minmax(0,1fr)_12rem_minmax(0,1.4fr)_auto] md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-1 text-sm">
          <span className="text-muted-foreground">{t.templateTitle}</span>
          <Input
            aria-label={t.templateTitle}
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-muted-foreground">{t.templateCategory}</span>
          <Select
            ariaLabel={t.templateCategory}
            value={category}
            onChange={(v) =>
              setCategory(v === "quote" || v === "invoice" || v === "other" ? v : "contract")
            }
            options={CATEGORY_OPTIONS}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-muted-foreground">{t.templateLink}</span>
          <Input
            aria-label={t.templateLink}
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">{t.templateLinkHelp}</span>
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={pending || title.trim() === "" || link.trim() === ""}
        >
          {t.addTemplate}
        </Button>
      </form>
      {message !== null ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={
            message.tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
