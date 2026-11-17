import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { BookingConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { ForbiddenError } from "@/lib/permissions";

// État renvoyé par les actions de formulaire. `error` est une clé de la section "errors".
export type FormState = { error?: string; ok?: boolean };

// Traduit une erreur métier attendue en code. Renvoie null pour une erreur inattendue,
// qui doit alors remonter plutôt qu'être masquée.
export function errorCode(error: unknown): string | null {
  if (error instanceof ForbiddenError) return "forbidden";
  if (error instanceof NotFoundError) return "not_found";
  if (error instanceof BookingConflictError) return "conflict";
  if (error instanceof ValidationError) return error.code;
  return null;
}

export function localeOf(formData: FormData): string {
  const value = formData.get("locale");
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}
