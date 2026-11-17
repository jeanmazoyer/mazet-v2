"use client";
import { STRINGS } from "@/constants/strings";
import { trpc } from "@/lib/trpc-client";

// The template library, shared by the whole team. Templates are added from Google Drive.
export function TemplatesList(): React.ReactNode {
  const query = trpc.dealDocuments.templates.list.useQuery();
  const t = STRINGS.documentsTab;
  if (query.isPending)
    return <p className="text-sm text-muted-foreground">{STRINGS.dealRecords.loading}</p>;
  if (query.isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {STRINGS.dealRecords.loadError}
      </p>
    );
  if (query.data.length === 0)
    return <p className="text-sm text-muted-foreground">{t.noTemplates}</p>;
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {query.data.map((tpl) => (
        <li key={tpl.id} className="p-4 text-sm">
          <p className="font-medium">{tpl.title}</p>
          <p className="text-xs text-muted-foreground">{tpl.category}</p>
        </li>
      ))}
    </ul>
  );
}
