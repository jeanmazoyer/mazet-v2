import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, type Db } from "@/db";
import { journal, organisations, users } from "@/db/schema";
import { runMigrations } from "@/db/migrate";
import type { CurrentUser } from "@/lib/current-user";
import { ForbiddenError } from "@/lib/permissions";
import { changeUserRole } from "@/lib/services/accounts";
import { NotFoundError } from "@/lib/errors";

// Tests sur une vraie base Postgres (TEST_DATABASE_URL), réinitialisée à chaque run.
// Données entièrement fictives.

async function resetDatabase() {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await pool.end();
  await runMigrations(process.env.DATABASE_URL!);
}


// Drizzle enveloppe l'erreur SQL : le message du trigger est dans `cause`.
async function expectJournalRefusal(promise: PromiseLike<unknown>) {
  let error: unknown;
  try {
    await promise;
  } catch (e) {
    error = e;
  }
  expect(error, "la base aurait dû refuser l'opération").toBeDefined();
  const err = error as Error & { cause?: Error };
  expect(`${err.message} ${err.cause?.message ?? ""}`).toMatch(/ajout seul/);
}

async function seedOrg(slug: string) {
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

describe("comptes et journal (base réelle)", () => {
  let orgA: Awaited<ReturnType<typeof seedOrg>>;
  let orgB: Awaited<ReturnType<typeof seedOrg>>;
  let admin: CurrentUser;
  let manager: CurrentUser;
  let partner: CurrentUser;
  let targetA: CurrentUser;
  let otherOrgAdmin: CurrentUser;

  beforeAll(async () => {
    await resetDatabase();
    orgA = await seedOrg("org-a");
    orgB = await seedOrg("org-b");
    admin = await orgA.make("admin@example.com", "admin");
    manager = await orgA.make("gestion@example.com", "manager");
    partner = await orgA.make("partenaire@example.com", "partner");
    targetA = await orgA.make("cible@example.com", "partner");
    otherOrgAdmin = await orgB.make("admin-b@example.com", "admin");
  });

  afterAll(async () => {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.end();
  });

  async function journalCount(): Promise<number> {
    return (await db.select({ id: journal.id }).from(journal)).length;
  }

  it("un gestionnaire ne peut pas changer un rôle, et rien n'est écrit", async () => {
    const before = await journalCount();
    await expect(changeUserRole(manager, targetA.id, "manager")).rejects.toBeInstanceOf(ForbiddenError);
    const [row] = await db.select().from(users).where(eq(users.id, targetA.id));
    expect(row.role).toBe("partner");
    expect(await journalCount()).toBe(before);
  });

  it("un partenaire ne peut pas changer un rôle", async () => {
    await expect(changeUserRole(partner, targetA.id, "admin")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("l'administrateur change le rôle et l'action est journalisée dans la même transaction", async () => {
    await changeUserRole(admin, targetA.id, "manager");
    const [row] = await db.select().from(users).where(eq(users.id, targetA.id));
    expect(row.role).toBe("manager");

    const entries = await db
      .select()
      .from(journal)
      .where(eq(journal.objectId, targetA.id));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      action: "user.role_changed",
      actorName: admin.name,
      actorId: admin.id,
      detail: { from: "partner", to: "manager" },
    });
  });

  it("un administrateur d'une autre organisation ne voit pas ce compte", async () => {
    await expect(changeUserRole(otherOrgAdmin, targetA.id, "admin")).rejects.toBeInstanceOf(NotFoundError);
    const [row] = await db.select().from(users).where(eq(users.id, targetA.id));
    expect(row.role).toBe("manager");
  });

  it("le journal ne se modifie pas", async () => {
    const [entry] = await db.select().from(journal).limit(1);
    await expectJournalRefusal(
      db.update(journal).set({ action: "falsifié" }).where(eq(journal.id, entry.id)),
    );
  });

  it("le journal ne se supprime pas", async () => {
    const [entry] = await db.select().from(journal).limit(1);
    await expectJournalRefusal(db.delete(journal).where(eq(journal.id, entry.id)));
  });

  it("le journal ne se vide pas", async () => {
    await expectJournalRefusal(db.execute("TRUNCATE journal"));
  });
});

export type { Db };
