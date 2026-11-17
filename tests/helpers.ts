import { Pool } from "pg";
import { db } from "@/db";
import { organisations, users } from "@/db/schema";
import { runMigrations } from "@/db/migrate";
import type { CurrentUser } from "@/lib/current-user";

// Base de test réelle (TEST_DATABASE_URL), réinitialisée par chaque fichier de tests.
// Données entièrement fictives.
export async function resetDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(
    "DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;",
  );
  await pool.end();
  await runMigrations(process.env.DATABASE_URL!);
}

export async function seedOrg(slug: string) {
  const [org] = await db.insert(organisations).values({ name: slug, slug }).returning();
  const make = async (email: string, role: CurrentUser["role"]) => {
    const [u] = await db
      .insert(users)
      .values({ email, name: email.split("@")[0], role, organisationId: org.id })
      .returning();
    return { id: u.id, name: u.name, email: u.email, role, organisationId: org.id } satisfies CurrentUser;
  };
  return { org, make };
}

export function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
