import { describe, expect, it } from "vitest";
import { formatCents } from "./documentFormat";

// The PDF's standard fonts (WinAnsi) cannot encode the narrow no-break space that Intl uses
// for thousands in French. Every figure must therefore be plain ASCII spaces or WinAnsi-safe.
describe("PDF-safe figures", () => {
  it("uses only plain spaces in French thousands", () => {
    const text = formatCents(123456789, "fr");
    expect(text).toBe("1 234 567,89 €");
    expect(/[\u202f\u00a0]/.test(text)).toBe(false);
  });
});
