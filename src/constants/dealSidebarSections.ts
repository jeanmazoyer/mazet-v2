import { DEAL_SIDEBAR_STRINGS } from "./dealSidebarStrings";

export const DEAL_SIDEBAR_SECTION_IDS = [
  "summary",
  "stay",
  "finance",
  "source",
  "person",
  "participants",
  "organization",
  "overview",
] as const;

export type DealSidebarSectionId = (typeof DEAL_SIDEBAR_SECTION_IDS)[number];

export const DEAL_SIDEBAR_SECTIONS = [
  { id: "summary", name: DEAL_SIDEBAR_STRINGS.sections.summary },
  { id: "stay", name: DEAL_SIDEBAR_STRINGS.sections.stay },
  { id: "finance", name: DEAL_SIDEBAR_STRINGS.sections.finance },
  { id: "source", name: DEAL_SIDEBAR_STRINGS.sections.source },
  { id: "person", name: DEAL_SIDEBAR_STRINGS.sections.person },
  { id: "participants", name: DEAL_SIDEBAR_STRINGS.sections.participants },
  { id: "organization", name: DEAL_SIDEBAR_STRINGS.sections.organization },
  { id: "overview", name: DEAL_SIDEBAR_STRINGS.sections.overview },
] as const;

export interface DealSidebarSectionPreference {
  id: DealSidebarSectionId;
  visible: boolean;
}

// Sections of the stock CRM that the estate does not use: where a lead came from, and the deal's
// age. They start hidden and can be brought back from "Manage sidebar sections".
const HIDDEN_BY_DEFAULT: ReadonlySet<DealSidebarSectionId> = new Set(["source", "overview"]);

export const DEFAULT_DEAL_SIDEBAR_SECTIONS: DealSidebarSectionPreference[] =
  DEAL_SIDEBAR_SECTIONS.map((section) => ({
    id: section.id,
    visible: !HIDDEN_BY_DEFAULT.has(section.id),
  }));

export function sectionName(id: DealSidebarSectionId): string {
  return DEAL_SIDEBAR_SECTIONS.find((section) => section.id === id)?.name ?? id;
}

export function normalizeDealSidebarSections(
  input: readonly DealSidebarSectionPreference[] | undefined,
): DealSidebarSectionPreference[] {
  if (input === undefined) return [...DEFAULT_DEAL_SIDEBAR_SECTIONS];
  const seen = new Set<DealSidebarSectionId>();
  const normalized: DealSidebarSectionPreference[] = [];
  for (const section of input) {
    if (DEAL_SIDEBAR_SECTION_IDS.includes(section.id) && !seen.has(section.id)) {
      // Summary is non-hideable: it hosts the only "Manage sidebar sections" trigger, so hiding it
      // would leave the manager (and any other hidden section) unreachable.
      const visible = section.id === "summary" ? true : section.visible;
      normalized.push({ id: section.id, visible });
      seen.add(section.id);
    }
  }
  for (const section of DEFAULT_DEAL_SIDEBAR_SECTIONS) {
    if (!seen.has(section.id)) normalized.push(section);
  }
  return normalized;
}
