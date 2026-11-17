import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import type { PermissionFlagKey } from "@/constants/permissionFlags";
import { changeLogs } from "@/db/schema/changeLogs";
import { deals } from "@/db/schema/deals";
import { persons } from "@/db/schema/persons";
import { reservations } from "@/db/schema/reservations";
import { withTestDb } from "@/db/testing";
import { seedPipelineWithStages, seedUser } from "@/db/testing/factories";
import type { HydratedActor } from "@/server/hydrateActor";
import { loadQuoteDocument, recordDocumentExport } from "./quoteDocument";
import { createQuote, markQuoteSent, upsertPriceItem } from "./quoteRepo";

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
  const [client] = await db
    .insert(persons)
    .values({
      name: "Client fictif Alpha",
      primaryEmail: "alpha@example.com",
      ownerId: owner.id,
      visibilityLevel: "all",
    })
    .returning();
  const [deal] = await db
    .insert(deals)
    .values({
      title: "Mariage Alpha",
      pipelineId: pipeline.id,
      stageId: stages[0]?.id ?? "",
      ownerId: owner.id,
      visibilityLevel: "all",
      personId: client?.id ?? null,
    })
    .returning();
  if (deal === undefined) throw new Error("deal insert returned no row");
  const ownerActor = actorOf(owner, "regular", ["deal.edit_own", "deal.create"]);
  const adminActor = actorOf(admin, "admin");
  const priced = await upsertPriceItem(
    db,
    adminActor,
    {
      labelFr: "Location",
      labelEn: "Venue hire",
      unit: "per_day",
      unitPriceCents: 100000,
      vatRateBp: 550,
      active: true,
    },
    SIGNAL(),
  );
  if (!priced.ok) throw new Error("price item refused");
  const quote = await createQuote(
    db,
    ownerActor,
    deal.id,
    {
      language: "fr",
      validUntil: "2027-06-30",
      notes: null,
      lines: [{ priceItemId: priced.value.id, quantity: 2 }],
    },
    SIGNAL(),
  );
  if (!quote.ok) throw new Error("quote refused");
  return {
    owner: ownerActor,
    stranger: actorOf(
      { id: "00000000-0000-4000-8000-000000000004", name: "S", email: "s@example.com" },
      "regular",
    ),
    dealId: deal.id,
    quoteId: quote.value.id,
  };
}

describe("loadQuoteDocument (base réelle)", () => {
  it("returns the quote with its lines, the client's name and the event dates from its bookings", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await db.insert(reservations).values([
        {
          dealId: s.dealId,
          startDate: "2027-06-12",
          endDate: "2027-06-13",
          kind: "firm",
          state: "active",
        },
        {
          dealId: s.dealId,
          startDate: "2027-06-14",
          endDate: "2027-06-14",
          kind: "firm",
          state: "cancelled",
        },
      ]);
      const r = await loadQuoteDocument(db, s.owner, s.dealId, s.quoteId, SIGNAL());
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.value.clientName).toBe("Client fictif Alpha");
      expect(r.value.dealTitle).toBe("Mariage Alpha");
      expect(r.value.eventStart).toBe("2027-06-12");
      expect(r.value.eventEnd).toBe("2027-06-13");
      expect(r.value.lines).toHaveLength(1);
      expect(r.value.lines[0]).toMatchObject({
        quantity: 2,
        unitPriceCents: 100000,
        labelFr: "Location",
      });
    });
  });

  it("a viewer who cannot see the deal gets no document; an unknown quote is not found", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await db.update(deals).set({ visibilityLevel: "owner" }).where(eq(deals.id, s.dealId));
      const hidden = await loadQuoteDocument(db, s.stranger, s.dealId, s.quoteId, SIGNAL());
      expect(!hidden.ok && hidden.error.id).toBe(ERROR_IDS.DEAL_NOT_FOUND);
      const unknown = await loadQuoteDocument(
        db,
        s.owner,
        s.dealId,
        "00000000-0000-4000-8000-0000000000bb",
        SIGNAL(),
      );
      expect(!unknown.ok && unknown.error.id).toBe(ERROR_IDS.QUOTE_NOT_FOUND);
    });
  });

  it("a quote from another deal is not returned under this deal", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      const wrong = await loadQuoteDocument(
        db,
        s.owner,
        "00000000-0000-4000-8000-0000000000cc",
        s.quoteId,
        SIGNAL(),
      );
      expect(!wrong.ok).toBe(true);
    });
  });

  it("marks a quote as sent so the document shows it was issued", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      expect((await markQuoteSent(db, s.owner, s.quoteId, SIGNAL())).ok).toBe(true);
      const r = await loadQuoteDocument(db, s.owner, s.dealId, s.quoteId, SIGNAL());
      expect(r.ok && r.value.quote.status).toBe("sent");
    });
  });

  it("every export of a quote is written to the deal's audit trail", async () => {
    await withTestDb(async (db) => {
      const s = await setup(db);
      await recordDocumentExport(db, s.owner, s.dealId, s.quoteId, "quote", "fr", SIGNAL());
      const trail = await db.select().from(changeLogs).where(eq(changeLogs.entityId, s.dealId));
      expect(trail.map((e) => e.field)).toContain("document_export");
    });
  });
});
