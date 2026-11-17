// The request bodies sent to Google, built as plain data so they can be checked without a network.

export interface ReplaceAllTextRequest {
  replaceAllText: { containsText: { text: string; matchCase: true }; replaceText: string };
}

// Each {{key}} is replaced everywhere it appears in the document, exactly as written in the template.
export function buildReplaceAllTextRequests(
  replacements: Readonly<Record<string, string>>,
): ReplaceAllTextRequest[] {
  return Object.entries(replacements).map(([key, value]) => ({
    replaceAllText: { containsText: { text: `{{${key}}}`, matchCase: true }, replaceText: value },
  }));
}

// Values inside a Drive search query are quoted with single quotes; a quote or a backslash in a
// folder name must be escaped or the query breaks.
export function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
