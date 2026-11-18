import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import { settings, users, visibilityGroups } from "@/db/schema";
import { deals } from "@/db/schema/deals";
import { persons } from "@/db/schema/persons";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import { getContractData } from "@/features/contract-data/contractRepo";
import { listDealPieces } from "@/features/deal-pieces/pieceRepo";
import { listDealDocuments } from "@/features/document-templates/documentsRepo";
import { getEventSheet } from "@/features/event-sheet/eventSheetRepo";
import { listPaymentLines } from "@/features/payments/paymentRepo";
import { listReservations } from "@/features/reservations/reservationRepo";
import type { HydratedActor } from "@/server/hydrateActor";
import { importDossier } from "./importDossier";

// Données entièrement fictives.
const SIGNAL = (): AbortSignal => AbortSignal.timeout(15_000);

type Db = Parameters<Parameters<typeof withTestDb>[0]>[0];

function actorOf(
  user: { id: string; name: string; email: string },
  type: "admin" | "regular",
): HydratedActor {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: null,
    type,
    isActive: true,
    groupIds: new Set(),
    flags: new Set(),
  };
}

async function setup(db: Db) {
  const adminUser = await seedUser(db, { name: "Admin", email: "admin@example.com" });
  const otherUser = await seedUser(db, { name: "Other", email: "other@example.com" });
  const { stages } = await seedPipelineWithStages(db, ["Demande", "Signé", "Soldé"]);
  return {
    admin: actorOf(adminUser, "admin"),
    regular: actorOf(otherUser, "regular"),
    lastStageId: stages[2]?.id ?? "",
  };
}

const DOSSIER = {
  externalId: "drive:folder-alpha",
  title: "Alice & Bob, mariage, 14 au 17 mai 2026",
  status: "won",
  amountCents: 900_000,
  signedOn: "2025-09-05",
  nature: "event",
  stay: {
    startDate: "2026-05-14",
    endDate: "2026-05-17",
    arrivalTime: "16:00",
    departureTime: "18:00",
    occupants: 22,
  },
  headcount: 40,
  tenants: [
    {
      fullName: "Alice Martin",
      email: "alice@example.com",
      phone: "+32 470 00 00 01",
      address: "1 rue de l'Exemple, 2000 Anvers, Belgique",
      idNumber: "AB1234567",
    },
    {
      fullName: "Bob Durand",
      email: null,
      phone: "+32 470 00 00 02",
      address: null,
      idNumber: null,
    },
  ],
  payments: [
    { kind: "deposit", amountCents: 270_000, dueOn: "2025-09-30" },
    { kind: "balance", amountCents: 630_000, dueOn: "2026-03-14" },
    { kind: "hold", amountCents: 250_000, dueOn: "2026-05-14" },
  ],
  pieces: [
    { kind: "contract_signed", status: "received", reference: "Signé le 05/09/2025" },
    { kind: "deposit_invoice", status: "received", reference: "Facture n° 65 du 30/09/2025" },
  ],
  note: "Importé depuis le dossier Drive.",
};

const DOCUMENTS = [
  {
    title: "Contrat signé",
    driveFileId: "drive-file-contract",
    mimeType: "application/pdf",
    adminOnly: true,
  },
  {
    title: "Facture d'acompte n° 65",
    driveFileId: "drive-file-invoice",
    mimeType: "application/pdf",
  },
];

