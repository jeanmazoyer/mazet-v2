import { STRINGS } from "@/constants/strings";

// The user-facing sentence for a quote error id; unknown ids fall back to a generic line.
export function quoteErrorText(id: string): string {
  const messages: Record<string, string> = STRINGS.quotes.errors;
  return messages[id] ?? STRINGS.quotes.errors.generic;
}
