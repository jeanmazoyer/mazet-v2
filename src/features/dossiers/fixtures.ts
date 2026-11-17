// Données FICTIVES pour l'étape 1. Rien ici n'est un vrai client.
// Remplacées par la table `dossiers` à l'étape 2.

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

export const DOSSIER_TYPES = ["mariage", "sejour", "autre"] as const;
export type DossierType = (typeof DOSSIER_TYPES)[number];

export type FixtureDossier = {
  ref: string;
  client: string;
  type: DossierType;
  targetDate: string; // ISO, date visée
  guests: number;
  source: string;
  status: DossierStatus;
};

export const FIXTURE_DOSSIERS: FixtureDossier[] = [
  { ref: "D-0001", client: "Client fictif Alpha", type: "mariage", targetDate: "2027-06-12", guests: 80, source: "Site web", status: "option" },
  { ref: "D-0002", client: "Client fictif Bravo", type: "sejour", targetDate: "2027-04-03", guests: 12, source: "Recommandation", status: "devis_envoye" },
  { ref: "D-0003", client: "Client fictif Charlie", type: "mariage", targetDate: "2027-09-18", guests: 120, source: "Salon", status: "signe" },
  { ref: "D-0004", client: "Client fictif Delta", type: "autre", targetDate: "2026-12-05", guests: 25, source: "Demande directe", status: "visite" },
  { ref: "D-0005", client: "Client fictif Echo", type: "mariage", targetDate: "2028-05-27", guests: 60, source: "Site web", status: "demande" },
  { ref: "D-0006", client: "Client fictif Foxtrot", type: "sejour", targetDate: "2027-07-10", guests: 8, source: "Agence", status: "solde" },
  { ref: "D-0007", client: "Client fictif Golf", type: "mariage", targetDate: "2027-08-01", guests: 90, source: "Agence", status: "perdu" },
];
