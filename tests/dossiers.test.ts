import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { dossiers, journal } from "@/db/schema";
import type { CurrentUser } from "@/lib/current-user";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { ForbiddenError } from "@/lib/permissions";
import {
  addDossierNote,
  changeDossierStatus,
  createDossier,
  getDossier,
  listDossiers,
} from "@/lib/services/dossiers";
import { resetDatabase, seedOrg } from "./helpers";

const INPUT = { clientName: "Client fictif Test", type: "mariage", guests: "80", targetDate: "2030-06-12" };

describe("dossiers (base réelle)", () => {
  let admin: CurrentUser;
  let manager: CurrentUser;
  let partner: CurrentUser;
  let otherOrgAdmin: CurrentUser;

  beforeAll(async () => {
    await resetDatabase();
    const a = await seedOrg("org-a");
    const b = await seedOrg("org-b");
    admin = await a.make("admin@example.com", "admin");
    manager = await a.make("gestion@example.com", "manager");
    partner = await a.make("partenaire@example.com", "partner");
    otherOrgAdmin = await b.make("admin-b@example.com", "admin");
  });

  it("numérote les dossiers à la suite, par organisation", async () => {
    const d1 = await createDossier(manager, INPUT);
    const d2 = await createDossier(admin, { ...INPUT, clientName: "Client fictif Deux" });
    const other = await createDossier(otherOrgAdmin, INPUT);
    expect([d1.number, d2.number, other.number]).toEqual([1, 2, 1]);
    expect(d1.status).toBe("demande");
    expect(d1.guests).toBe(80);
  });

  it("deux créations simultanées ne prennent pas le même numéro", async () => {
    const created = await Promise.all(
      Array.from({ length: 5 }, (_, i) => createDossier(admin, { ...INPUT, clientName: `Simultané ${i}` })),
    );
    expect(new Set(created.map((d) => d.number)).size).toBe(5);
  });

  it("le partenaire ne peut ni lire, ni créer, ni déplacer un dossier", async () => {
    const [any] = await listDossiers(admin);
    await expect(listDossiers(partner)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getDossier(partner, any.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(createDossier(partner, INPUT)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(changeDossierStatus(partner, any.id, "signe")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(addDossierNote(partner, any.id, "note")).rejects.toBeInstanceOf(ForbiddenError);
    const [row] = await db.select().from(dossiers).where(eq(dossiers.id, any.id));
    expect(row.status).toBe("demande");
  });

  it("le changement de statut est journalisé avec l'avant et l'après", async () => {
    const d = await createDossier(manager, { ...INPUT, clientName: "Client fictif Statut" });
    await changeDossierStatus(manager, d.id, "visite");
    const entries = await db.select().from(journal).where(eq(journal.objectId, d.id));
    expect(entries.map((e) => e.action).sort()).toEqual(["dossier.created", "dossier.status_changed"]);
    expect(entries.find((e) => e.action === "dossier.status_changed")?.detail).toEqual({
      from: "demande",
      to: "visite",
    });
  });

  it("un statut inconnu est refusé", async () => {
    const [any] = await listDossiers(admin);
    await expect(changeDossierStatus(admin, any.id, "nimporte")).rejects.toBeInstanceOf(ValidationError);
  });

  it("une autre organisation ne voit ni ne modifie ces dossiers", async () => {
    const [any] = await listDossiers(admin);
    await expect(getDossier(otherOrgAdmin, any.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(changeDossierStatus(otherOrgAdmin, any.id, "perdu")).rejects.toBeInstanceOf(NotFoundError);
    expect((await listDossiers(otherOrgAdmin)).every((d) => d.clientName === INPUT.clientName)).toBe(true);
  });

  it("une note s'ajoute au fil du dossier", async () => {
    const [any] = await listDossiers(admin);
    await addDossierNote(manager, any.id, "  Premier contact par téléphone.  ");
    const full = await getDossier(admin, any.id);
    expect(full.notes[0]).toMatchObject({ body: "Premier contact par téléphone.", authorName: manager.name });
    await expect(addDossierNote(manager, any.id, "   ")).rejects.toBeInstanceOf(ValidationError);
  });
});
