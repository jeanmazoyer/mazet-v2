import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import type { PermissionFlagKey } from "@/constants/permissionFlags";
import { changeLogs } from "@/db/schema/changeLogs";
import { deals } from "@/db/schema/deals";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import type { HydratedActor } from "@/server/hydrateActor";
import {
  addAccommodation,
  addProvider,
  getEventSheet,
  removeAccommodation,
  removeProvider,
  saveEventSheet,
} from "./eventSheetRepo";

const SIGNAL = (): AbortSignal => AbortSignal.timeout(10_000);

function actorOf(
  user: { id: string; name: string; email: string },
  flags: PermissionFlagKey[] = [],
): HydratedActor {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: null,
    type: "regular",
    isActive: true,
    groupIds: new Set(),
    flags: new Set(flags),
  };
}

type Db = Parameters<Parameters<typeof withTestDb>[0]>[0];

async function setup(db: Db) {
  const owner = await seedUser(db, { name: "Owner", email: "owner@example.com" });
  const { pipeline, stages } = await seedPipelineWithStages(db, ["Demande"]);
  const [deal] = await db
    .insert(deals)
    .values({
      title: "Mariage Alpha",
      pipelineId: pipeline.id,
      stageId: stages[0]?.id ?? "",
      ownerId: owner.id,
      visibilityLevel: "owner",
    })
    .returning();
  if (deal === undefined) throw new Error("deal insert returned no row");
  return {
    dealId: deal.id,
    editor: actorOf(owner, ["deal.edit_own"]),
    stranger: actorOf({
      id: "00000000-0000-4000-8000-000000000009",
      name: "Other",
      email: "o@example.com",
    }),
  };
}

describe("event sheet: headcount, providers and accommodations of a booking (base réelle)", () => {
  it("saves the headcount and notes, reads them back, and audits the change", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const saved = await saveEventSheet(
        db,
        s.editor,
        s.dealId,
        { headcount: 120, notes: "Vin d'honneur dehors" },
        SIGNAL(),
      );
      expect(saved.ok).toBe(true);
      const sheet = await getEventSheet(db, s.editor, s.dealId, SIGNAL());
      expect(sheet.ok && sheet.value).toMatchObject({
        headcount: 120,
        notes: "Vin d'honneur dehors",
        providers: [],
        accommodations: [],
      });
      const logs = await db.select().from(changeLogs).where(eq(changeLogs.entityId, s.dealId));
      expect(logs.some((l) => l.field === "event:sheet")).toBe(true);
    });
  });

  it("lists providers in the order they were added, and removes one", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const first = await addProvider(
        db,
        s.editor,
        s.dealId,
        { name: "Traiteur Lumière", role: "Traiteur", contact: null, arrivalTime: "09:30" },
        SIGNAL(),
      );
      await addProvider(
        db,
        s.editor,
        s.dealId,
        { name: "DJ Nico", role: "Musique", contact: "06 00 00 00 00", arrivalTime: null },
        SIGNAL(),
      );
      if (!first.ok) throw new Error("add failed");
      const removed = await removeProvider(db, s.editor, s.dealId, first.value.id, SIGNAL());
      expect(removed.ok).toBe(true);
      const sheet = await getEventSheet(db, s.editor, s.dealId, SIGNAL());
      expect(sheet.ok && sheet.value.providers.map((p) => p.name)).toEqual(["DJ Nico"]);
    });
  });

  it("removing a provider that is not on this booking says so", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const r = await removeProvider(
        db,
        s.editor,
        s.dealId,
        "00000000-0000-4000-8000-000000000042",
        SIGNAL(),
      );
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.EVENT_NOT_FOUND);
    });
  });

  it("keeps accommodations with their bed count, and can remove one", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const pool = await addAccommodation(
        db,
        s.editor,
        s.dealId,
        { name: "Pool house", beds: 4, notes: null },
        SIGNAL(),
      );
      if (!pool.ok) throw new Error("add failed");
      await addAccommodation(
        db,
        s.editor,
        s.dealId,
        { name: "Maison", beds: 12, notes: "Chambres vers 11h" },
        SIGNAL(),
      );
      await removeAccommodation(db, s.editor, s.dealId, pool.value.id, SIGNAL());
      const sheet = await getEventSheet(db, s.editor, s.dealId, SIGNAL());
      expect(sheet.ok && sheet.value.accommodations).toEqual([
        expect.objectContaining({ name: "Maison", beds: 12 }),
      ]);
    });
  });

  it("refuses an impossible headcount and saves nothing", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const r = await saveEventSheet(
        db,
        s.editor,
        s.dealId,
        { headcount: 0, notes: null },
        SIGNAL(),
      );
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.EVENT_INVALID);
      const sheet = await getEventSheet(db, s.editor, s.dealId, SIGNAL());
      expect(sheet.ok && sheet.value.headcount).toBeNull();
    });
  });

  it("someone who cannot see the deal reads nothing and writes nothing", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const read = await getEventSheet(db, s.stranger, s.dealId, SIGNAL());
      expect(read.ok).toBe(false);
      const write = await addProvider(
        db,
        s.stranger,
        s.dealId,
        { name: "Intrus", role: "Intrus", contact: null, arrivalTime: null },
        SIGNAL(),
      );
      expect(write.ok).toBe(false);
      if (!write.ok) expect(write.error.id).toBe(ERROR_IDS.DEAL_NOT_FOUND);
    });
  });
});
