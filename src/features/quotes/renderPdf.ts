// Draws a laid-out document (see documentLayout) as an A4 PDF. The fonts are the PDF standard
// set, so the file needs no font download and renders the same everywhere.
import { PDFDocument, StandardFonts } from "pdf-lib";
import { PAGE, type TextItem } from "./documentLayout";

export async function renderPdf(pages: TextItem[][]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("warpdrive document");
  pdf.setProducer("warpdrive");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const items of pages) {
    const page = pdf.addPage([PAGE.width, PAGE.height]);
    for (const item of items) {
      page.drawText(item.text, {
        x: item.x,
        y: item.y,
        size: item.size,
        font: item.bold ? bold : regular,
      });
    }
  }
  return pdf.save();
}
