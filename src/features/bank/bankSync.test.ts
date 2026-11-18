import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import type { PermissionFlagKey } from "@/constants/permissionFlags";
import { bankTransactions } from "@/db/schema/bankTransactions";
import { deals } from "@/db/schema/deals";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import { saveContractParty } from "@/features/contract-data/contractRepo";
import {
  addPaymentLine,
  listPaymentLines,
  recordPayment,
  reopenPayment,
} from "@/features/payments/paymentRepo";
import type { HydratedActor } from "@/server/hydrateActor";
import { importBankTransactions } from "./bankImport";
import { syncDealWithBank } from "./bankSync";

// Données entièrement fictives.
const SIGNAL = (): AbortSignal => AbortSignal.timeout(15_000);
type Db = Parameters<Parameters<typeof withTestDb>[0]>[0];

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

const TENANT = { fullName: "Alice Martin", email: null, phone: null, address: null };
const BALANCE_TX = {
  bookedOn: "2026-03-30",
  label: "VIR INST MARTIN-DURAND A + B MARIAGE",
  amountCents: 630_000,
};
const STATEMENT = [
  BALANCE_TX,
  { bookedOn: "2026-04-08", label: "EURO VIR Autre Client Wedding", amountCents: 630_000 },
  { bookedOn: "2026-10-14", label: "VIR KOSTOV Downpayment", amountCents: 270_000 },
  { bookedOn: "2026-11-16", label: "STARLINK", amountCents: -13_800 },
];

async function setup(db: Db) {
  const adminUser = await seedUser(db, { name: "Admin", email: "admin@example.com" });
  const ownerUser = await seedUser(db, { name: "Owner", email: "owner@example.com" });
  const { pipeline, stages } = await seedPipelineWithStages(db, ["Signé"]);
  const [deal] = await db
    .insert(deals)
    .values({
      title: "Mariage Alpha",
      pipelineId: pipeline.id,
      stageId: stages[0]?.id ?? "",
      ownerId: ownerUser.id,
      visibilityLevel: "all",
    })
    .returning();
  if (deal === undefined) throw new Error("deal insert returned no row");
  const admin = actorOf(adminUser, "admin");
  const owner = actorOf(ownerUser, "regular", ["deal.edit_own"]);
  await saveContractParty(db, owner, deal.id, "tenant_1", TENANT, SIGNAL());
  const add = async (kind: string, amountCents: number, dueOn: string): Promise<string> => {
    const line = await addPaymentLine(db, owner, deal.id, { kind, amountCents, dueOn }, SIGNAL());
    if (!line.ok) throw new Error("setup: add line failed");
    return line.value.id;
  };
  return {
    dealId: deal.id,
    admin,
    owner,
    stranger: actorOf(
      { id: "00000000-0000-4000-8000-000000000009", name: "Other", email: "o@example.com" },
      "regular",
    ),
    depositId: await add("deposit", 270_000, "2025-09-30"),
    balanceId: await add("balance", 630_000, "2026-03-14"),
  };
}

describe("bank statement: import", () => {
  it("stores each line once, however many times the same statement is imported", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const first = await importBankTransactions(db, s.admin, STATEMENT, SIGNAL());
      expect(first.ok && first.value).toEqual({ added: 4, alreadyKnown: 0 });
      const again = await importBankTransactions(db, s.admin, STATEMENT, SIGNAL());
      expect(again.ok && again.value).toEqual({ added: 0, alreadyKnown: 4 });
      expect(await db.select().from(bankTransactions)).toHaveLength(4);
    });
  });

  it("keeps two identical lines of the same day as two payments", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const twice = [BALANCE_TX, BALANCE_TX];
      const result = await importBankTransactions(db, s.admin, twice, SIGNAL());
      expect(result.ok && result.value.added).toBe(2);
    });
  });

  it("is reserved to administrators, and refuses a malformed line", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const denied = await importBankTransactions(db, s.owner, STATEMENT, SIGNAL());
      expect(!denied.ok && denied.error.id).toBe(ERROR_IDS.PERM_DENIED);
      const bad = [{ bookedOn: "30/03/2026", label: "X", amountCents: 10 }];
      const refused = await importBankTransactions(db, s.admin, bad, SIGNAL());
      expect(!refused.ok && refused.error.id).toBe(ERROR_IDS.BANK_IMPORT_INVALID);
      expect(await db.select().from(bankTransactions)).toHaveLength(0);
    });
  });
});

