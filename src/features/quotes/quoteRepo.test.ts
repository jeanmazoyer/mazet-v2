import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import type { PermissionFlagKey } from "@/constants/permissionFlags";
import { changeLogs } from "@/db/schema/changeLogs";
import { deals } from "@/db/schema/deals";
import { priceItems, quoteLines, quotes } from "@/db/schema/quotes";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import type { HydratedActor } from "@/server/hydrateActor";
import {
  acceptQuote,
  createQuote,
  listAllPriceItems,
  listPriceItems,
  listQuotes,
  markQuoteSent,
  upsertPriceItem,
} from "./quoteRepo";

// Données entièrement fictives.
const SIGNAL = (): AbortSignal => AbortSignal.timeout(10_000);
type Db = Parameters<Parameters<typeof withTestDb>[0]>[0];

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

async function setup(db: Db) {
  const owner = await seedUser(db, { name: "Owner", email: "owner@example.com" });
  const admin = await seedUser(db, { name: "Admin", email: "admin@example.com", isAdmin: true });
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
  const admins = actorOf(admin, "admin");
  const item = async (
    labelFr: string,
    unitPriceCents: number,
    vatRateBp: number,
    unit: "flat" | "per_day" | "per_person" = "flat",
  ) => {
    const r = await upsertPriceItem(
      db,
      admins,
      { labelFr, labelEn: labelFr, unit, unitPriceCents, vatRateBp, active: true },
      SIGNAL(),
    );
    if (!r.ok) throw new Error(`price item refused: ${r.error.id}`);
    return r.value.id;
  };
  return {
    owner: actorOf(owner, "regular", ["deal.edit_own", "deal.create"]),
    stranger: actorOf(
      { id: "00000000-0000-4000-8000-000000000003", name: "Stranger", email: "x@example.com" },
      "regular",
    ),
    admin: admins,
    insertDeal,
    item,
  };
}

