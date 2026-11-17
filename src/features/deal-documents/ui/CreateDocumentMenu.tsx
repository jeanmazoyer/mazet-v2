"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STRINGS } from "@/constants/strings";
import { trpc } from "@/lib/trpc-client";

// The message for a failed create: the app's own error id, or a generic line for anything else.
function errorText(id: string): string {
  const messages: Record<string, string> = STRINGS.documentsTab.errors;
  return messages[id] ?? STRINGS.documentsTab.createError;
}

// "Create new": a blank document, or one made from any template in the library.
export function CreateDocumentMenu({ dealId }: { dealId: string }): React.ReactNode {
  const utils = trpc.useUtils();
  const templates = trpc.dealDocuments.templates.list.useQuery();
  const create = trpc.dealDocuments.documents.create.useMutation({
    onSuccess: () => void utils.dealDocuments.documents.list.invalidate({ dealId }),
  });
  const [error, setError] = useState<string | null>(null);
  const t = STRINGS.documentsTab;

  const run = (title: string, templateId?: string): void => {
    setError(null);
    create.mutate(templateId === undefined ? { dealId, title } : { dealId, title, templateId }, {
      onError: (e) => setError(errorText(e.message)),
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" disabled={create.isPending}>
            {t.createNew}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => run(t.untitled)}>{t.blankDocument}</DropdownMenuItem>
          {(templates.data ?? []).map((tpl) => (
            <DropdownMenuItem key={tpl.id} onSelect={() => run(tpl.title, tpl.id)}>
              {t.fromTemplate}: {tpl.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {error !== null ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
