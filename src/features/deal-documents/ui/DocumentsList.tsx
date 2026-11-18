"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STRINGS } from "@/constants/strings";
import {
  googleDocEditUrl,
  googleDocPreviewUrl,
} from "@/features/document-templates/googleDrive/preview";
import { trpc } from "@/lib/trpc-client";

interface DocRow {
  id: string;
  title: string;
  driveFileId: string;
  templateTitle: string | null;
  createdAt: Date | string;
}

// "Documents created": every document made for this deal, newest first, with its status. A
// document opens as a preview inside the app; its edit link opens it in Google Docs.
export function DocumentsList({ dealId }: { dealId: string }): React.ReactNode {
  const query = trpc.dealDocuments.documents.list.useQuery({ dealId });
  const [open, setOpen] = useState<DocRow | null>(null);
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
    <>
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
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded border px-2 py-0.5 text-xs uppercase text-muted-foreground">
                {t.draft}
              </span>
              <Button
                size="sm"
                variant="outline"
                aria-label={`${t.preview}: ${doc.title}`}
                onClick={() => setOpen(doc)}
              >
                {t.preview}
              </Button>
              <a
                href={`/api/deals/${dealId}/documents/${doc.id}/pdf`}
                className="text-sm underline underline-offset-4"
              >
                {t.downloadPdf}
              </a>
            </div>
          </li>
        ))}
      </ul>
      <Dialog
        open={open !== null}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{open?.title}</DialogTitle>
          </DialogHeader>
          {open !== null ? (
            <>
              <iframe
                title={open.title}
                src={googleDocPreviewUrl(open.driveFileId)}
                className="h-[70vh] w-full rounded border"
              />
              <a
                href={googleDocEditUrl(open.driveFileId)}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline underline-offset-4"
              >
                {t.openInDocs}
              </a>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
