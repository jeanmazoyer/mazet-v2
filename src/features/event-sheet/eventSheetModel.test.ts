import { describe, expect, it } from "vitest";
import { buildEventSheetModel } from "./eventSheetModel";

const BASE = {
  dealTitle: "Mariage Alpha",
  headcount: 120,
  notes: "Vin d'honneur dehors",
  stay: { startDate: "2027-09-14", endDate: "2027-09-16" },
  arrivalTime: "16:00",
  departureTime: "19:00",
  occupants: 16,
  providers: [
    { id: "p1", name: "Traiteur Lumière", role: "Traiteur", contact: null, arrivalTime: "09:30" },
  ],
  accommodations: [{ id: "a1", name: "Pool house", beds: 4, notes: null }],
  siteRules: ["Bruit : respecter les normes légales."],
};

describe("event sheet model: what the printed page shows", () => {
  it("shows the stay in short dates, with its nights, and the arrival and departure times", () => {
    const m = buildEventSheetModel(BASE);
    expect(m.stay).toBe("14/09/2027 → 16/09/2027 · 2 nuits");
    expect(m.arrivalTime).toBe("16:00");
    expect(m.departureTime).toBe("19:00");
  });

  it("gives the headcount, and says so plainly when it is not yet known", () => {
    expect(buildEventSheetModel(BASE).headcount).toBe("120 personnes");
    expect(buildEventSheetModel({ ...BASE, headcount: null }).headcount).toBe("Non renseigné");
  });

  it("keeps the providers and accommodations as they were entered, and carries the site rules", () => {
    const m = buildEventSheetModel(BASE);
    expect(m.providers).toEqual([
      { name: "Traiteur Lumière", role: "Traiteur", contact: "—", arrivalTime: "09:30" },
    ]);
    expect(m.accommodations).toEqual([{ name: "Pool house", beds: "4 lits", notes: "—" }]);
    expect(m.rules).toEqual(["Bruit : respecter les normes légales."]);
  });

  it("handles a booking with no dates yet without inventing them", () => {
    expect(buildEventSheetModel({ ...BASE, stay: null }).stay).toBe("Dates non renseignées");
  });
});
