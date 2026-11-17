import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import type { PermissionFlagKey } from "@/constants/permissionFlags";
import { changeLogs } from "@/db/schema/changeLogs";
import { deals } from "@/db/schema/deals";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import type { HydratedActor } from "@/server/hydrateActor";
import { addPaymentLine, listPaymentLines, recordPayment } from "./paymentRepo";

// Données entièrement fictives.
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
      visibilityLevel: "all",
    })
    .returning();
  if (deal === undefined) throw new Error("deal insert returned no row");
  return {
    dealId: deal.id,
    owner: actorOf(owner, ["deal.edit_own"]),
    stranger: actorOf({
      id: "00000000-0000-4000-8000-000000000009",
      name: "Other",
      email: "o@example.com",
    }),
  };
}

describe("payment schedule: échéancier d'un deal (base réelle)", () => {
  it("adds a deposit that is due, and lists it with its amount and due day", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const added = await addPaymentLine(
        db,
        s.owner,
        s.dealId,
        { kind: "deposit", amountCents: 100000, dueOn: "2027-05-01" },
        SIGNAL(),
      );
      expect(added.ok).toBe(true);
      const listed = await listPaymentLines(db, s.owner, s.dealId, SIGNAL());
      expect(listed.ok).toBe(true);
      if (!listed.ok) return;
      expect(listed.value).toHaveLength(1);
      expect(listed.value[0]).toMatchObject({
        kind: "deposit",
        status: "due",
        amountCents: 100000,
        dueOn: "2027-05-01",
      });
    });
  });

  it("starts a hold (caution) as held, never as income", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await addPaymentLine(
        db,
        s.owner,
        s.dealId,
        { kind: "hold", amountCents: 50000, dueOn: "2027-05-01" },
        SIGNAL(),
      );
      const listed = await listPaymentLines(db, s.owner, s.dealId, SIGNAL());
      expect(listed.ok && listed.value[0]?.status).toBe("held");
    });
  });

  it("marks a due line paid with the day received and a reference, and audits the change", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const added = await addPaymentLine(
        db,
        s.owner,
        s.dealId,
        { kind: "balance", amountCents: 89915, dueOn: "2027-06-01" },
        SIGNAL(),
      );
      if (!added.ok) throw new Error("setup add failed");
      const paid = await recordPayment(
        db,
        s.owner,
        s.dealId,
        added.value.id,
        { paidOn: "2027-06-02", reference: "Virement 0412" },
        SIGNAL(),
      );
      expect(paid.ok).toBe(true);
      if (!paid.ok) return;
      expect(paid.value).toMatchObject({
        status: "paid",
        paidOn: "2027-06-02",
        reference: "Virement 0412",
      });
      const logs = await db.select().from(changeLogs);
      expect(logs.some((l) => l.field === `payment:${added.value.id}`)).toBe(true);
    });
  });

  it("refuses to record a second payment on a line already paid", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const added = await addPaymentLine(
        db,
        s.owner,
        s.dealId,
        { kind: "deposit", amountCents: 100000, dueOn: "2027-05-01" },
        SIGNAL(),
      );
      if (!added.ok) throw new Error("setup add failed");
      await recordPayment(
        db,
        s.owner,
        s.dealId,
        added.value.id,
        { paidOn: "2027-05-02", reference: null },
        SIGNAL(),
      );
      const again = await recordPayment(
        db,
        s.owner,
        s.dealId,
        added.value.id,
        { paidOn: "2027-05-03", reference: null },
        SIGNAL(),
      );
      expect(again.ok).toBe(false);
      if (!again.ok) expect(again.error.id).toBe(ERROR_IDS.PAYMENT_INVALID);
    });
  });

  it("releases a held caution once, then refuses a second release", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const added = await addPaymentLine(
        db,
        s.owner,
        s.dealId,
        { kind: "hold", amountCents: 50000, dueOn: "2027-05-01" },
        SIGNAL(),
      );
      if (!added.ok) throw new Error("setup add failed");
      const released = await recordPayment(
        db,
        s.owner,
        s.dealId,
        added.value.id,
        { paidOn: "2027-09-01", reference: "Caution rendue" },
        SIGNAL(),
      );
      expect(released.ok && released.value.status).toBe("released");
      const again = await recordPayment(
        db,
        s.owner,
        s.dealId,
        added.value.id,
        { paidOn: "2027-09-02", reference: null },
        SIGNAL(),
      );
      expect(again.ok).toBe(false);
      if (!again.ok) expect(again.error.id).toBe(ERROR_IDS.PAYMENT_INVALID);
    });
  });

  it("rejects an amount of zero before touching the database", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const r = await addPaymentLine(
        db,
        s.owner,
        s.dealId,
        { kind: "deposit", amountCents: 0, dueOn: "2027-05-01" },
        SIGNAL(),
      );
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.PAYMENT_INVALID);
    });
  });

  it("does not let a user without edit rights add a line to someone else's deal", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const r = await addPaymentLine(
        db,
        s.stranger,
        s.dealId,
        { kind: "deposit", amountCents: 100000, dueOn: "2027-05-01" },
        SIGNAL(),
      );
      expect(r.ok).toBe(false);
    });
  });
});
