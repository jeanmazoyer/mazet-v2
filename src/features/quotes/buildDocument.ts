// From a quote's data to the PDF a client receives. The steps are kept separate so each can be
// tested: model (wording and figures), layout (positions), then drawing.
import { buildContractModel } from "./contractModel";
import { layoutContract, layoutDocument } from "./documentLayout";
import { buildQuoteModel, type QuoteSource } from "./documentModel";
import type { DocumentQuery } from "./documentQuery";
import { renderPdf } from "./renderPdf";

export interface DocumentFile {
  bytes: Uint8Array;
  filename: string;
}

const KIND_WORD = { quote: "devis", contract: "contract" } as const;

export async function buildDocumentPdf(
  query: DocumentQuery,
  source: QuoteSource,
): Promise<DocumentFile> {
  const lang = query.lang;
  const withLang: QuoteSource = { ...source, language: lang };
  const bytes =
    query.kind === "quote"
      ? await renderPdf(layoutDocument(buildQuoteModel(withLang)))
      : await renderPdf(
          layoutContract(
            buildContractModel({
              ...withLang,
              depositPercent: query.depositPercent,
              balanceDueOn: query.balanceDueOn,
            }),
          ),
        );
  return { bytes, filename: `${source.reference}-${KIND_WORD[query.kind]}-${lang}.pdf` };
}
