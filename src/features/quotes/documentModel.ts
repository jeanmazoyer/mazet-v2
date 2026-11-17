// The content of a quote, already formatted for its language. The PDF renderer only draws this;
// it never decides a figure, so what the test checks is what the client reads.

import { type DocLanguage, formatCents, formatDate, formatRate } from "./documentFormat";
import { DOCUMENT_LABELS } from "./documentLabels";

export interface QuoteLineSource {
  labelFr: string;
  labelEn: string;
  unit: "flat" | "per_day" | "per_person";
  quantity: number;
  unitPriceCents: number;
  vatRateBp: number;
  totalCents: number;
  vatCents: number;
}

export interface QuoteSource {
  language: DocLanguage;
  reference: string;
  validUntil: string | null;
  notes: string | null;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  lines: QuoteLineSource[];
  clientName: string;
  dealTitle: string;
  eventPeriod: string | null;
}

export interface QuoteLineView {
  label: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  total: string;
}

export interface QuoteDocument {
  title: string;
  reference: string;
  clientName: string;
  dealTitle: string;
  eventPeriod: string | null;
  lines: QuoteLineView[];
  subtotal: string;
  vat: string;
  total: string;
  validUntil: string | null;
  notes: string | null;
  labels: (typeof DOCUMENT_LABELS)[DocLanguage];
}

export function buildQuoteModel(q: QuoteSource): QuoteDocument {
  const lang = q.language;
  const labels = DOCUMENT_LABELS[lang];
  return {
    title: labels.quoteTitle,
    reference: q.reference,
    clientName: q.clientName,
    dealTitle: q.dealTitle,
    eventPeriod: q.eventPeriod,
    lines: q.lines.map((l) => ({
      label: lang === "fr" ? l.labelFr : l.labelEn,
      unit: labels.units[l.unit],
      quantity: String(l.quantity),
      unitPrice: formatCents(l.unitPriceCents, lang),
      vatRate: formatRate(l.vatRateBp, lang),
      total: formatCents(l.totalCents, lang),
    })),
    subtotal: formatCents(q.subtotalCents, lang),
    vat: formatCents(q.vatCents, lang),
    total: formatCents(q.totalCents, lang),
    validUntil: q.validUntil === null ? null : formatDate(q.validUntil, lang),
    notes: q.notes,
    labels,
  };
}
