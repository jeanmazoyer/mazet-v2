import { describe, expect, it } from "vitest";
import { monthGrid, parseMonth, shiftMonth } from "./monthGrid";

describe("monthGrid", () => {
  it("starts on a Monday and covers every day of the month", () => {
    const grid = monthGrid(2027, 6); // June 2027 starts on a Tuesday
    expect(grid[0]?.[0]).toEqual({ iso: "2027-05-31", day: 31, inMonth: false });
    expect(grid[0]?.[1]).toEqual({ iso: "2027-06-01", day: 1, inMonth: true });
    expect(grid.flat().filter((d) => d.inMonth)).toHaveLength(30);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid.at(-1)?.at(-1)?.iso).toBe("2027-07-04");
  });

  it("handles leap February and a six-week month", () => {
    expect(
      monthGrid(2028, 2)
        .flat()
        .filter((d) => d.inMonth),
    ).toHaveLength(29);
    expect(monthGrid(2026, 8)).toHaveLength(6); // August 2026 starts on a Saturday
  });
});

describe("month navigation", () => {
  it("moves across year boundaries", () => {
    expect(shiftMonth(2026, 12, 1)).toBe("2027-01");
    expect(shiftMonth(2027, 1, -1)).toBe("2026-12");
  });

  it("falls back to the current month for a missing or invalid value", () => {
    const today = new Date(Date.UTC(2026, 10, 17));
    expect(parseMonth("2027-06", today)).toEqual({ year: 2027, month: 6 });
    expect(parseMonth("2027-13", today)).toEqual({ year: 2026, month: 11 });
    expect(parseMonth("nimporte quoi", today)).toEqual({ year: 2026, month: 11 });
    expect(parseMonth(undefined, today)).toEqual({ year: 2026, month: 11 });
  });
});
