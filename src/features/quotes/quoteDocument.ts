// Everything a quote or contract document needs, read once under the deal's visibility rules.
import { and, eq, max, min } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { deals } from "@/db/schema/deals";
import { persons } from "@/db/schema/persons";
import { quoteLines } from "@/db/schema/quotes";
import { reservations } from "@/db/schema/reservations";
import { recordChange } from "@/features/collaboration/changeLog";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import type { QuoteLineSource } from "./documentModel";
import { listQuotes, type QuoteRow } from "./quoteRepo";

export interface QuoteDocumentData {
  quote: QuoteRow;
  lines: QuoteLineSource[];
  clientName: string;
  dealTitle: string;
  eventStart: string | null;
  eventEnd: string | null;
}

export async function loadQuoteDocument(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  quoteId: string,
  signal: AbortSignal,
): Promise<Result<QuoteDocumentData, AppError>> {
  const listed = await listQuotes(db, actor, dealId, signal);
  if (!listed.ok) return err(listed.error);
  const quote = listed.value.find((q) => q.id === quoteId);
  if (quote === undefined) return err(new AppError(ERROR_IDS.QUOTE_NOT_FOUND, "Quote not found"));

  const rows = await db
    .select({
      labelFr: quoteLines.labelFr,
      labelEn: quoteLines.labelEn,
      unit: quoteLines.unit,
      quantity: quoteLines.quantity,
      unitPriceCents: quoteLines.unitPriceCents,
      vatRateBp: quoteLines.vatRateBp,
      totalCents: quoteLines.totalCents,
      vatCents: quoteLines.vatCents,
    })
    .from(quoteLines)
    .where(eq(quoteLines.quoteId, quoteId))
    .orderBy(quoteLines.position);
  signal.throwIfAborted();

  const [deal] = await db
    .select({ title: deals.title, clientName: persons.name })
    .from(deals)
    .leftJoin(persons, eq(persons.id, deals.personId))
    .where(eq(deals.id, dealId))
    .limit(1);

  const [period] = await db
    .select({ start: min(reservations.startDate), end: max(reservations.endDate) })
    .from(reservations)
    .where(and(eq(reservations.dealId, dealId), eq(reservations.state, "active")));

  return ok({
    quote,
    lines: rows,
    clientName: deal?.clientName ?? deal?.title ?? "",
    dealTitle: deal?.title ?? "",
    eventStart: period?.start ?? null,
    eventEnd: period?.end ?? null,
  });
}

// A document leaving the system is an event the team must be able to trace (who sent which
// version, to which language). Recorded in the same audit trail as the deal's other changes.
export async function recordDocumentExport(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  quoteId: string,
  kind: "quote" | "contract",
  lang: "fr" | "en",
  signal: AbortSignal,
): Promise<void> {
  await recordChange(
    db,
    {
      entityType: "deal",
      entityId: dealId,
      field: "document_export",
      oldValue: null,
      newValue: { kind, lang, quoteId },
      actorId: actor.id,
    },
    signal,
  );
}
