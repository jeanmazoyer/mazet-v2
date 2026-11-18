import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import type { PermissionFlagKey } from "@/constants/permissionFlags";
import { changeLogs } from "@/db/schema/changeLogs";
import { deals } from "@/db/schema/deals";
import { reservations } from "@/db/schema/reservations";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import { saveContractParty, saveContractTerms } from "@/features/contract-data/contractRepo";
import type { HydratedActor } from "@/server/hydrateActor";
import {
  createDealDocument,
  createTemplateFromFile,
  getDocumentForDownload,
  listDealDocuments,
  listTemplates,
} from "./documentsRepo";
import { createFakeDrive } from "./testing/fakeDrive";

// Données entièrement fictives.
const SIGNAL = (): AbortSignal => AbortSignal.timeout(10_000);

function actorOf(
  user: { id: string; name: string; email: string },
  type: "admin" | "regular",
  flags: PermissionFlagKey[] = [],
): HydratedActor {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: null,
    type,
    isActive: true,
    groupIds: new Set(),
    flags: new Set(flags),
  };
}

type Db = Parameters<Parameters<typeof withTestDb>[0]>[0];

async function setup(db: Db) {
  const owner = await seedUser(db, { name: "Owner", email: "owner@example.com" });
  const admin = await seedUser(db, { name: "Admin", email: "admin@example.com" });
  const { pipeline, stages } = await seedPipelineWithStages(db, ["Demande"]);
  const [deal] = await db
    .insert(deals)
    .values({
      title: "Séjour Bravo",
      value: "4200.00",
      pipelineId: pipeline.id,
      stageId: stages[0]?.id ?? "",
      ownerId: owner.id,
      visibilityLevel: "owner",
    })
    .returning();
  if (deal === undefined) throw new Error("deal insert returned no row");
  await db.insert(reservations).values({
    dealId: deal.id,
    startDate: "2027-09-14",
    endDate: "2027-09-16",
    state: "active",
    kind: "firm",
    createdById: owner.id,
  });
  return {
    dealId: deal.id,
    editor: actorOf(owner, "regular", ["deal.edit_own"]),
    admin: actorOf(admin, "admin"),
    stranger: actorOf(
      { id: "00000000-0000-4000-8000-000000000009", name: "Other", email: "o@example.com" },
      "regular",
    ),
  };
}

