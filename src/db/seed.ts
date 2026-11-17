import { eq } from "drizzle-orm";
import { db } from "@/db";
import { journal, organisations, users } from "@/db/schema";
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

  console.log("Démo prête : admin.demo / gestion.demo / partenaire.demo@example.com");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
