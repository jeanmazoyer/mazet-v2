import type { LabelColor, LabelTarget } from "./labelColors";

// Single source of truth for the catalog a fresh install ships with: the default pipeline
// (name + stages) and the default label sets for every target. Both the first-run bootstrap
// (src/features/auth/seed.ts) and the demo catalog seed (scripts/seed-demo-catalog.ts) read
// from here so production defaults and demo data never drift apart.

// Tailored to an events estate (weddings, events, seasonal lets): a file moves from the first
// request to the final payment. Names are in French because the team works in French; they
// are plain data and can be renamed in Settings at any time.
export const DEFAULT_PIPELINE = {
  name: "Domaine",
  stages: ["Demande", "Visite", "Option", "Devis envoyé", "Signé", "Soldé"],
} as const;

// Stage insert rows for a new pipeline's default stages (order = index). Shared by the first-run
// bootstrap and the UI create path so a `stages` schema change updates both at once.
export function buildDefaultStageValues(
  pipelineId: string,
): { pipelineId: string; name: string; order: number }[] {
  return DEFAULT_PIPELINE.stages.map((name, order) => ({ pipelineId, name, order }));
}

// [name, color] tuples; array index is the persisted `order`. Colors are LabelColor members.
export const DEFAULT_LABELS: Record<LabelTarget, ReadonlyArray<readonly [string, LabelColor]>> = {
  person: [
    ["Mariés", "purple"],
    ["Famille", "green"],
    ["Organisateur", "blue"],
    ["Prestataire", "orange"],
  ],
  organization: [
    ["Agence", "purple"],
    ["Traiteur", "orange"],
    ["Prestataire", "blue"],
    ["Entreprise", "teal"],
  ],
  // The kind of booking, so the board can be filtered by it.
  deal: [
    ["Mariage", "purple"],
    ["Événement", "blue"],
    ["Séjour", "green"],
    ["Autre", "gray"],
  ],
  lead: [
    ["Nouveau", "blue"],
    ["En cours", "orange"],
    ["Qualifié", "green"],
    ["Écarté", "gray"],
  ],
};
