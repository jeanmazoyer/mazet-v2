import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { buildDocumentPdf } from "./buildDocument";
import type { QuoteSource } from "./documentModel";

const source: QuoteSource = {
  language: "fr",
  reference: "DV-1-AF2E46ED",
  validUntil: "2027-06-30",
  notes: "Le paiement de l'acompte valide la réservation.",
  subtotalCents: 200000,
  vatCents: 11000,
  totalCents: 211000,
  lines: [
    {
      labelFr: "Location",
      labelEn: "Venue hire",
      unit: "per_day",
      quantity: 2,
      unitPriceCents: 100000,
      vatRateBp: 550,
      totalCents: 200000,
      vatCents: 11000,
    },
  ],
  clientName: "Client fictif",
  dealTitle: "Mariage Alpha",
  eventPeriod: "du 12 juin 2027 au 14 juin 2027",
};

describe("buildDocumentPdf", () => {
  it("builds a quote PDF named after its reference and language", async () => {
    const out = await buildDocumentPdf(
      { kind: "quote", lang: "fr", depositPercent: null, balanceDueOn: null },
      source,
    );
    expect(out.filename).toBe("DV-1-AF2E46ED-devis-fr.pdf");
    expect(new TextDecoder().decode(out.bytes.slice(0, 5))).toBe("%PDF-");
    expect((await PDFDocument.load(out.bytes)).getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("builds a contract PDF with the deposit and balance terms", async () => {
    const out = await buildDocumentPdf(
      { kind: "contract", lang: "en", depositPercent: 30, balanceDueOn: "2027-05-15" },
      { ...source, language: "en" },
    );
    expect(out.filename).toBe("DV-1-AF2E46ED-contract-en.pdf");
    expect((await PDFDocument.load(out.bytes)).getPageCount()).toBeGreaterThanOrEqual(1);
  });
});
