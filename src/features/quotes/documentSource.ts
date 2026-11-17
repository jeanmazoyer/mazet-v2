// Turns stored quote data into the inputs of the document models: the reference, the event
// period as a sentence, and the language the client reads.
import { type DocLanguage, formatDate } from "./documentFormat";
import type { QuoteSource } from "./documentModel";
import type { QuoteDocumentData } from "./quoteDocument";

export function quoteReference(dealId: string, version: number): string {
  return `DV-${version}-${dealId.slice(0, 8).toUpperCase()}`;
}

export function eventPeriodText(
  start: string | null,
  end: string | null,
  lang: DocLanguage,
): string | null {
  if (start === null || end === null) return null;
  if (start === end) return formatDate(start, lang);
  return lang === "fr"
    ? `du ${formatDate(start, lang)} au ${formatDate(end, lang)}`
    : `from ${formatDate(start, lang)} to ${formatDate(end, lang)}`;
}

export function toQuoteSource(
  data: QuoteDocumentData,
  dealId: string,
  lang: DocLanguage,
): QuoteSource {
  return {
    language: lang,
    reference: quoteReference(dealId, data.quote.version),
    validUntil: data.quote.validUntil,
    notes: null,
    subtotalCents: data.quote.subtotalCents,
    vatCents: data.quote.vatCents,
    totalCents: data.quote.totalCents,
    lines: data.lines,
    clientName: data.clientName,
    dealTitle: data.dealTitle,
    eventPeriod: eventPeriodText(data.eventStart, data.eventEnd, lang),
  };
}
