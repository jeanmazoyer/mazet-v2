"use client";
import type React from "react";
import { STRINGS } from "@/constants/strings";
import { SectionHeading } from "@/features/deal-workspace/SectionHeading";
import { formatShortDate } from "@/features/document-templates/fieldValues";
import {
  driveFileViewUrl,
  googleDocEditUrl,
} from "@/features/document-templates/googleDrive/preview";
import { requestDownloadAction } from "@/features/files/serverActions";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";
import { readCsrfToken } from "@/utils/csrfCookie";
import { type DocumentKind, documentKind } from "../documentKind";

const D = STRINGS.documentCards;

// One colour per family of file, the way office suites paint them: red for a PDF, blue for a
// text document, green for a spreadsheet, amber for slides, violet for a picture.
const TONE: Record<DocumentKind, string> = {
  pdf: "border-l-red-500 [&>span:first-child]:bg-red-50 [&>span:first-child]:text-red-700",
  doc: "border-l-blue-500 [&>span:first-child]:bg-blue-50 [&>span:first-child]:text-blue-700",
  sheet:
    "border-l-emerald-500 [&>span:first-child]:bg-emerald-50 [&>span:first-child]:text-emerald-700",
  slides: "border-l-amber-500 [&>span:first-child]:bg-amber-50 [&>span:first-child]:text-amber-700",
  image:
    "border-l-violet-500 [&>span:first-child]:bg-violet-50 [&>span:first-child]:text-violet-700",
  other: "border-l-slate-400 [&>span:first-child]:bg-slate-100 [&>span:first-child]:text-slate-600",
};
const CARD =
  "flex w-72 items-center gap-2.5 rounded-md border border-l-4 bg-card p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Card {
  key: string;
  title: string;
  kind: DocumentKind;
  day: string;
  // A Drive file opens at its address; an uploaded file needs a download link minted on click.
  href?: string;
  fileId?: string;
}

async function openUpload(fileId: string): Promise<void> {
  const result = await requestDownloadAction(readCsrfToken(), fileId);
  if (!result.ok) return;
  // An anchor click, not window.open: the link is minted after an await, so the user's gesture
  // is gone by then and a pop-up would be blocked.
  const anchor = document.createElement("a");
  anchor.href = result.value.url;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  anchor.click();
}

function CardBody({ card }: { card: Card }): React.ReactNode {
  return (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded font-bold text-[10px]">
        {D.badges[card.kind]}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-sm">{card.title}</span>
        <span className="block text-muted-foreground text-xs">
          {D.kinds[card.kind]} · {card.day}
        </span>
      </span>
    </>
  );
}

// Every document of a deal as a row of small cards above the timeline: the files kept in Drive
// (made from a template, or attached as they are) and the files uploaded to the deal.
export function DocumentCards({ dealId }: { dealId: string }): React.ReactNode {
  const drive = trpc.dealDocuments.documents.list.useQuery({ dealId }).data ?? [];
  const uploads =
    trpc.files.listForEntity.useQuery({ entityType: "deal", entityId: dealId }).data ?? [];

  const cards: Card[] = [
    ...drive.map((doc) => ({
      key: `drive-${doc.id}`,
      title: doc.title,
      kind: documentKind(doc.mimeType),
      day: formatShortDate(new Date(doc.createdAt).toISOString().slice(0, 10)),
      href:
        doc.mimeType === null
          ? googleDocEditUrl(doc.driveFileId)
          : driveFileViewUrl(doc.driveFileId),
    })),
    ...uploads.map((file) => ({
      key: `upload-${file.id}`,
      title: file.filename,
      kind: documentKind(file.contentType, file.filename),
      day: formatShortDate(new Date(file.createdAt).toISOString().slice(0, 10)),
      fileId: file.id,
    })),
  ];
  if (cards.length === 0) return null;

  return (
    <section aria-label="documents">
      <SectionHeading>{D.title}</SectionHeading>
      <ul className="flex flex-wrap gap-2">
        {cards.map((card) => (
          <li key={card.key}>
            {card.href !== undefined ? (
              <a
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(CARD, TONE[card.kind])}
              >
                <CardBody card={card} />
              </a>
            ) : (
              <button
                type="button"
                className={cn(CARD, TONE[card.kind])}
                onClick={() => void openUpload(card.fileId ?? "")}
              >
                <CardBody card={card} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
