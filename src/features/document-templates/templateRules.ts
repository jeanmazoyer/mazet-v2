// Rules for templates and the documents made from them, checked before anything is written.
import { err, ok, type Result } from "@/types/result";

export const TEMPLATE_CATEGORIES = ["contract", "quote", "invoice", "other"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

// Draft is the state of every document until it is shared; sharing comes in a later step.
export const DOCUMENT_STATUSES = ["draft", "shared"] as const;

const MAX_TITLE_LENGTH = 120;

export interface TemplateInput {
  title: string;
  category: string;
  driveFileId: string;
}

export function validateTemplateInput(
  input: TemplateInput,
): Result<
  { title: string; category: TemplateCategory; driveFileId: string },
  "invalid_title" | "invalid_category" | "invalid_file"
> {
  const title = input.title.trim();
  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) return err("invalid_title");
  if (!(TEMPLATE_CATEGORIES as readonly string[]).includes(input.category))
    return err("invalid_category");
  const driveFileId = input.driveFileId.trim();
  if (driveFileId.length === 0) return err("invalid_file");
  return ok({ title, category: input.category as TemplateCategory, driveFileId });
}

export function validateDocumentTitle(title: string): Result<string, "invalid_title"> {
  const trimmed = title.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_TITLE_LENGTH) return err("invalid_title");
  return ok(trimmed);
}
