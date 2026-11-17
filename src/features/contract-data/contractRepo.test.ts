import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import type { PermissionFlagKey } from "@/constants/permissionFlags";
import { changeLogs } from "@/db/schema/changeLogs";
import { deals } from "@/db/schema/deals";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import type { HydratedActor } from "@/server/hydrateActor";
import { getContractData, saveContractParty, saveContractTerms } from "./contractRepo";

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
      title: "Séjour Alpha",
      pipelineId: pipeline.id,
      stageId: stages[0]?.id ?? "",
      ownerId: owner.id,
      visibilityLevel: "owner",
    })
    .returning();
  if (deal === undefined) throw new Error("deal insert returned no row");
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

const TERMS = { nature: "stay", occupants: 16, arrivalTime: "16:00", departureTime: "19:00" };
const TENANT = {
  fullName: "Johanna Hung",
  email: "johanna@example.com",
  phone: "0781860881",
  address: "170 Rue d'Endoume, 13007 Marseille",
  idNumber: undefined,
};

describe("contract data: identity kept inside the CRM, visible to administrators only", () => {
  it("saves the stay terms and the first tenant, and an editor reads them back", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      expect((await saveContractTerms(db, s.editor, s.dealId, TERMS, SIGNAL())).ok).toBe(true);
      expect(
        (await saveContractParty(db, s.editor, s.dealId, "tenant_1", TENANT, SIGNAL())).ok,
      ).toBe(true);
      const read = await getContractData(db, s.editor, s.dealId, SIGNAL());
      expect(read.ok).toBe(true);
      if (!read.ok) return;
      expect(read.value.terms).toMatchObject({ occupants: 16, arrivalTime: "16:00" });
      expect(read.value.parties[0]).toMatchObject({ role: "tenant_1", fullName: "Johanna Hung" });
    });
  });

  it("an editor sees that an ID number is on file, but never the number", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await saveContractParty(
        db,
        s.admin,
        s.dealId,
        "tenant_1",
        { ...TENANT, idNumber: "ABC123456" },
        SIGNAL(),
      );
      const read = await getContractData(db, s.editor, s.dealId, SIGNAL());
      if (!read.ok) throw new Error("read failed");
      expect(read.value.parties[0]?.idNumber).toBeNull();
      expect(read.value.parties[0]?.idNumberOnFile).toBe(true);
      expect(JSON.stringify(read.value)).not.toContain("ABC123456");
    });
  });

  it("an administrator reads the ID number", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await saveContractParty(
        db,
        s.admin,
        s.dealId,
        "tenant_1",
        { ...TENANT, idNumber: "ABC123456" },
        SIGNAL(),
      );
      const read = await getContractData(db, s.admin, s.dealId, SIGNAL());
      if (!read.ok) throw new Error("read failed");
      expect(read.value.parties[0]?.idNumber).toBe("ABC123456");
    });
  });

  it("an editor cannot write an ID number, and the tenant is left as it was", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await saveContractParty(
        db,
        s.admin,
        s.dealId,
        "tenant_1",
        { ...TENANT, idNumber: "ABC123456" },
        SIGNAL(),
      );
      const r = await saveContractParty(
        db,
        s.editor,
        s.dealId,
        "tenant_1",
        { ...TENANT, idNumber: "ZZZ999999" },
        SIGNAL(),
      );
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.PERM_DENIED);
      const read = await getContractData(db, s.admin, s.dealId, SIGNAL());
      if (read.ok) expect(read.value.parties[0]?.idNumber).toBe("ABC123456");
    });
  });

  it("an editor can update the rest of a tenant without touching the stored ID number", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await saveContractParty(
        db,
        s.admin,
        s.dealId,
        "tenant_1",
        { ...TENANT, idNumber: "ABC123456" },
        SIGNAL(),
      );
      const r = await saveContractParty(
        db,
        s.editor,
        s.dealId,
        "tenant_1",
        { ...TENANT, phone: "0600000000" },
        SIGNAL(),
      );
      expect(r.ok).toBe(true);
      const read = await getContractData(db, s.admin, s.dealId, SIGNAL());
      if (read.ok)
        expect(read.value.parties[0]).toMatchObject({ phone: "0600000000", idNumber: "ABC123456" });
    });
  });

  it("the audit trail records that the ID number changed, never its value", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await saveContractParty(
        db,
        s.admin,
        s.dealId,
        "tenant_1",
        { ...TENANT, idNumber: "ABC123456" },
        SIGNAL(),
      );
      const logs = await db.select().from(changeLogs).where(eq(changeLogs.entityId, s.dealId));
      expect(logs.length).toBeGreaterThan(0);
      expect(JSON.stringify(logs)).not.toContain("ABC123456");
    });
  });

  it("someone who cannot see the deal gets not-found, and nothing is saved", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const r = await getContractData(db, s.stranger, s.dealId, SIGNAL());
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.DEAL_NOT_FOUND);
    });
  });

  it("refuses a stay with no occupants, and saves nothing", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const r = await saveContractTerms(
        db,
        s.editor,
        s.dealId,
        { ...TERMS, occupants: 0 },
        SIGNAL(),
      );
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.CONTRACT_INVALID);
      const read = await getContractData(db, s.editor, s.dealId, SIGNAL());
      if (read.ok) expect(read.value.terms).toBeNull();
    });
  });
});
