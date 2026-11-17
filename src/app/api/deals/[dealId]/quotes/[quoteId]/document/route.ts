import type { NextRequest } from "next/server";
import { z } from "zod";
import { buildDocumentPdf } from "@/features/quotes/buildDocument";
import { parseDocumentQuery } from "@/features/quotes/documentQuery";
import { toQuoteSource } from "@/features/quotes/documentSource";
import { loadQuoteDocument, recordDocumentExport } from "@/features/quotes/quoteDocument";
import { createContext } from "@/server/trpc/context";

// The PDF of a quote (devis) or of its rental agreement (contrat). Read-only apart from the
// export record: the figures come from the stored quote, never from the URL.

const uuid = z.string().uuid();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dealId: string; quoteId: string }> },
): Promise<Response> {
  const ctx = await createContext();
  if (ctx.actor === null) return new Response("Sign in first.", { status: 401 });

  const { dealId, quoteId } = await params;
  if (!uuid.safeParse(dealId).success || !uuid.safeParse(quoteId).success) {
    return new Response(null, { status: 404 });
  }

  const query = parseDocumentQuery(new URL(req.url).searchParams);
  if (!query.ok) return new Response("Invalid document request.", { status: 400 });

  const signal = AbortSignal.timeout(20_000);
  const loaded = await loadQuoteDocument(ctx.db, ctx.actor, dealId, quoteId, signal);
  if (!loaded.ok) return new Response(null, { status: 404 });

  if (query.value.kind === "contract" && loaded.value.quote.status !== "accepted") {
    return new Response("A rental agreement needs an accepted quote.", { status: 409 });
  }

  const file = await buildDocumentPdf(
    query.value,
    toQuoteSource(loaded.value, dealId, query.value.lang),
  );
  await recordDocumentExport(
    ctx.db,
    ctx.actor,
    dealId,
    quoteId,
    query.value.kind,
    query.value.lang,
    signal,
  );

  return new Response(new Uint8Array(file.bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