describe("importDossier: one signed file becomes a complete deal", () => {
  it("creates the deal, its contact, the booking, the contract data and the schedule", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const result = await importDossier(db, s.admin, DOSSIER, SIGNAL());
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.created).toBe(true);
      const dealId = result.value.dealId;

      const [deal] = await db.select().from(deals).where(eq(deals.id, dealId));
      expect(deal?.title).toBe(DOSSIER.title);
      expect(deal?.status).toBe("won");
      expect(Number(deal?.value)).toBe(9000);
      expect(deal?.stageId).toBe(s.lastStageId);
      expect(deal?.wonTime?.toISOString().slice(0, 10)).toBe("2025-09-05");

      const [person] = await db
        .select()
        .from(persons)
        .where(eq(persons.id, deal?.personId ?? ""));
      expect(person?.name).toBe("Alice Martin");
      expect(person?.primaryEmail).toBe("alice@example.com");

      const bookings = await listReservations(
        db,
        s.admin,
        { from: "2026-05-01", to: "2026-05-31" },
        SIGNAL(),
      );
      expect(bookings.map((b) => [b.startDate, b.endDate, b.kind])).toEqual([
        ["2026-05-14", "2026-05-17", "firm"],
      ]);

      const contract = await getContractData(db, s.admin, dealId, SIGNAL());
      expect(contract.ok && contract.value.terms).toEqual({
        nature: "event",
        occupants: 22,
        arrivalTime: "16:00",
        departureTime: "18:00",
      });
      expect(contract.ok && contract.value.parties.map((p) => [p.role, p.fullName])).toEqual([
        ["tenant_1", "Alice Martin"],
        ["tenant_2", "Bob Durand"],
      ]);

      const sheet = await getEventSheet(db, s.admin, dealId, SIGNAL());
      expect(sheet.ok && sheet.value.headcount).toBe(40);

      const lines = await listPaymentLines(db, s.admin, dealId, SIGNAL());
      expect(lines.ok && lines.value.map((l) => [l.kind, l.amountCents, l.status])).toEqual([
        ["deposit", 270_000, "due"],
        ["balance", 630_000, "due"],
        ["hold", 250_000, "held"],
      ]);

      const pieces = await listDealPieces(db, s.admin, dealId, SIGNAL());
      const signed = pieces.ok ? pieces.value.find((p) => p.kind === "contract_signed") : undefined;
      expect(signed?.status).toBe("received");
      expect(signed?.reference).toBe("Signé le 05/09/2025");
    });
  });

  it("records a payment the bank statement already shows", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const reconciled = {
        ...DOSSIER,
        payments: [
          { kind: "deposit", amountCents: 270_000, dueOn: "2025-09-30" },
          {
            kind: "balance",
            amountCents: 630_000,
            dueOn: "2026-03-14",
            paidOn: "2026-03-30",
            reference: "VIR INST MARTIN-DURAND MARIAGE",
          },
        ],
      };
      const result = await importDossier(db, s.admin, reconciled, SIGNAL());
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const lines = await listPaymentLines(db, s.admin, result.value.dealId, SIGNAL());
      expect(lines.ok && lines.value.map((l) => [l.kind, l.status, l.paidOn, l.reference])).toEqual(
        [
          ["deposit", "due", null, null],
          ["balance", "paid", "2026-03-30", "VIR INST MARTIN-DURAND MARIAGE"],
        ],
      );
    });
  });

  it("files the deal under the administrator's group when deals default to group visibility", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await db.insert(settings).values({
        id: true,
        baseCurrency: "EUR",
        defaultVisibilityLevels: { deal: "group", person: "group", organization: "group" },
      });
      const [group] = await db.insert(visibilityGroups).values({ name: "Famille" }).returning();
      await db
        .update(users)
        .set({ primaryVisibilityGroupId: group?.id ?? null })
        .where(eq(users.id, s.admin.id));

      const result = await importDossier(db, s.admin, DOSSIER, SIGNAL());
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const [deal] = await db.select().from(deals).where(eq(deals.id, result.value.dealId));
      expect(deal?.visibilityGroupId).toBe(group?.id);
    });
  });

  it("does not import the same file twice", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const first = await importDossier(db, s.admin, DOSSIER, SIGNAL());
      const second = await importDossier(db, s.admin, DOSSIER, SIGNAL());
      expect(first.ok && second.ok && second.value.dealId === first.value.dealId).toBe(true);
      expect(second.ok && second.value.created).toBe(false);
      expect(await db.select().from(deals)).toHaveLength(1);
      expect(await db.select().from(persons)).toHaveLength(1);
    });
  });

  it("attaches the file's Drive documents, and keeps the signed contract for administrators", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const result = await importDossier(
        db,
        s.admin,
        { ...DOSSIER, documents: DOCUMENTS },
        SIGNAL(),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const forAdmin = await listDealDocuments(db, s.admin, result.value.dealId, SIGNAL());
      expect(forAdmin.ok && forAdmin.value.map((d) => [d.title, d.mimeType]).sort()).toEqual([
        ["Contrat signé", "application/pdf"],
        ["Facture d'acompte n° 65", "application/pdf"],
      ]);

      // The signed contract carries identity numbers: a colleague sees the invoice only.
      await db
        .update(deals)
        .set({ visibilityLevel: "all" })
        .where(eq(deals.id, result.value.dealId));
      const forOthers = await listDealDocuments(db, s.regular, result.value.dealId, SIGNAL());
      expect(forOthers.ok && forOthers.value.map((d) => d.title)).toEqual([
        "Facture d'acompte n° 65",
      ]);
    });
  });

  it("adds documents to a file imported earlier without them, once", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const first = await importDossier(db, s.admin, DOSSIER, SIGNAL());
      const withDocuments = { ...DOSSIER, documents: DOCUMENTS };
      const second = await importDossier(db, s.admin, withDocuments, SIGNAL());
      const third = await importDossier(db, s.admin, withDocuments, SIGNAL());
      expect(first.ok && second.ok && third.ok).toBe(true);
      expect(second.ok && second.value.created).toBe(false);
      if (!first.ok) return;
      const listed = await listDealDocuments(db, s.admin, first.value.dealId, SIGNAL());
      expect(listed.ok && listed.value).toHaveLength(2);
      expect(await db.select().from(deals)).toHaveLength(1);
    });
  });

  it("is reserved to administrators", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const result = await importDossier(db, s.regular, DOSSIER, SIGNAL());
      expect(!result.ok && result.error.id).toBe(ERROR_IDS.PERM_DENIED);
      expect(await db.select().from(deals)).toHaveLength(0);
    });
  });

  it("leaves nothing behind when the dates are already booked", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      expect((await importDossier(db, s.admin, DOSSIER, SIGNAL())).ok).toBe(true);
      const clash = { ...DOSSIER, externalId: "drive:folder-bravo", title: "Autre dossier" };
      const result = await importDossier(db, s.admin, clash, SIGNAL());
      expect(result.ok).toBe(false);
      expect(await db.select().from(deals)).toHaveLength(1);
    });
  });

  it("refuses a file whose content does not hold together", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const result = await importDossier(db, s.admin, { ...DOSSIER, tenants: [] }, SIGNAL());
      expect(!result.ok && result.error.id).toBe(ERROR_IDS.IMPORT_DOSSIER_INVALID);
      expect(await db.select().from(deals)).toHaveLength(0);
    });
  });
});
