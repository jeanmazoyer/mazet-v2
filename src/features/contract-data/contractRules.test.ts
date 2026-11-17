import { describe, expect, it } from "vitest";
import { validateParty, validateTerms } from "./contractRules";

describe("contract data rules: what the rental contract needs", () => {
  it("accepts a stay with its occupants and check-in and check-out times", () => {
    const r = validateTerms({
      nature: "stay",
      occupants: 16,
      arrivalTime: "16:00",
      departureTime: "19:00",
    });
    expect(r).toEqual({
      ok: true,
      value: { nature: "stay", occupants: 16, arrivalTime: "16:00", departureTime: "19:00" },
    });
  });

  it("refuses an unknown nature, no occupants, or a time that is not a clock time", () => {
    expect(
      validateTerms({ nature: "rent", occupants: 4, arrivalTime: "16:00", departureTime: "19:00" }),
    ).toEqual({ ok: false, error: "invalid_nature" });
    expect(
      validateTerms({
        nature: "event",
        occupants: 0,
        arrivalTime: "16:00",
        departureTime: "19:00",
      }),
    ).toEqual({ ok: false, error: "invalid_occupants" });
    expect(
      validateTerms({
        nature: "event",
        occupants: 4,
        arrivalTime: "25:00",
        departureTime: "19:00",
      }),
    ).toEqual({ ok: false, error: "invalid_time" });
  });

  it("keeps a tenant's identity: a name, an optional email, and an ID number in a normal shape", () => {
    const r = validateParty({
      fullName: "  Johanna Hung ",
      email: "johanna@example.com",
      phone: "06 12 34 56 78",
      address: "170 rue de l'Endoume",
      idNumber: "ab 123456",
    });
    expect(r).toEqual({
      ok: true,
      value: {
        fullName: "Johanna Hung",
        email: "johanna@example.com",
        phone: "06 12 34 56 78",
        address: "170 rue de l'Endoume",
        idNumber: "AB123456",
      },
    });
  });

  it("refuses a missing name, a malformed email, or an ID number with symbols", () => {
    expect(
      validateParty({ fullName: " ", email: null, phone: null, address: null, idNumber: null }),
    ).toEqual({ ok: false, error: "invalid_name" });
    expect(
      validateParty({
        fullName: "Nicolas Leca",
        email: "pas-un-mail",
        phone: null,
        address: null,
        idNumber: null,
      }),
    ).toEqual({ ok: false, error: "invalid_email" });
    expect(
      validateParty({
        fullName: "Nicolas Leca",
        email: null,
        phone: null,
        address: null,
        idNumber: "14082/A",
      }),
    ).toEqual({ ok: false, error: "invalid_id_number" });
  });
});
