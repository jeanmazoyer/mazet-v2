// Signature électronique des contrats, par Documenso. Ce fichier ne fait aucun appel réseau : il décide
// seulement de ce qu'on envoie et de ce qu'on accepte, pour que ces règles se testent seules.
import { timingSafeEqual } from "node:crypto";

export type Contract = { title: string; email: string; name: string };
export type SignState = "signed" | "waiting" | "ignored";

// Documenso compare ce secret tel quel : on le compare de la même façon, sans fuite de temps.
// Un secret vide n'est jamais accepté, même des deux côtés : une installation sans secret est mal configurée.
export function secretMatches(received: string, expected: string): boolean {
  if (!received || !expected) return false;
  const a = Buffer.from(received), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Les positions sont des pourcentages de la page, comme le demande l'API v2. Le client signe en bas à gauche,
// son nom juste au-dessus, et la date à droite. Le premier fichier de l'enveloppe porte l'index 0.
const FIELDS = [
  { type: "SIGNATURE", positionX: 10, positionY: 80, width: 30, height: 5 },
  { type: "NAME", positionX: 10, positionY: 75, width: 30, height: 3 },
  { type: "DATE", positionX: 50, positionY: 80, width: 20, height: 3 },
] as const;

// Le corps JSON (le champ « payload ») d'une création d'enveloppe. Le PDF part dans un champ à part.
export function envelopeBody(c: Contract) {
  return {
    type: "DOCUMENT" as const,
    title: c.title.slice(0, 200),
    recipients: [
      {
        email: c.email,
        name: c.name.slice(0, 120),
        role: "SIGNER" as const,
        fields: FIELDS.map((f) => ({ identifier: 0, page: 1, ...f })),
      },
    ],
  };
}

// Traduit un événement envoyé par Documenso. Seul « terminé » dit que le contrat est signé.
export function eventState(event: unknown): SignState {
  if (event === "DOCUMENT_COMPLETED") return "signed";
  if (event === "DOCUMENT_CREATED") return "waiting";
  return "ignored";
}
