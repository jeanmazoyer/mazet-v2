// Reads the Drive file id from what the administrator pastes: a Google Docs link or the bare id.
const DOC_LINK_ID = /\/d\/([A-Za-z0-9_-]{10,})/;
const BARE_ID = /^[A-Za-z0-9_-]{10,}$/;

export function extractDriveFileId(input: string): string | null {
  const text = input.trim();
  if (text === "") return null;
  const fromLink = DOC_LINK_ID.exec(text);
  if (fromLink?.[1] !== undefined) return fromLink[1];
  return BARE_ID.test(text) ? text : null;
}
