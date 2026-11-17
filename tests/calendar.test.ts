import { describe, expect, it } from "vitest";
import { monthGrid, parseMonth, shiftMonth } from "@/lib/calendar";

describe("grille du calendrier", () => {
  it("commence un lundi et couvre tout le mois", () => {
    const grid = monthGrid(2027, 6); // juin 2027 : le 1er est un mardi
    expect(grid[0][0]).toEqual({ iso: "2027-05-31", day: 31, inMonth: false });
    expect(grid[0][1]).toEqual({ iso: "2027-06-01", day: 1, inMonth: true });
    expect(grid.flat().filter((d) => d.inMonth)).toHaveLength(30);
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(grid.at(-1)!.at(-1)!.iso).toBe("2027-07-04");
  });

  it("gère février bissextile et un mois sur six semaines", () => {
    expect(monthGrid(2028, 2).flat().filter((d) => d.inMonth)).toHaveLength(29);
    expect(monthGrid(2026, 8)).toHaveLength(6); // août 2026 commence un samedi
  });

  it("passe d'une année à l'autre", () => {
    expect(shiftMonth(2026, 12, 1)).toBe("2027-01");
    expect(shiftMonth(2027, 1, -1)).toBe("2026-12");
  });

  it("ignore un mois invalide et retombe sur le mois courant", () => {
    const today = new Date(Date.UTC(2026, 10, 17));
    expect(parseMonth("2027-06", today)).toEqual({ year: 2027, month: 6 });
    expect(parseMonth("2027-13", today)).toEqual({ year: 2026, month: 11 });
    expect(parseMonth("n'importe quoi", today)).toEqual({ year: 2026, month: 11 });
    expect(parseMonth(undefined, today)).toEqual({ year: 2026, month: 11 });
  });
});