describe("bank statement: matching a deal's payments", () => {
  it("settles the payment the statement shows, and leaves the others owed", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await importBankTransactions(db, s.admin, STATEMENT, SIGNAL());

      const synced = await syncDealWithBank(db, s.owner, s.dealId, SIGNAL());
      expect(synced.ok && synced.value).toEqual({
        matched: 1,
        confirmed: 0,
        stillOwed: 1,
        transactionsOnFile: 4,
      });
      const lines = await listPaymentLines(db, s.owner, s.dealId, SIGNAL());
      const balance = lines.ok ? lines.value.find((l) => l.id === s.balanceId) : undefined;
      expect([balance?.status, balance?.paidOn, balance?.reference]).toEqual([
        "paid",
        "2026-03-30",
        BALANCE_TX.label,
      ]);
      expect(balance?.bankTransactionId).not.toBeNull();
      const deposit = lines.ok ? lines.value.find((l) => l.id === s.depositId) : undefined;
      expect(deposit?.status).toBe("due");

      // Running it again finds nothing new and changes nothing.
      const again = await syncDealWithBank(db, s.owner, s.dealId, SIGNAL());
      expect(again.ok && [again.value.matched, again.value.confirmed]).toEqual([0, 0]);
    });
  });

  it("confirms a payment a person had already marked received", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await importBankTransactions(db, s.admin, STATEMENT, SIGNAL());
      const byHand = { paidOn: "2026-04-01", reference: null };
      await recordPayment(db, s.owner, s.dealId, s.balanceId, byHand, SIGNAL());

      const synced = await syncDealWithBank(db, s.owner, s.dealId, SIGNAL());
      expect(synced.ok && [synced.value.matched, synced.value.confirmed]).toEqual([0, 1]);
      const lines = await listPaymentLines(db, s.owner, s.dealId, SIGNAL());
      const balance = lines.ok ? lines.value.find((l) => l.id === s.balanceId) : undefined;
      // The day the person gave is kept; the statement's wording is added as the proof.
      expect([balance?.status, balance?.paidOn, balance?.reference]).toEqual([
        "paid",
        "2026-04-01",
        BALANCE_TX.label,
      ]);
      expect(balance?.bankTransactionId).not.toBeNull();
    });
  });

  it("never counts one statement line for two payments", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await importBankTransactions(db, s.admin, [BALANCE_TX], SIGNAL());
      const second = { kind: "balance", amountCents: 630_000, dueOn: "2026-03-20" };
      await addPaymentLine(db, s.owner, s.dealId, second, SIGNAL());
      const synced = await syncDealWithBank(db, s.owner, s.dealId, SIGNAL());
      expect(synced.ok && synced.value.matched).toBe(1);
      const lines = await listPaymentLines(db, s.owner, s.dealId, SIGNAL());
      expect(lines.ok && lines.value.filter((l) => l.status === "paid")).toHaveLength(1);
    });
  });

  it("frees the statement line again when the payment is marked not received", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await importBankTransactions(db, s.admin, STATEMENT, SIGNAL());
      await syncDealWithBank(db, s.owner, s.dealId, SIGNAL());
      const reopened = await reopenPayment(db, s.owner, s.dealId, s.balanceId, SIGNAL());
      expect(reopened.ok && reopened.value.bankTransactionId).toBeNull();
      const again = await syncDealWithBank(db, s.owner, s.dealId, SIGNAL());
      expect(again.ok && again.value.matched).toBe(1);
    });
  });

  it("is refused to someone who cannot edit the deal", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await importBankTransactions(db, s.admin, STATEMENT, SIGNAL());
      await db.update(deals).set({ visibilityLevel: "owner" }).where(eq(deals.id, s.dealId));
      const synced = await syncDealWithBank(db, s.stranger, s.dealId, SIGNAL());
      expect(synced.ok).toBe(false);
      const lines = await listPaymentLines(db, s.owner, s.dealId, SIGNAL());
      expect(lines.ok && lines.value.every((l) => l.status === "due")).toBe(true);
    });
  });
});
