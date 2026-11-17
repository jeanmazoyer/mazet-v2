// Reads the {{field}} placeholders of a template and decides, for one viewer, what a generated
// document can fill. Pure: the Drive step applies the plan, this module decides nothing with I/O.
import { findField } from "./fieldCatalog";

// A field name starts with a letter and holds letters, digits or underscores. Anything else
// between the braces is ordinary text, not a placeholder.
const PLACEHOLDER = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

export function extractPlaceholders(text: string): string[] {
  const seen = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER)) {
    const key = match[1];
    if (key !== undefined) seen.add(key);
  }
  return [...seen];
}

export interface FillPlan {
  // Keys whose value goes into the document.
  filled: Record<string, string>;
  // Known and allowed, but no value on the deal: the placeholder stays for the user to complete.
  empty: string[];
  // Not a field in the catalog: never guessed, always reported.
  unknown: string[];
  // Known, but only an administrator may put it in a document: the placeholder stays.
  blockedAdminOnly: string[];
}

export function planFill(
  keys: readonly string[],
  values: Readonly<Record<string, string | undefined>>,
  viewer: { isAdmin: boolean },
): FillPlan {
  const plan: FillPlan = { filled: {}, empty: [], unknown: [], blockedAdminOnly: [] };
  for (const key of keys) {
    const field = findField(key);
    if (field === undefined) {
      plan.unknown.push(key);
    } else if (field.adminOnly && !viewer.isAdmin) {
      plan.blockedAdminOnly.push(key);
    } else {
      const value = values[key]?.trim() ?? "";
      if (value === "") plan.empty.push(key);
      else plan.filled[key] = value;
    }
  }
  return plan;
}
