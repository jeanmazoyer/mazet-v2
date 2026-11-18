// The PDF of one document of a deal. Access is decided by the document layer; this route only maps
// the answer to an HTTP status, and never sends a file to someone who may not see it.
import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { ERROR_IDS } from "@/constants/errorIds";
import { downloadDocumentPdf } from "@/features/document-templates/documentDownload";
import { createContext } from "@/server/trpc/context";

const PDF_TIMEOUT_MS = 30_000;

function statusFor(id: string): number {
  if (id === ERROR_IDS.DOCUMENT_NOT_FOUND || id === ERROR_IDS.DEAL_NOT_FOUND) return 404;
  if (id === ERROR_IDS.PERM_DENIED) return 403;
  if (id === ERROR_IDS.DRIVE_NOT_CONNECTED) return 409;
  return 502;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealId: string; documentId: string }> },
): Promise<NextResponse> {
  const ctx = await createContext();
  if (ctx.actor === null)
    return NextResponse.json({ error: ERROR_IDS.AUTH_SESSION_DEAD }, { status: 401 });
  const { dealId, documentId } = await params;
  const result = await downloadDocumentPdf(
    ctx.db,
    ctx.actor,
    dealId,
    documentId,
    {
      clientId: env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      fetchFn: fetch,
    },
    AbortSignal.timeout(PDF_TIMEOUT_MS),
  );
  if (!result.ok)
    return NextResponse.json({ error: result.error.id }, { status: statusFor(result.error.id) });
  return new NextResponse(
    new Blob([new Uint8Array(result.value.bytes)], { type: "application/pdf" }),
    {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.value.filename)}`,
      },
    },
  );
}
