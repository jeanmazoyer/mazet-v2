import { describe, expect, it } from "vitest";
import { layoutDocument, PAGE, wrapText } from "./documentLayout";
import { buildQuoteModel, type QuoteLineSource } from "./documentModel";

const line = (i: number): QuoteLineSource => ({
  labelFr: `Prestation ${i}`,
  labelEn: `Service ${i}`,
  unit: "flat",
  quantity: 1,
  unitPriceCents: 10000,
  vatRateBp: 2000,
  totalCents: 10000,
  vatCents: 2000,
});

const base = {
  language: "fr" as const,
  reference: "DV-0001-1",
  validUntil: "2027-06-30",
  notes: null,
  subtotalCents: 10000,
  vatCents: 2000,
  totalCents: 12000,
  clientName: "Client fictif",
  dealTitle: "Mariage Alpha",
  eventPeriod: null,
};

describe("wrapText", () => {
  it("breaks a long paragraph into lines no longer than the width, on word boundaries", () => {
    const lines = wrapText("un deux trois quatre cinq six sept huit neuf dix", 12);
    expect(lines.every((l) => l.length <= 12)).toBe(true);
    expect(lines.join(" ")).toBe("un deux trois quatre cinq six sept huit neuf dix");
  });
});

describe("layoutDocument", () => {
  it("puts the total on the first page for a short quote", () => {
    const doc = buildQuoteModel({ ...base, lines: [line(1), line(2)] });
    const pages = layoutDocument(doc);
    expect(pages).toHaveLength(1);
    const texts = pages[0]?.map((i) => i.text) ?? [];
    expect(texts).toContain("120,00 €");
    // Plain spaces only: the PDF fonts cannot draw the narrow no-break space Intl uses.
    expect(texts.some((t) => /[\u202f\u00a0]/.test(t))).toBe(false);
  });

  it("starts a new page when a long quote runs out of room, and repeats the column headers", () => {
    const doc = buildQuoteModel({
      ...base,
      lines: Array.from({ length: 60 }, (_, i) => line(i + 1)),
    });
    const pages = layoutDocument(doc);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[1]?.some((i) => i.text === "Prestation")).toBe(true);
  });

  it("keeps every item inside the printable area of the page", () => {
    const doc = buildQuoteModel({ ...base, notes: "Note ".repeat(200), lines: [line(1)] });
    for (const page of layoutDocument(doc)) {
      for (const item of page) {
        expect(item.x).toBeGreaterThanOrEqual(PAGE.margin);
        expect(item.y).toBeGreaterThanOrEqual(PAGE.margin - 1);
        expect(item.y).toBeLessThanOrEqual(PAGE.height - PAGE.margin);
      }
    }
  });
});
