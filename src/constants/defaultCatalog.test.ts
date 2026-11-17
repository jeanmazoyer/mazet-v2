import { describe, expect, test } from "vitest";
import { buildDefaultStageValues, DEFAULT_LABELS, DEFAULT_PIPELINE } from "./defaultCatalog";
import { LABEL_COLORS } from "./labelColors";

// The catalog a fresh install ships with is tailored to an events estate (weddings, events,
// seasonal lets): a file moves from first request to final payment.
describe("default catalog", () => {
  test("the default pipeline follows a booking from request to final payment", () => {
    expect(DEFAULT_PIPELINE.name).toBe("Domaine");
    expect(DEFAULT_PIPELINE.stages).toEqual([
      "Demande",
      "Visite",
      "Option",
      "Devis envoyé",
      "Signé",
      "Soldé",
    ]);
  });

  test("stage rows keep the declared order", () => {
    const rows = buildDefaultStageValues("p1");
    expect(rows.map((r) => r.order)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(rows.every((r) => r.pipelineId === "p1")).toBe(true);
    expect(rows[0]?.name).toBe("Demande");
  });

  test("deal labels carry the kind of booking", () => {
    expect(DEFAULT_LABELS.deal.map(([name]) => name)).toEqual([
      "Mariage",
      "Événement",
      "Séjour",
      "Autre",
    ]);
  });

  test("every default label has a unique name per target and a known color", () => {
    for (const rows of Object.values(DEFAULT_LABELS)) {
      const names = rows.map(([name]) => name);
      expect(new Set(names).size).toBe(names.length);
      for (const [, color] of rows) expect(LABEL_COLORS).toContain(color);
    }
  });
});
