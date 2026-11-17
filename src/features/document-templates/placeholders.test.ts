import { describe, expect, it } from "vitest";
import { extractPlaceholders, planFill } from "./placeholders";

describe("template placeholders: what a document fills in from the deal", () => {
  it("finds each {{field}} once, in the order it first appears", () => {
    const text =
      "Contrat pour {{tenant1Name}} du {{arrivalDate}} au {{departureDate}}. Rebonjour {{tenant1Name}}.";
    expect(extractPlaceholders(text)).toEqual(["tenant1Name", "arrivalDate", "departureDate"]);
  });

  it("ignores text that merely looks like braces but is not a field name", () => {
    expect(extractPlaceholders("un {{ }} vide et {{deux mots}} et {{ok_1}}")).toEqual(["ok_1"]);
  });

  it("fills known fields, and leaves an empty field as its placeholder so the user can fix it", () => {
    const plan = planFill(
      ["dealTitle", "tenant2Name"],
      { dealTitle: "Mariage Alpha", tenant2Name: "" },
      { isAdmin: false },
    );
    expect(plan.filled).toEqual({ dealTitle: "Mariage Alpha" });
    expect(plan.empty).toEqual(["tenant2Name"]);
    expect(plan.unknown).toEqual([]);
  });

  it("reports an unknown field name rather than guessing a value", () => {
    const plan = planFill(["nomInconnu"], {}, { isAdmin: true });
    expect(plan.unknown).toEqual(["nomInconnu"]);
    expect(plan.filled).toEqual({});
  });

  it("never fills the ID number for someone who is not an administrator", () => {
    const values = { tenant1IdNumber: "ABC123456" };
    const asEditor = planFill(["tenant1IdNumber"], values, { isAdmin: false });
    expect(asEditor.blockedAdminOnly).toEqual(["tenant1IdNumber"]);
    expect(asEditor.filled).toEqual({});
    const asAdmin = planFill(["tenant1IdNumber"], values, { isAdmin: true });
    expect(asAdmin.filled).toEqual({ tenant1IdNumber: "ABC123456" });
  });
});