describe("quotes: price grid and quotes built from it (base réelle)", () => {
  it("builds a quote from the grid with exact totals, and records it in the audit trail", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const venue = await s.item("Location du domaine (journée)", 150000, 550, "per_day");
      const meal = await s.item("Repas", 4500, 1000, "per_person");
      const r = await createQuote(
        db,
        s.owner,
        dealId,
        {
          language: "fr",
          validUntil: null,
          notes: null,
          lines: [
            { priceItemId: venue, quantity: 2 },
            { priceItemId: meal, quantity: 80 },
          ],
        },
        SIGNAL(),
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.value).toMatchObject({
        version: 1,
        status: "draft",
        subtotalCents: 300000 + 360000,
        vatCents: 16500 + 36000,
        totalCents: 660000 + 52500,
      });
      const trail = await db.select().from(changeLogs).where(eq(changeLogs.entityId, dealId));
      expect(trail.map((e) => e.field)).toContain("quote");
    });
  });

  it("numbers quotes per deal and keeps earlier versions", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const venue = await s.item("Location", 100000, 0);
      await createQuote(
        db,
        s.owner,
        dealId,
        {
          language: "fr",
          validUntil: null,
          notes: null,
          lines: [{ priceItemId: venue, quantity: 1 }],
        },
        SIGNAL(),
      );
      const second = await createQuote(
        db,
        s.owner,
        dealId,
        {
          language: "en",
          validUntil: null,
          notes: null,
          lines: [{ priceItemId: venue, quantity: 2 }],
        },
        SIGNAL(),
      );
      expect(second.ok && second.value.version).toBe(2);
      const all = await listQuotes(db, s.owner, dealId, SIGNAL());
      expect(all.ok && all.value.map((q) => q.version)).toEqual([2, 1]);
    });
  });

  it("simultaneous quotes for one deal get distinct version numbers", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const venue = await s.item("Location", 100000, 0);
      const results = await Promise.all(
        Array.from({ length: 4 }, () =>
          createQuote(
            db,
            s.owner,
            dealId,
            {
              language: "fr",
              validUntil: null,
              notes: null,
              lines: [{ priceItemId: venue, quantity: 1 }],
            },
            SIGNAL(),
          ),
        ),
      );
      expect(results.every((r) => r.ok)).toBe(true);
      const versions = results.map((r) => (r.ok ? r.value.version : 0)).sort();
      expect(versions).toEqual([1, 2, 3, 4]);
    });
  });

  it("a quote keeps the prices it was made with, even after the grid changes", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const venue = await s.item("Location", 100000, 0);
      const quote = await createQuote(
        db,
        s.owner,
        dealId,
        {
          language: "fr",
          validUntil: null,
          notes: null,
          lines: [{ priceItemId: venue, quantity: 1 }],
        },
        SIGNAL(),
      );
      await upsertPriceItem(
        db,
        s.admin,
        {
          id: venue,
          labelFr: "Location",
          labelEn: "Location",
          unit: "flat",
          unitPriceCents: 999999,
          vatRateBp: 0,
          active: true,
        },
        SIGNAL(),
      );
      const listed = await listQuotes(db, s.owner, dealId, SIGNAL());
      expect(listed.ok && listed.value[0]?.totalCents).toBe(100000);
      expect(quote.ok).toBe(true);
    });
  });

  it("refuses a line that points at an unknown or inactive price item", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const unknown = await createQuote(
        db,
        s.owner,
        dealId,
        {
          language: "fr",
          validUntil: null,
          notes: null,
          lines: [{ priceItemId: "00000000-0000-4000-8000-0000000000aa", quantity: 1 }],
        },
        SIGNAL(),
      );
      expect(!unknown.ok && unknown.error.id).toBe(ERROR_IDS.QUOTE_INVALID);
      const venue = await s.item("Old", 1000, 0);
      await upsertPriceItem(
        db,
        s.admin,
        {
          id: venue,
          labelFr: "Old",
          labelEn: "Old",
          unit: "flat",
          unitPriceCents: 1000,
          vatRateBp: 0,
          active: false,
        },
        SIGNAL(),
      );
      const inactive = await createQuote(
        db,
        s.owner,
        dealId,
        {
          language: "fr",
          validUntil: null,
          notes: null,
          lines: [{ priceItemId: venue, quantity: 1 }],
        },
        SIGNAL(),
      );
      expect(!inactive.ok && inactive.error.id).toBe(ERROR_IDS.QUOTE_INVALID);
    });
  });

  it("only an administrator changes the price grid, and a bad VAT rate is refused", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const denied = await upsertPriceItem(
        db,
        s.owner,
        {
          labelFr: "x",
          labelEn: "x",
          unit: "flat",
          unitPriceCents: 100,
          vatRateBp: 0,
          active: true,
        },
        SIGNAL(),
      );
      expect(!denied.ok && denied.error.id).toBe(ERROR_IDS.PERM_DENIED);
      const badVat = await upsertPriceItem(
        db,
        s.admin,
        {
          labelFr: "x",
          labelEn: "x",
          unit: "flat",
          unitPriceCents: 100,
          vatRateBp: 1234,
          active: true,
        },
        SIGNAL(),
      );
      expect(!badVat.ok && badVat.error.id).toBe(ERROR_IDS.QUOTE_INVALID);
      expect(await db.select().from(priceItems)).toHaveLength(0);
    });
  });

  it("everyone who can book a deal reads the grid; a viewer without that right does not", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await s.item("Location", 100000, 0);
      expect(await listPriceItems(db, s.owner, SIGNAL())).toHaveLength(1);
      expect(await listPriceItems(db, s.stranger, SIGNAL())).toEqual([]);
    });
  });

  it("the administrator sees the whole grid, inactive prices included; nobody else does", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const shown = await s.item("Shown", 100, 0);
      await upsertPriceItem(
        db,
        s.admin,
        {
          id: shown,
          labelFr: "Shown",
          labelEn: "Shown",
          unit: "flat",
          unitPriceCents: 100,
          vatRateBp: 0,
          active: false,
        },
        SIGNAL(),
      );
      expect((await listAllPriceItems(db, s.admin, SIGNAL())).map((i) => i.active)).toEqual([
        false,
      ]);
      expect(await listAllPriceItems(db, s.owner, SIGNAL())).toEqual([]);
    });
  });

  it("a quote moves from draft to sent to accepted, once, and never backwards", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const dealId = await s.insertDeal("Mariage Alpha", "all");
      const venue = await s.item("Location", 100000, 0);
      const q = await createQuote(
        db,
        s.owner,
        dealId,
        {
          language: "fr",
          validUntil: null,
          notes: null,
          lines: [{ priceItemId: venue, quantity: 1 }],
        },
        SIGNAL(),
      );
      if (!q.ok) throw new Error("quote should be created");
      expect((await acceptQuote(db, s.owner, q.value.id, SIGNAL())).ok).toBe(false);
      expect((await markQuoteSent(db, s.owner, q.value.id, SIGNAL())).ok).toBe(true);
      expect((await markQuoteSent(db, s.owner, q.value.id, SIGNAL())).ok).toBe(false);
      expect((await acceptQuote(db, s.owner, q.value.id, SIGNAL())).ok).toBe(true);
      expect((await acceptQuote(db, s.owner, q.value.id, SIGNAL())).ok).toBe(false);
      const stored = await db.select().from(quotes).where(eq(quotes.id, q.value.id));
      expect(stored[0]?.status).toBe("accepted");
      expect(
        await db.select().from(quoteLines).where(eq(quoteLines.quoteId, q.value.id)),
      ).toHaveLength(1);
    });
  });

  it("a deal hidden from the viewer shows no quote, and cannot be quoted", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const secret = await s.insertDeal("Secret", "owner");
      const venue = await s.item("Location", 100000, 0);
      expect(!(await listQuotes(db, s.stranger, secret, SIGNAL())).ok).toBe(true);
      const q = await createQuote(
        db,
        s.stranger,
        secret,
        {
          language: "fr",
          validUntil: null,
          notes: null,
          lines: [{ priceItemId: venue, quantity: 1 }],
        },
        SIGNAL(),
      );
      expect(!q.ok && q.error.id).toBe(ERROR_IDS.DEAL_NOT_FOUND);
    });
  });
});
