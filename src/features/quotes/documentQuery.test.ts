import { describe, expect, it } from "vitest";
import { parseDocumentQuery } from "./documentQuery";

describe("parseDocumentQuery", () => {
  it("defaults to a French quote", () => {
    const r = parseDocumentQuery(new URLSearchParams("kind=quote"));
    expect(r).toEqual({
      ok: true,
      value: { kind: "quote", lang: "fr", depositPercent: null, balanceDueOn: null },
    });
  });

  it("a contract needs a deposit percentage and a balance date", () => {
    const r = parseDocumentQuery(
      new URLSearchParams("kind=contract&lang=en&depositPercent=30&balanceDueOn=2027-05-15"),
    );
    expect(r).toEqual({
      ok: true,
      value: { kind: "contract", lang: "en", depositPercent: 30, balanceDueOn: "2027-05-15" },
    });
    expect(
      parseDocumentQuery(new URLSearchParams("kind=contract&balanceDueOn=2027-05-15")).ok,
    ).toBe(false);
    expect(parseDocumentQuery(new URLSearchParams("kind=contract&depositPercent=30")).ok).toBe(
      false,
    );
  });

  it("refuses an unknown kind, language, or an impossible deposit", () => {
    expect(parseDocumentQuery(new URLSearchParams("kind=invoice")).ok).toBe(false);
    expect(parseDocumentQuery(new URLSearchParams("kind=quote&lang=de")).ok).toBe(false);
    expect(
      parseDocumentQuery(
        new URLSearchParams("kind=contract&depositPercent=150&balanceDueOn=2027-05-15"),
      ).ok,
    ).toBe(false);
    expect(
      parseDocumentQuery(
        new URLSearchParams("kind=contract&depositPercent=30&balanceDueOn=2027-02-31"),
      ).ok,
    ).toBe(false);
  });
});