describe("Smart Docs: templates and the documents made from them (base réelle, Drive simulé)", () => {
  it("an administrator adds a Drive file as a template, and the whole team can list it", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const drive = createFakeDrive();
      const fileId = drive.seedFile("Contrat", "Contrat pour {{tenant1Name}}");
      const added = await createTemplateFromFile(
        db,
        s.admin,
        drive,
        { title: "Contrat de location", category: "contract", driveFileId: fileId },
        SIGNAL(),
      );
      expect(added.ok).toBe(true);
      const listed = await listTemplates(db, SIGNAL());
      expect(listed.ok && listed.value.map((t) => t.title)).toEqual(["Contrat de location"]);
    });
  });

  it("a user without the template permission cannot add one", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const drive = createFakeDrive();
      const fileId = drive.seedFile("Contrat", "texte");
      const r = await createTemplateFromFile(
        db,
        s.editor,
        drive,
        { title: "Contrat", category: "contract", driveFileId: fileId },
        SIGNAL(),
      );
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.PERM_DENIED);
    });
  });

  it("a document from a template fills the deal's own fields, and leaves an unknown field visible", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const drive = createFakeDrive();
      const templateId = await addTemplate(
        db,
        s,
        drive,
        "Affaire : {{dealTitle}}. Montant : {{dealValue}}. Arrivée : {{arrivalDate}}. Inconnu : {{nomInconnu}}.",
      );
      const made = await createDealDocument(
        db,
        s.editor,
        drive,
        s.dealId,
        { templateId, title: "Contrat Bravo" },
        SIGNAL(),
      );
      expect(made.ok).toBe(true);
      if (!made.ok) return;
      const text = drive.textOf(made.value.document.driveFileId);
      expect(text).toContain("Affaire : Séjour Bravo");
      expect(text).toContain("4 200,00 €");
      expect(text).toContain("Arrivée : 14/09/2027");
      expect(text).toContain("{{nomInconnu}}");
    });
  });

  it("the ID number is written into a document only for an administrator", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await saveContractTerms(
        db,
        s.editor,
        s.dealId,
        { nature: "stay", occupants: 4, arrivalTime: "16:00", departureTime: "19:00" },
        SIGNAL(),
      );
      await saveContractParty(
        db,
        s.admin,
        s.dealId,
        "tenant_1",
        {
          fullName: "Johanna Hung",
          email: null,
          phone: null,
          address: null,
          idNumber: "ABC123456",
        },
        SIGNAL(),
      );
      const drive = createFakeDrive();
      const templateId = await addTemplate(db, s, drive, "CNI : {{tenant1IdNumber}}");

      const asEditor = await createDealDocument(
        db,
        s.editor,
        drive,
        s.dealId,
        { templateId, title: "Version éditeur" },
        SIGNAL(),
      );
      const asAdmin = await createDealDocument(
        db,
        s.admin,
        drive,
        s.dealId,
        { templateId, title: "Version admin" },
        SIGNAL(),
      );
      if (!asEditor.ok || !asAdmin.ok) throw new Error("creation failed");
      expect(drive.textOf(asEditor.value.document.driveFileId)).toBe("CNI : {{tenant1IdNumber}}");
      expect(drive.textOf(asAdmin.value.document.driveFileId)).toBe("CNI : ABC123456");
    });
  });

  it("the deal's document list shows what was made from it, as drafts", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const drive = createFakeDrive();
      const templateId = await addTemplate(db, s, drive, "Devis {{dealTitle}}");
      await createDealDocument(
        db,
        s.editor,
        drive,
        s.dealId,
        { templateId, title: "Devis Bravo" },
        SIGNAL(),
      );
      const listed = await listDealDocuments(db, s.editor, s.dealId, SIGNAL());
      expect(listed.ok).toBe(true);
      if (!listed.ok) return;
      expect(listed.value).toHaveLength(1);
      expect(listed.value[0]).toMatchObject({
        title: "Devis Bravo",
        status: "draft",
        templateTitle: "Modèle test",
      });
    });
  });

  it("a blank document can be started from scratch and is listed too", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const drive = createFakeDrive();
      const made = await createDealDocument(
        db,
        s.editor,
        drive,
        s.dealId,
        { title: "Note libre" },
        SIGNAL(),
      );
      expect(made.ok).toBe(true);
      const listed = await listDealDocuments(db, s.editor, s.dealId, SIGNAL());
      expect(listed.ok && listed.value.map((d) => d.title)).toEqual(["Note libre"]);
    });
  });

  it("someone who cannot see the deal can neither create nor list its documents", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const drive = createFakeDrive();
      const made = await createDealDocument(
        db,
        s.stranger,
        drive,
        s.dealId,
        { title: "Intrus" },
        SIGNAL(),
      );
      expect(made.ok).toBe(false);
      if (!made.ok) expect(made.error.id).toBe(ERROR_IDS.DEAL_NOT_FOUND);
      const listed = await listDealDocuments(db, s.stranger, s.dealId, SIGNAL());
      expect(listed.ok).toBe(false);
    });
  });

  it("a document that carries an ID number is filed in the administrators' contracts folder, apart from the team's", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await saveContractParty(
        db,
        s.admin,
        s.dealId,
        "tenant_1",
        {
          fullName: "Johanna Hung",
          email: null,
          phone: null,
          address: null,
          idNumber: "ABC123456",
        },
        SIGNAL(),
      );
      const drive = createFakeDrive();
      const templateId = await addTemplate(db, s, drive, "CNI : {{tenant1IdNumber}}");
      const asAdmin = await createDealDocument(
        db,
        s.admin,
        drive,
        s.dealId,
        { templateId, title: "Contrat admin" },
        SIGNAL(),
      );
      const asEditor = await createDealDocument(
        db,
        s.editor,
        drive,
        s.dealId,
        { templateId, title: "Contrat éditeur" },
        SIGNAL(),
      );
      if (!asAdmin.ok || !asEditor.ok) throw new Error("creation failed");
      expect(drive.folderOf(asAdmin.value.document.driveFileId)?.[0]).toBe(
        "Contrats (administrateurs)",
      );
      expect(drive.folderOf(asEditor.value.document.driveFileId)?.[0]).toBe("Deals");
    });
  });

  it("a document with an ID number is hidden from, and cannot be downloaded by, someone who is not an administrator", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await saveContractParty(
        db,
        s.admin,
        s.dealId,
        "tenant_1",
        {
          fullName: "Johanna Hung",
          email: null,
          phone: null,
          address: null,
          idNumber: "ABC123456",
        },
        SIGNAL(),
      );
      const drive = createFakeDrive();
      const templateId = await addTemplate(db, s, drive, "CNI : {{tenant1IdNumber}}");
      const sensitive = await createDealDocument(
        db,
        s.admin,
        drive,
        s.dealId,
        { templateId, title: "Contrat admin" },
        SIGNAL(),
      );
      const plain = await createDealDocument(
        db,
        s.editor,
        drive,
        s.dealId,
        { title: "Note libre" },
        SIGNAL(),
      );
      if (!sensitive.ok || !plain.ok) throw new Error("creation failed");

      const asEditor = await listDealDocuments(db, s.editor, s.dealId, SIGNAL());
      if (!asEditor.ok) throw new Error("list failed");
      expect(asEditor.value.map((d) => d.title)).toEqual(["Note libre"]);
      const asAdmin = await listDealDocuments(db, s.admin, s.dealId, SIGNAL());
      expect(asAdmin.ok && asAdmin.value.map((d) => d.title).sort()).toEqual([
        "Contrat admin",
        "Note libre",
      ]);

      const hidden = await getDocumentForDownload(
        db,
        s.editor,
        s.dealId,
        sensitive.value.document.id,
        SIGNAL(),
      );
      expect(hidden.ok).toBe(false);
      if (!hidden.ok) expect(hidden.error.id).toBe(ERROR_IDS.DOCUMENT_NOT_FOUND);
      const allowed = await getDocumentForDownload(
        db,
        s.editor,
        s.dealId,
        plain.value.document.id,
        SIGNAL(),
      );
      if (!allowed.ok) throw new Error("download lookup failed");
      expect(allowed.value.driveFileId).toBe(plain.value.document.driveFileId);
    });
  });

  it("the audit trail records the creation, never the ID number", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await saveContractParty(
        db,
        s.admin,
        s.dealId,
        "tenant_1",
        {
          fullName: "Johanna Hung",
          email: null,
          phone: null,
          address: null,
          idNumber: "ABC123456",
        },
        SIGNAL(),
      );
      const drive = createFakeDrive();
      const templateId = await addTemplate(db, s, drive, "CNI : {{tenant1IdNumber}}");
      await createDealDocument(
        db,
        s.admin,
        drive,
        s.dealId,
        { templateId, title: "Contrat admin" },
        SIGNAL(),
      );
      const logs = await db.select().from(changeLogs).where(eq(changeLogs.entityId, s.dealId));
      expect(logs.some((l) => l.field.startsWith("document:"))).toBe(true);
      expect(JSON.stringify(logs)).not.toContain("ABC123456");
    });
  });
});

async function addTemplate(
  db: Db,
  s: { admin: HydratedActor },
  drive: ReturnType<typeof createFakeDrive>,
  text: string,
): Promise<string> {
  const fileId = drive.seedFile("Modèle", text);
  const added = await createTemplateFromFile(
    db,
    s.admin,
    drive,
    { title: "Modèle test", category: "other", driveFileId: fileId },
    SIGNAL(),
  );
  if (!added.ok) throw new Error("template setup failed");
  return added.value.id;
}
