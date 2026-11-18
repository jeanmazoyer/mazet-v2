// The family a document belongs to, read from its media type (and its file name when the type is
// too vague). The deal page gives each family its own colour so a contract PDF and a spreadsheet
// are told apart at a glance.
export const DOCUMENT_KINDS = ["pdf", "doc", "sheet", "slides", "image", "other"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

const BY_EXTENSION: Record<string, DocumentKind> = {
  pdf: "pdf",
  doc: "doc",
  docx: "doc",
  odt: "doc",
  txt: "doc",
  xls: "sheet",
  xlsx: "sheet",
  ods: "sheet",
  csv: "sheet",
  ppt: "slides",
  pptx: "slides",
  odp: "slides",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  heic: "image",
};

// A null type is a Google Doc made from a template, the only kind stored without one.
export function documentKind(mimeType: string | null, filename = ""): DocumentKind {
  const type = (mimeType ?? "application/vnd.google-apps.document").toLowerCase();
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("image/")) return "image";
  if (type.includes("spreadsheet") || type.includes("excel") || type === "text/csv") return "sheet";
  if (type.includes("presentation") || type.includes("powerpoint")) return "slides";
  if (type.includes("document") || type.includes("msword") || type === "text/plain") return "doc";
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXTENSION[extension] ?? "other";
}
