import { describe, expect, it } from "vitest";
import { validateReservation } from "./reservationRules";

const NOW = new Date("2026-11-17T09:00:00Z");

describe("validateReservation", () => {
  it("accepts a firm one-day booking and ignores any expiry", () => {
    const r = validateReservation(
      {
        startDate: "2027-06-12",
        endDate: "2027-06-12",
        kind: "firm",
        optionExpiresOn: "2026-12-01",
      },
      NOW,
    );
    expect(r).toEqual({
      ok: true,
      value: {
        startDate: "2027-06-12",
        endDate: "2027-06-12",
        kind: "firm",
        optionExpiresAt: null,
      },
    });
  });

  it("accepts an option whose expiry is still in the future, valid to the end of that day", () => {
    const r = validateReservation(
      {
        startDate: "2027-06-12",
        endDate: "2027-06-14",
        kind: "option",
        optionExpiresOn: "2026-11-20",
      },
      NOW,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.optionExpiresAt?.toISOString()).toBe("2026-11-20T23:59:59.999Z");
  });

  it("rejects dates that do not exist or are not ISO days", () => {
    for (const startDate of ["2027-02-31", "27/06/2027", "2027-6-1", ""]) {
      const r = validateReservation(
        { startDate, endDate: "2027-06-14", kind: "firm", optionExpiresOn: null },
        NOW,
      );
      expect(r).toEqual({ ok: false, error: "invalid_date" });
    }
  });

  it("rejects an end date before the start date", () => {
    const r = validateReservation(
      { startDate: "2027-06-14", endDate: "2027-06-12", kind: "firm", optionExpiresOn: null },
      NOW,
    );
    expect(r).toEqual({ ok: false, error: "end_before_start" });
  });

  it("requires an expiry date on an option", () => {
    const r = validateReservation(
      { startDate: "2027-06-12", endDate: "2027-06-12", kind: "option", optionExpiresOn: null },
      NOW,
    );
    expect(r).toEqual({ ok: false, error: "option_needs_expiry" });
  });

  it("rejects an option that has already expired when it is created", () => {
    const r = validateReservation(
      {
        startDate: "2027-06-12",
        endDate: "2027-06-12",
        kind: "option",
        optionExpiresOn: "2026-11-16",
      },
      NOW,
    );
    expect(r).toEqual({ ok: false, error: "option_expiry_in_past" });
  });
});
