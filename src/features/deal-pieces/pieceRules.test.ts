import { describe, expect, it } from "vitest";
import { PIECE_KINDS, PIECE_STATUSES, validatePiecePatch } from "./pieceRules";

describe("piece checklist", () => {
  it("covers the documents of a booking, from quote to deposit, balance, hold and insurance", () => {
    expect(PIECE_KINDS).toEqual([
      "quote_sent",
      "contract_signed",
      "deposit_invoice",
      "deposit_received",
      "balance_invoice",
      "balance_received",
      "deposit_hold",
      "insurance_certificate",
    ]);
    expect(PIECE_STATUSES).toEqual(["missing", "received", "verified"]);
  });
});

describe("validatePiecePatch", () => {
  it("accepts a status and an optional reference for an ordinary piece", () => {
    const r = validatePiecePatch({
      kind: "contract_signed",
      status: "received",
      reference: "Contrat v2",
      expiresOn: null,
    });
    expect(r).toEqual({
      ok: true,
      value: {
        kind: "contract_signed",
        status: "received",
        reference: "Contrat v2",
        expiresOn: null,
      },
    });
  });

  it("normalises an empty reference to null", () => {
    const r = validatePiecePatch({
      kind: "quote_sent",
      status: "missing",
      reference: "   ",
      expiresOn: null,
    });
    expect(r.ok && r.value.reference).toBeNull();
  });

  it("rejects an unknown kind or status", () => {
    expect(
      validatePiecePatch({
        kind: "invoice_or_whatever",
        status: "received",
        reference: null,
        expiresOn: null,
      }),
    ).toEqual({ ok: false, error: "invalid_kind" });
    expect(
      validatePiecePatch({
        kind: "quote_sent",
        status: "approved",
        reference: null,
        expiresOn: null,
      }),
    ).toEqual({ ok: false, error: "invalid_status" });
  });

  it("rejects a reference that is too long", () => {
    const r = validatePiecePatch({
      kind: "quote_sent",
      status: "received",
      reference: "x".repeat(201),
      expiresOn: null,
    });
    expect(r).toEqual({ ok: false, error: "invalid_reference" });
  });

  it("only the insurance certificate carries an expiry date", () => {
    const r = validatePiecePatch({
      kind: "contract_signed",
      status: "received",
      reference: null,
      expiresOn: "2027-06-30",
    });
    expect(r).toEqual({ ok: false, error: "expiry_not_applicable" });
  });

  it("an insurance certificate that is received or verified must say until when it is valid", () => {
    expect(
      validatePiecePatch({
        kind: "insurance_certificate",
        status: "received",
        reference: null,
        expiresOn: null,
      }),
    ).toEqual({ ok: false, error: "expiry_required" });
    const ok = validatePiecePatch({
      kind: "insurance_certificate",
      status: "verified",
      reference: "Attestation N°123",
      expiresOn: "2027-06-30",
    });
    expect(ok.ok).toBe(true);
  });

  it("rejects an expiry date that does not exist", () => {
    const r = validatePiecePatch({
      kind: "insurance_certificate",
      status: "received",
      reference: null,
      expiresOn: "2027-02-31",
    });
    expect(r).toEqual({ ok: false, error: "invalid_date" });
  });
});
