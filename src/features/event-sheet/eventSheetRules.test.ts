import { describe, expect, it } from "vitest";
import { validateAccommodation, validateHeadcount, validateProvider } from "./eventSheetRules";

describe("event sheet rules: what the day of the event needs to be right", () => {
  it("accepts a headcount between 1 and 1000, or none yet", () => {
    expect(validateHeadcount(120)).toEqual({ ok: true, value: 120 });
    expect(validateHeadcount(null)).toEqual({ ok: true, value: null });
    expect(validateHeadcount(0)).toEqual({ ok: false, error: "invalid_headcount" });
    expect(validateHeadcount(1.5)).toEqual({ ok: false, error: "invalid_headcount" });
    expect(validateHeadcount(1001)).toEqual({ ok: false, error: "invalid_headcount" });
  });

  it("keeps a provider with a name, a role, an optional contact and an optional arrival time", () => {
    expect(
      validateProvider({
        name: "  Traiteur Lumière ",
        role: "Traiteur",
        contact: "06 00 00 00 00",
        arrivalTime: "09:30",
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "Traiteur Lumière",
        role: "Traiteur",
        contact: "06 00 00 00 00",
        arrivalTime: "09:30",
      },
    });
    expect(
      validateProvider({ name: "DJ", role: "Musique", contact: "", arrivalTime: null }),
    ).toEqual({
      ok: true,
      value: { name: "DJ", role: "Musique", contact: null, arrivalTime: null },
    });
  });

  it("refuses a provider with no name, no role, or a time that is not a clock time", () => {
    expect(
      validateProvider({ name: "X", role: "Traiteur", contact: null, arrivalTime: null }),
    ).toEqual({ ok: false, error: "invalid_name" });
    expect(
      validateProvider({ name: "Traiteur", role: "", contact: null, arrivalTime: null }),
    ).toEqual({ ok: false, error: "invalid_role" });
    expect(
      validateProvider({ name: "Traiteur", role: "Traiteur", contact: null, arrivalTime: "25:00" }),
    ).toEqual({ ok: false, error: "invalid_time" });
  });

  it("keeps an accommodation with a name and an optional bed count", () => {
    expect(validateAccommodation({ name: "Pool house", beds: 4, notes: null })).toEqual({
      ok: true,
      value: { name: "Pool house", beds: 4, notes: null },
    });
    expect(validateAccommodation({ name: "Pool house", beds: 0, notes: null })).toEqual({
      ok: false,
      error: "invalid_beds",
    });
  });
});
