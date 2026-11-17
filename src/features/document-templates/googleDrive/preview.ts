// Addresses of a Google Doc, built from its id. The id is encoded, so a value that is not an id
// cannot change the path it is placed in.
const DOC_BASE = "https://docs.google.com/document/d";

export function googleDocPreviewUrl(fileId: string): string {
  return `${DOC_BASE}/${encodeURIComponent(fileId)}/preview`;
}

export function googleDocEditUrl(fileId: string): string {
  return `${DOC_BASE}/${encodeURIComponent(fileId)}/edit`;
}
