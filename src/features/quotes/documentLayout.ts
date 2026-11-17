// Where each piece of text sits on an A4 page. Pure: no PDF library here, so the layout can be
// tested by reading positions. Units are PDF points (1/72 inch), origin bottom-left.
import type { ContractDocument } from "./contractModel";
import type { QuoteDocument } from "./documentModel";

export const PAGE = { width: 595.28, height: 841.89, margin: 50 } as const;

export interface TextItem {
  x: number;
  y: number;
  size: number;
  bold: boolean;
  text: string;
}

const LINE = 13;
const COL = { label: 50, qty: 330, unitPrice: 370, vat: 455, total: 500 } as const;
const LABEL_CHARS = 42;
const BODY_CHARS = 92;

// Splits text into lines no wider than `width` characters, breaking only between words.
export function wrapText(text: string, width: number): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current === "" ? word : `${current} ${word}`;
    if (candidate.length <= width) {
      current = candidate;
    } else {
      if (current !== "") lines.push(current);
      current = word;
    }
  }
  if (current !== "") lines.push(current);
  return lines;
}

class Pager {
  readonly pages: TextItem[][] = [];
  private y = 0;
  private page: TextItem[] = [];

  constructor(private readonly repeat: () => void) {
    this.newPage(false);
  }

  private newPage(withHeader: boolean): void {
    this.page = [];
    this.pages.push(this.page);
    this.y = PAGE.height - PAGE.margin;
    if (withHeader) this.repeat();
  }

  // Makes sure `height` more points fit; otherwise moves to a fresh page (with the table header).
  room(height: number, withHeader: boolean): void {
    if (this.y - height < PAGE.margin + 40) this.newPage(withHeader);
  }

  put(x: number, text: string, size = 10, bold = false): void {
    this.page.push({ x, y: this.y, size, bold, text });
  }

  advance(points = LINE): void {
    this.y -= points;
  }

  get currentY(): number {
    return this.y;
  }
}

export function layoutDocument(doc: QuoteDocument): TextItem[][] {
  const pager = new Pager(() => tableHeader(pager, doc));
  pager.put(PAGE.margin, doc.title, 20, true);
  pager.advance(30);
  for (const row of metaRows(doc)) {
    pager.put(PAGE.margin, row, 10);
    pager.advance();
  }
  pager.advance(10);
  tableHeader(pager, doc);

  for (const l of doc.lines) {
    const labelLines = wrapText(`${l.label} (${l.unit})`, LABEL_CHARS);
    pager.room(labelLines.length * LINE, true);
    labelLines.forEach((text, index) => {
      if (index === 0) {
        pager.put(COL.label, text, 9);
        pager.put(COL.qty, l.quantity, 9);
        pager.put(COL.unitPrice, l.unitPrice, 9);
        pager.put(COL.vat, l.vatRate, 9);
        pager.put(COL.total, l.total, 9);
      } else {
        pager.put(COL.label, text, 9);
      }
      pager.advance();
    });
    pager.advance(4);
  }

  pager.room(LINE * 6, true);
  pager.advance(6);
  for (const [label, value, bold] of [
    [doc.labels.subtotal, doc.subtotal, false],
    [doc.labels.vat, doc.vat, false],
    [doc.labels.total, doc.total, true],
  ] as const) {
    pager.put(COL.vat - 60, label, 10, bold);
    pager.put(COL.total, value, 10, bold);
    pager.advance();
  }

  if (doc.notes !== null) {
    pager.advance(10);
    pager.room(LINE * 3, true);
    pager.put(PAGE.margin, doc.labels.notes, 10, true);
    pager.advance();
    for (const text of wrapText(doc.notes, BODY_CHARS)) {
      pager.room(LINE, true);
      pager.put(PAGE.margin, text, 10);
      pager.advance();
    }
  }
  return pager.pages;
}

// Contracts reuse the same pager: the header block, then each clause under its heading.
export function layoutContract(doc: ContractDocument): TextItem[][] {
  const pager = new Pager(() => undefined);
  pager.put(PAGE.margin, doc.title, 20, true);
  pager.advance(30);
  for (const row of metaRows(doc)) {
    pager.put(PAGE.margin, row, 10);
    pager.advance();
  }
  pager.advance(12);
  for (const section of doc.sections) {
    pager.room(LINE * 3, false);
    pager.put(PAGE.margin, section.heading, 11, true);
    pager.advance();
    for (const paragraph of section.paragraphs) {
      for (const text of wrapText(paragraph, BODY_CHARS)) {
        pager.room(LINE, false);
        pager.put(PAGE.margin, text, 10);
        pager.advance();
      }
    }
    pager.advance(8);
  }
  pager.room(LINE * 2, false);
  pager.advance(4);
  for (const text of wrapText(doc.draftNotice, BODY_CHARS)) {
    pager.put(PAGE.margin, text, 9);
    pager.advance();
  }
  return pager.pages;
}

function metaRows(doc: {
  reference: string;
  clientName: string;
  dealTitle: string;
  eventPeriod: string | null;
  validUntil: string | null;
  labels: { reference: string; client: string; event: string; validUntil: string };
}): string[] {
  const rows = [
    `${doc.labels.reference} : ${doc.reference}`,
    `${doc.labels.client} : ${doc.clientName}`,
    `${doc.labels.event} : ${doc.dealTitle}${doc.eventPeriod === null || doc.eventPeriod === "" ? "" : `, ${doc.eventPeriod}`}`,
  ];
  if (doc.validUntil !== null) rows.push(`${doc.labels.validUntil} : ${doc.validUntil}`);
  return rows;
}

function tableHeader(pager: Pager, doc: QuoteDocument): void {
  const c = doc.labels.columns;
  pager.put(COL.label, c.label, 9, true);
  pager.put(COL.qty, c.quantity, 9, true);
  pager.put(COL.unitPrice, c.unitPrice, 9, true);
  pager.put(COL.vat, c.vat, 9, true);
  pager.put(COL.total, c.total, 9, true);
  pager.advance();
}

export const LAYOUT_LIMITS = { labelChars: LABEL_CHARS, bodyChars: BODY_CHARS } as const;
