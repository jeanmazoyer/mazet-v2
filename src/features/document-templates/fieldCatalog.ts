// The fields a template can insert from the CRM. A key here is a promise to the template author:
// the name stays stable, so an existing template keeps working when the CRM changes.
export interface TemplateField {
  key: string;
  label: string;
  // Identity numbers are personal data: only an administrator's documents may carry them.
  adminOnly: boolean;
}

export const TEMPLATE_FIELDS: readonly TemplateField[] = [
  { key: "dealTitle", label: "Titre du deal", adminOnly: false },
  { key: "dealValue", label: "Montant du deal", adminOnly: false },
  { key: "arrivalDate", label: "Date d'arrivée", adminOnly: false },
  { key: "departureDate", label: "Date de départ", adminOnly: false },
  { key: "nights", label: "Nombre de nuits", adminOnly: false },
  { key: "occupants", label: "Nombre d'occupants", adminOnly: false },
  { key: "arrivalTime", label: "Heure d'arrivée", adminOnly: false },
  { key: "departureTime", label: "Heure de départ", adminOnly: false },
  { key: "tenant1Name", label: "Locataire 1 : nom", adminOnly: false },
  { key: "tenant1Email", label: "Locataire 1 : e-mail", adminOnly: false },
  { key: "tenant1Phone", label: "Locataire 1 : téléphone", adminOnly: false },
  { key: "tenant1Address", label: "Locataire 1 : adresse", adminOnly: false },
  { key: "tenant1IdNumber", label: "Locataire 1 : numéro de CNI ou passeport", adminOnly: true },
  { key: "tenant2Name", label: "Locataire 2 : nom", adminOnly: false },
  { key: "tenant2Email", label: "Locataire 2 : e-mail", adminOnly: false },
  { key: "tenant2Phone", label: "Locataire 2 : téléphone", adminOnly: false },
  { key: "tenant2Address", label: "Locataire 2 : adresse", adminOnly: false },
  { key: "tenant2IdNumber", label: "Locataire 2 : numéro de CNI ou passeport", adminOnly: true },
  { key: "today", label: "Date du jour", adminOnly: false },
];

const BY_KEY: ReadonlyMap<string, TemplateField> = new Map(TEMPLATE_FIELDS.map((f) => [f.key, f]));

export function findField(key: string): TemplateField | undefined {
  return BY_KEY.get(key);
}
