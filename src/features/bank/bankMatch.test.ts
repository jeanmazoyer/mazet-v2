import { describe, expect, it } from "vitest";
import { nameTokens, pickTransaction } from "./bankMatch";

// Données entièrement fictives.
const tx = (id: string, label: string, amountCents: number) => ({
  id,
  label,
  amountCents,
  bookedOn: "2026-03-30",
});

describe("bank matching: which statement line settles a payment", () => {
  it("reads the family names worth looking for in a statement label", () => {
    expect(nameTokens(["Alice Kristel S. Martin", "Bob Durand"])).toEqual([
      "alice",
      "kristel",
      "martin",
      "durand",
    ]);
  });

  it("ignores accents and case on both sides", () => {
    const tokens = nameTokens(["Hélène Lefèvre"]);
    const found = pickTransaction(
      630_000,
      [tx("a", "VIR INST LEFEVRE H MARIAGE", 630_000)],
      tokens,
    );
    expect(found?.id).toBe("a");
  });

  it("picks the one line with the right amount and a tenant's name", () => {
    const candidates = [
      tx("a", "VIR INST MARTIN-DURAND A + B MARIAGE", 630_000),
      tx("b", "EURO VIR Autre Client Wedding", 630_000),
      tx("c", "VIR MARTIN acompte", 270_000),
    ];
    expect(pickTransaction(630_000, candidates, nameTokens(["Alice Martin"]))?.id).toBe("a");
  });

  it("refuses to guess when the amount is right but no name is in the label", () => {
    const candidates = [tx("b", "EURO VIR Autre Client Wedding", 630_000)];
    expect(pickTransaction(630_000, candidates, nameTokens(["Alice Martin"]))).toBeNull();
  });

  it("refuses to guess between two lines that both fit", () => {
    const candidates = [
      tx("a", "VIR MARTIN solde", 630_000),
      tx("b", "VIR MARTIN solde bis", 630_000),
    ];
    expect(pickTransaction(630_000, candidates, nameTokens(["Alice Martin"]))).toBeNull();
  });

  it("never matches on a word too short to mean anything", () => {
    const candidates = [tx("a", "VIR LE CLIENT solde", 630_000)];
    expect(pickTransaction(630_000, candidates, nameTokens(["Le Du"]))).toBeNull();
  });
});
