import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dossiers, journal, organisations, users } from "@/db/schema";
import type { CurrentUser } from "@/lib/current-user";
import type { DossierStatus } from "@/lib/dossiers";
import { changeDossierStatus, createDossier } from "@/lib/services/dossiers";
import { createReservation } from "@/lib/services/reservations";
import { runMigrations } from "@/db/migrate";

// Données FICTIVES uniquement (domaine `example.com`, noms de test).
// Jamais de données réelles dans les jeux de test ou de démonstration.
const SLUG = "domaine-demo";

async function main() {
  await runMigrations(process.env.DATABASE_URL!);

  const [org] = await db
    .insert(organisations)
    .values({ name: "Domaine (démo)", slug: SLUG })
    .onConflictDoNothing({ target: organisations.slug })
    .returning();
  const organisation =
    org ?? (await db.select().from(organisations).where(eq(organisations.slug, SLUG)).limit(1))[0];

  const demoUsers = [
    { email: "admin.demo@example.com", name: "Admin démo", role: "admin" as const },
    { email: "gestion.demo@example.com", name: "Gestion démo", role: "manager" as const },
    { email: "partenaire.demo@example.com", name: "Partenaire démo", role: "partner" as const },
  ];

  for (const u of demoUsers) {
    await db
      .insert(users)
      .values({ ...u, organisationId: organisation.id })
      .onConflictDoNothing();
  }

  const [admin] = await db.select().from(users).where(eq(users.email, demoUsers[0].email)).limit(1);
  const existing = await db.select({ id: journal.id }).from(journal).limit(1);
  if (existing.length === 0) {
    await db.insert(journal).values([
      {
        organisationId: organisation.id,
        actorId: admin.id,
        actorName: admin.name,
        action: "seed.created",
        objectType: "organisation",
        objectId: organisation.id,
        detail: { note: "Données de démonstration (fictives)" },
      },
    ]);
  }

  // Dossiers et réservations fictifs, créés par les mêmes services que l'interface
  // (droits vérifiés, journal alimenté). Dates relatives à aujourd'hui.
  const actor: CurrentUser = {
    id: admin.id,
    organisationId: organisation.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
  const hasDossiers = await db
    .select({ id: dossiers.id })
    .from(dossiers)
    .where(eq(dossiers.organisationId, organisation.id))
    .limit(1);

  if (hasDossiers.length === 0) {
    const inDays = (n: number) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    };
    const demo: {
      name: string;
      type: string;
      guests: number;
      source: string;
      status: DossierStatus;
      country: string;
      language: string;
      target: number;
      booking?: { start: number; end: number; kind: "option" | "ferme" };
    }[] = [
      { name: "Client fictif Alpha", type: "mariage", guests: 80, source: "Site web", status: "option", country: "Royaume-Uni", language: "en", target: 12, booking: { start: 12, end: 14, kind: "option" } },
      { name: "Client fictif Bravo", type: "sejour", guests: 12, source: "Recommandation", status: "devis_envoye", country: "France", language: "fr", target: 40 },
      { name: "Client fictif Charlie", type: "mariage", guests: 120, source: "Salon", status: "signe", country: "Pays-Bas", language: "en", target: 4, booking: { start: 4, end: 7, kind: "ferme" } },
      { name: "Client fictif Delta", type: "autre", guests: 25, source: "Demande directe", status: "visite", country: "France", language: "fr", target: 75 },
      { name: "Client fictif Echo", type: "mariage", guests: 60, source: "Site web", status: "demande", country: "Belgique", language: "fr", target: 200 },
      { name: "Client fictif Foxtrot", type: "sejour", guests: 8, source: "Agence", status: "solde", country: "Allemagne", language: "en", target: 20, booking: { start: 20, end: 26, kind: "ferme" } },
      { name: "Client fictif Golf", type: "mariage", guests: 90, source: "Agence", status: "perdu", country: "France", language: "fr", target: 110 },
    ];

    for (const d of demo) {
      const dossier = await createDossier(actor, {
        clientName: d.name,
        clientEmail: `${d.name.split(" ").pop()!.toLowerCase()}@example.com`,
        clientLanguage: d.language,
        clientCountry: d.country,
        type: d.type,
        guests: d.guests,
        source: d.source,
        targetDate: inDays(d.target),
      });
      if (d.status !== "demande") await changeDossierStatus(actor, dossier.id, d.status);
      if (d.booking) {
        await createReservation(actor, {
          dossierId: dossier.id,
          startDate: inDays(d.booking.start),
          endDate: inDays(d.booking.end),
          kind: d.booking.kind,
          optionExpiresOn: d.booking.kind === "option" ? inDays(7) : undefined,
        });
      }
    }
  }

  console.log("Démo prête : admin.demo / gestion.demo / partenaire.demo@example.com");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
