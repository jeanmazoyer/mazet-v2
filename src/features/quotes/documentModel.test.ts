import { describe, expect, it } from "vitest";
import { buildContractModel, depositCents } from "./contractModel";
import { formatCents, formatDate } from "./documentFormat";
import { buildQuoteModel } from "./documentModel";

const quote = {
  reference: "DV-0004-1",
  validUntil: "2027-06-30",
  notes: null,
  subtotalCents: 123450,
  vatCents: 5000,
  totalCents: 128450,
  lines: [
    {
      labelFr: "Location du domaine",
      labelEn: "Venue hire",
      unit: "per_day" as const,
      quantity: 2,
      unitPriceCents: 61725,
      vatRateBp: 550,
      totalCents: 123450,
      vatCents: 6792,
    },
  ],
};

describe("money and dates", () => {
  it("formats euros the way each language writes them", () => {
    expect(formatCents(123450, "fr").replace(/\s/g, " ")).toBe("1 234,50 €");
    expect(formatCents(123450, "en")).toBe("€1,234.50");
  });

  it("formats an ISO day in each language", () => {
    expect(formatDate("2027-06-30", "fr")).toBe("30 juin 2027");
    expect(formatDate("2027-06-30", "en")).toBe("30 Jun 2027");
  });
});

describe("quote document", () => {
  it("is titled and labelled in French for a French quote", () => {
    const m = buildQuoteModel({
      ...quote,
      language: "fr",
      clientName: "Client fictif",
      dealTitle: "Mariage Alpha",
      eventPeriod: null,
    });
    expect(m.title).toBe("Devis");
    expect(m.reference).toBe("DV-0004-1");
    expect(m.lines[0]?.label).toBe("Location du domaine");
    expect(m.lines[0]?.unit).toBe("par jour");
    expect(m.total.replace(/\s/g, " ")).toBe("1 284,50 €");
    expect(m.validUntil).toBe("30 juin 2027");
  });

  it("uses the English labels and English figures for an English quote", () => {
    const m = buildQuoteModel({
      ...quote,
      language: "en",
      clientName: "Client",
      dealTitle: "Wedding",
      eventPeriod: null,
    });
    expect(m.title).toBe("Quote");
    expect(m.lines[0]?.label).toBe("Venue hire");
    expect(m.lines[0]?.unit).toBe("per day");
    expect(m.total).toBe("€1,284.50");
  });

  it("states the VAT rate of each line", () => {
    const m = buildQuoteModel({
      ...quote,
      language: "fr",
      clientName: "C",
      dealTitle: "D",
      eventPeriod: null,
    });
    expect(m.lines[0]?.vatRate).toBe("5,5 %");
  });
});

describe("contract document", () => {
  it("splits the total into a deposit and a balance that add back to the total exactly", () => {
    expect(depositCents(128450, 30)).toBe(38535);
    expect(depositCents(10, 50)).toBe(5);
    const c = buildContractModel({
      ...quote,
      language: "fr",
      clientName: "Client",
      dealTitle: "Mariage",
      eventPeriod: "12 juin 2027",
      depositPercent: 30,
      balanceDueOn: "2027-05-15",
    });
    expect(c.title).toBe("Contrat de location");
    const payment = c.sections.find((s) => s.heading === "Paiement")?.paragraphs.join(" ") ?? "";
    // 1 284,50 € total: deposit 385,35 €, balance 899,15 €.
    expect(payment.replace(/\s/g, " ")).toContain("385,35 €");
    expect(payment.replace(/\s/g, " ")).toContain("899,15 €");
  });

  it("asks for an event insurance certificate, and says the text is a draft to validate", () => {
    const c = buildContractModel({
      ...quote,
      language: "en",
      clientName: "Client",
      dealTitle: "Wedding",
      eventPeriod: "12 Jun 2027",
      depositPercent: 30,
      balanceDueOn: "2027-05-15",
    });
    const all = c.sections.flatMap((s) => s.paragraphs).join(" ");
    expect(all).toMatch(/insurance/i);
    expect(c.draftNotice).toMatch(/draft/i);
  });
});
