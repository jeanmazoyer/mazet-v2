// Addresses of a Google Doc, built from its id. The id is encoded, so a value that is not an id
// cannot change the path it is placed in.
const DOC_BASE = "https://docs.google.com/document/d";

export function googleDocPreviewUrl(fileId: string): string {
  return `${DOC_BASE}/${encodeURIComponent(fileId)}/preview`;
}

export function googleDocEditUrl(fileId: string): string {
  return `${DOC_BASE}/${encodeURIComponent(fileId)}/edit`;
}

// Any other Drive file (a PDF, a spreadsheet): Drive's own viewer page.
export function driveFileViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}
