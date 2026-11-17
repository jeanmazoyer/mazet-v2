// Constantes métier des dossiers, partagées entre la base, les services et l'interface.

export const DOSSIER_STATUSES = [
  "demande",
  "visite",
  "option",
  "devis_envoye",
  "signe",
  "solde",
  "perdu",
] as const;
export type DossierStatus = (typeof DOSSIER_STATUSES)[number];

// Étapes du pipeline, dans l'ordre. « perdu » n'est pas une étape : c'est une issue.
export const PIPELINE_STAGES = ["demande", "visite", "option", "devis_envoye", "signe", "solde"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const DOSSIER_TYPES = ["mariage", "sejour", "autre"] as const;
export type DossierType = (typeof DOSSIER_TYPES)[number];

export const CLIENT_LANGUAGES = ["fr", "en"] as const;
export type ClientLanguage = (typeof CLIENT_LANGUAGES)[number];

export const RESERVATION_KINDS = ["option", "ferme"] as const;
export type ReservationKind = (typeof RESERVATION_KINDS)[number];

export const RESERVATION_STATES = ["active", "expired", "cancelled"] as const;
export type ReservationState = (typeof RESERVATION_STATES)[number];

export function formatRef(number: number): string {
  return `D-${String(number).padStart(4, "0")}`;
}

export function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}
