import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { TextItem } from "./documentLayout";
import { renderPdf } from "./renderPdf";

const item = (text: string, y: number, bold = false): TextItem => ({
  x: 50,
  y,
  size: 10,
  bold,
  text,
});

describe("renderPdf", () => {
  it("writes a valid PDF with one page per laid-out page", async () => {
    const bytes = await renderPdf([
      [item("Devis", 800, true), item("120,00 €", 700)],
      [item("Suite", 800)],
    ]);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBe(2);
  });

  it("draws accented French and the euro sign without failing", async () => {
    const bytes = await renderPdf([[item("Événement : Mariage « Alpha » — 1 234,50 €", 780)]]);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });

  it("refuses text the standard fonts cannot draw, instead of writing a broken file", async () => {
    await expect(renderPdf([[item("漢字", 780)]])).rejects.toThrow();
  });
});
