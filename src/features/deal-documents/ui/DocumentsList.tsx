"use client";
import { STRINGS } from "@/constants/strings";
import { trpc } from "@/lib/trpc-client";

// "Documents created": every document made for this deal, newest first, with its status.
export function DocumentsList({ dealId }: { dealId: string }): React.ReactNode {
  const query = trpc.dealDocuments.documents.list.useQuery({ dealId });
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
    return <p className="text-sm text-muted-foreground">{t.noDocuments}</p>;
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {query.data.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 p-4 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{doc.title}</p>
            <p className="text-xs text-muted-foreground">
              {doc.templateTitle ?? t.blankDocument} ·{" "}
              {new Date(doc.createdAt).toISOString().slice(0, 10)}
            </p>
          </div>
          <span className="shrink-0 rounded border px-2 py-0.5 text-xs uppercase text-muted-foreground">
            {t.draft}
          </span>
        </li>
      ))}
    </ul>
  );
}
