import { describe, expect, it } from "vitest";
import { isOverdue, nextStatuses, validateNewLine, validatePayment } from "./paymentRules";

describe("payment schedule rules", () => {
  it("a deposit or balance line is due, then paid; a hold is held, then released", () => {
    expect(nextStatuses("deposit")).toEqual(["paid"]);
    expect(nextStatuses("balance")).toEqual(["paid"]);
    expect(nextStatuses("hold")).toEqual(["released"]);
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
});
