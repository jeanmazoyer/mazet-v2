import { describe, expect, it } from "vitest";
import {
  INITIAL_STATUS,
  isOverdue,
  parseAmountText,
  settledStatus,
  validateNewLine,
  validatePayment,
} from "./paymentRules";

describe("payment schedule rules", () => {
  it("a deposit or balance is owed then paid; a hold is held then released, and never settles twice", () => {
    expect(INITIAL_STATUS).toEqual({ deposit: "due", balance: "due", hold: "held" });
    expect(settledStatus("deposit", "due")).toBe("paid");
    expect(settledStatus("balance", "due")).toBe("paid");
    expect(settledStatus("hold", "held")).toBe("released");
    expect(settledStatus("deposit", "paid")).toBeNull();
    expect(settledStatus("hold", "released")).toBeNull();
    expect(settledStatus("hold", "due")).toBeNull();
  });

  it("a line needs a positive amount and a real due date", () => {
    expect(validateNewLine({ kind: "deposit", amountCents: 100000, dueOn: "2027-05-01" })).toEqual({
      ok: true,
      value: { kind: "deposit", amountCents: 100000, dueOn: "2027-05-01" },
    });
    expect(validateNewLine({ kind: "deposit", amountCents: 0, dueOn: "2027-05-01" })).toEqual({
      ok: false,
      error: "invalid_amount",
    });
    expect(validateNewLine({ kind: "deposit", amountCents: 100, dueOn: "2027-02-31" })).toEqual({
      ok: false,
      error: "invalid_date",
    });
    expect(validateNewLine({ kind: "rent", amountCents: 100, dueOn: "2027-05-01" })).toEqual({
      ok: false,
      error: "invalid_kind",
    });
  });

  it("a payment records the day it was received and an optional reference", () => {
    expect(validatePayment({ paidOn: "2027-05-02", reference: "Virement 0412" })).toEqual({
      ok: true,
      value: { paidOn: "2027-05-02", reference: "Virement 0412" },
    });
    expect(validatePayment({ paidOn: "2027-05-02", reference: "   " })).toEqual({
      ok: true,
      value: { paidOn: "2027-05-02", reference: null },
    });
    expect(validatePayment({ paidOn: "yesterday", reference: null })).toEqual({
      ok: false,
      error: "invalid_date",
    });
  });

  it("a line is overdue only when unpaid and past its due day", () => {
    expect(isOverdue({ status: "due", dueOn: "2027-05-01" }, "2027-05-02")).toBe(true);
    expect(isOverdue({ status: "due", dueOn: "2027-05-02" }, "2027-05-02")).toBe(false);
    expect(isOverdue({ status: "paid", dueOn: "2027-05-01" }, "2027-05-02")).toBe(false);
  });

  it("reads a typed amount the way the French team writes it: spaces and a comma are fine", () => {
    expect(parseAmountText("1 250,00")).toBe(125000);
    expect(parseAmountText("1\u202f250,5")).toBe(125050);
    expect(parseAmountText("1250.50")).toBe(125050);
    expect(parseAmountText("12")).toBe(1200);
  });

  it("refuses an amount it cannot read exactly, rather than guessing", () => {
    expect(parseAmountText("12,345")).toBeNull();
    expect(parseAmountText("-5")).toBeNull();
    expect(parseAmountText("abc")).toBeNull();
    expect(parseAmountText("")).toBeNull();
  });
});
