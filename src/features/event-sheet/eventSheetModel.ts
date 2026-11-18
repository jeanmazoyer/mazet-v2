// The printed event sheet, as plain text ready to lay out. Pure: the page reads the data, this
// decides how it reads on paper.
import { countNights, formatShortDate } from "@/features/document-templates/fieldValues";

export interface SheetProvider {
  id: string;
  name: string;
  role: string;
  contact: string | null;
  arrivalTime: string | null;
}

export interface SheetAccommodation {
  id: string;
  name: string;
  beds: number | null;
  notes: string | null;
}

export interface EventSheetInput {
  dealTitle: string;
  headcount: number | null;
  notes: string | null;
  stay: { startDate: string; endDate: string } | null;
  arrivalTime: string | null;
  departureTime: string | null;
  occupants: number | null;
  providers: SheetProvider[];
  accommodations: SheetAccommodation[];
  siteRules: readonly string[];
}

export interface EventSheetModel {
  title: string;
  stay: string;
  arrivalTime: string;
  departureTime: string;
  headcount: string;
  notes: string;
  providers: Array<{ name: string; role: string; contact: string; arrivalTime: string }>;
  accommodations: Array<{ name: string; beds: string; notes: string }>;
  rules: string[];
}

const DASH = "—";

export function buildEventSheetModel(input: EventSheetInput): EventSheetModel {
  return {
    title: input.dealTitle,
    stay:
      input.stay === null
        ? "Dates non renseignées"
        : `${formatShortDate(input.stay.startDate)} → ${formatShortDate(input.stay.endDate)} · ${plural(countNights(input.stay.startDate, input.stay.endDate), "nuit", "nuits")}`,
    arrivalTime: input.arrivalTime ?? DASH,
    departureTime: input.departureTime ?? DASH,
    headcount: input.headcount === null ? "Non renseigné" : `${input.headcount} personnes`,
    notes: input.notes ?? DASH,
    providers: input.providers.map((p) => ({
      name: p.name,
      role: p.role,
      contact: p.contact ?? DASH,
      arrivalTime: p.arrivalTime ?? DASH,
    })),
    accommodations: input.accommodations.map((a) => ({
      name: a.name,
      beds: a.beds === null ? DASH : plural(a.beds, "lit", "lits"),
      notes: a.notes ?? DASH,
    })),
    rules: [...input.siteRules],
  };
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
