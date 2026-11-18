// Downloads a document as a PDF. The file lives in the Drive of the person who made it, so the
// PDF is read with that account, whoever asks for it; visibility is checked first.
import type { AppError } from "@/constants/errorIds";
import { ERROR_IDS, AppError as Failure } from "@/constants/errorIds";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import { getDocumentForDownload } from "./documentsRepo";
import { type DriveConfig, driveForUser } from "./driveAccess";

export interface PdfDownload {
  bytes: Uint8Array;
  filename: string;
}

// A file name every system takes: no path separators or reserved characters, no doubled spaces.
export function pdfFilename(title: string): string {
  const cleaned = title
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${cleaned === "" ? "Document" : cleaned}.pdf`;
}

export async function downloadDocumentPdf(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  documentId: string,
  config: Omit<DriveConfig, "redirectUri">,
  signal: AbortSignal,
): Promise<Result<PdfDownload, AppError>> {
  const document = await getDocumentForDownload(db, actor, dealId, documentId, signal);
  if (!document.ok) return document;
  if (document.value.createdBy === null) {
    return err(
      new Failure(ERROR_IDS.DOCUMENT_NOT_FOUND, "Document has no owner to read it from", {
        documentId,
      }),
    );
  }
  const drive = await driveForUser(db, document.value.createdBy, config, signal);
  if (!drive.ok) return drive;
  const pdf = await drive.value.exportPdf(document.value.driveFileId, signal);
  if (!pdf.ok) return pdf;
  return ok({ bytes: pdf.value, filename: pdfFilename(document.value.title) });
}
