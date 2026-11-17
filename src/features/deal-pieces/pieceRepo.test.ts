import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import type { PermissionFlagKey } from "@/constants/permissionFlags";
import { changeLogs } from "@/db/schema/changeLogs";
import { dealPieces } from "@/db/schema/dealPieces";
import { deals } from "@/db/schema/deals";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import type { HydratedActor } from "@/server/hydrateActor";
import { listDealPieces, updateDealPiece } from "./pieceRepo";
import { PIECE_KINDS } from "./pieceRules";

// Données entièrement fictives.
const SIGNAL = (): AbortSignal => AbortSignal.timeout(10_000);

function actorOf(
  user: { id: string; name: string; email: string },
  kind: "admin" | "regular",
  flags: PermissionFlagKey[] = [],
): HydratedActor {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: null,
    type: kind,
    isActive: true,
    groupIds: new Set(),
    flags: new Set(flags),
  };
}

type Db = Parameters<Parameters<typeof withTestDb>[0]>[0];

async function setup(db: Db) {
  const owner = await seedUser(db, { name: "Owner", email: "owner@example.com" });
  const { pipeline, stages } = await seedPipelineWithStages(db, ["Demande"]);
  const insertDeal = async (title: string, visibilityLevel: "all" | "owner") => {
    const [row] = await db
      .insert(deals)
      .values({
        title,
        pipelineId: pipeline.id,
        stageId: stages[0]?.id ?? "",
        ownerId: owner.id,
        visibilityLevel,
      })
      .returning();
    if (row === undefined) throw new Error("deal insert returned no row");
    return row.id;
  };
  return {
    owner: actorOf(owner, "regular", ["deal.edit_own"]),
    stranger: actorOf(
      { id: "00000000-0000-4000-8000-000000000002", name: "Stranger", email: "s@example.com" },
      "regular",
    ),
    insertDeal,
  };
}

describe("deal pieces: documents of a booking (base réelle)", () => {
  it("lists one piece per required document, in checklist order, all missing at first", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const r = await listDealPieces(db, s.owner, dealId, SIGNAL());
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.value.map((p) => p.kind)).toEqual([...PIECE_KINDS]);
      expect(r.value.every((p) => p.status === "missing")).toBe(true);
    });
  });

  it("creates the checklist once, however many times it is read", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      await listDealPieces(db, s.owner, dealId, SIGNAL());
      await listDealPieces(db, s.owner, dealId, SIGNAL());
      const rows = await db.select().from(dealPieces).where(eq(dealPieces.dealId, dealId));
      expect(rows).toHaveLength(PIECE_KINDS.length);
    });
  });

  it("records a status and a reference, and writes the change to the audit trail", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const r = await updateDealPiece(
        db,
        s.owner,
        dealId,
        {
          kind: "contract_signed",
          status: "received",
          reference: "Contrat signé le 12/11",
          expiresOn: null,
        },
        SIGNAL(),
      );
      expect(r.ok).toBe(true);
      const listed = await listDealPieces(db, s.owner, dealId, SIGNAL());
      const contract = listed.ok
        ? listed.value.find((p) => p.kind === "contract_signed")
        : undefined;
      expect(contract).toMatchObject({ status: "received", reference: "Contrat signé le 12/11" });

      const trail = await db.select().from(changeLogs).where(eq(changeLogs.entityId, dealId));
      expect(trail.map((e) => e.field)).toContain("piece:contract_signed");
    });
  });

  it("stores the validity date of an event insurance certificate", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const r = await updateDealPiece(
        db,
        s.owner,
        dealId,
        {
          kind: "insurance_certificate",
          status: "verified",
          reference: "Attestation N°123",
          expiresOn: "2027-06-30",
        },
        SIGNAL(),
      );
      expect(r.ok && r.value.expiresOn).toBe("2027-06-30");
    });
  });

  it("refuses an invalid patch with a readable error id, and writes nothing", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const r = await updateDealPiece(
        db,
        s.owner,
        dealId,
        { kind: "contract_signed", status: "received", reference: null, expiresOn: "2027-06-30" },
        SIGNAL(),
      );
      expect(!r.ok && r.error.id).toBe(ERROR_IDS.PIECE_INVALID);
      const trail = await db.select().from(changeLogs).where(eq(changeLogs.entityId, dealId));
      expect(trail).toHaveLength(0);
    });
  });

  it("a user who cannot edit the deal cannot change its checklist", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const r = await updateDealPiece(
        db,
        s.stranger,
        dealId,
        { kind: "quote_sent", status: "received", reference: null, expiresOn: null },
        SIGNAL(),
      );
      expect(!r.ok && r.error.id).toBe(ERROR_IDS.PERM_DENIED);
    });
  });

  it("a deal hidden from the viewer shows no checklist", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const secret = await s.insertDeal("Secret", "owner");
      const r = await listDealPieces(db, s.stranger, secret, SIGNAL());
      expect(!r.ok && r.error.id).toBe(ERROR_IDS.DEAL_NOT_FOUND);
    });
  });
});
