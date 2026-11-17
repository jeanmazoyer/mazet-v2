// The values a document can fill, read from the deal as the viewer may see it. Identity numbers
// come through only for administrators (getContractData already withholds them from anyone else).
import { and, eq } from "drizzle-orm";
import { deals } from "@/db/schema/deals";
import { reservations } from "@/db/schema/reservations";
import { getContractData } from "@/features/contract-data/contractRepo";
import type { PermSetUser } from "@/features/permissions/effective";
import { formatCents } from "@/features/quotes/documentFormat";
import type { DbOrTx } from "@/server/realtime/channelVersions";

// Dates in the short form the contract uses (14/09/2027), not the long form of quotes.
export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

// Nights between two inclusive stay days: from the 14th to the 16th is two nights.
export function countNights(startIso: string, endIso: string): number {
  const ms = Date.parse(`${endIso}T00:00:00Z`) - Date.parse(`${startIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export async function buildFieldValues(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  signal: AbortSignal,
): Promise<Record<string, string | undefined>> {
  const [deal] = await db
    .select({ title: deals.title, value: deals.value })
    .from(deals)
    .where(eq(deals.id, dealId))
    .limit(1);
  const [stay] = await db
    .select({ startDate: reservations.startDate, endDate: reservations.endDate })
    .from(reservations)
    .where(and(eq(reservations.dealId, dealId), eq(reservations.state, "active")))
    .orderBy(reservations.startDate)
    .limit(1);
  const contract = await getContractData(db, actor, dealId, signal);
  const terms = contract.ok ? contract.value.terms : null;
  const tenant = (role: "tenant_1" | "tenant_2") =>
    contract.ok ? contract.value.parties.find((p) => p.role === role) : undefined;
  const t1 = tenant("tenant_1");
  const t2 = tenant("tenant_2");
  const today = new Date().toISOString().slice(0, 10);

  return {
    dealTitle: deal?.title,
    dealValue:
      deal?.value === null || deal?.value === undefined
        ? undefined
        : formatCents(Math.round(Number(deal.value) * 100), "fr"),
    arrivalDate: stay === undefined ? undefined : formatShortDate(stay.startDate),
    departureDate: stay === undefined ? undefined : formatShortDate(stay.endDate),
    nights: stay === undefined ? undefined : String(countNights(stay.startDate, stay.endDate)),
    occupants: terms === null ? undefined : String(terms.occupants),
    arrivalTime: terms?.arrivalTime,
    departureTime: terms?.departureTime,
    tenant1Name: t1?.fullName,
    tenant1Email: t1?.email ?? undefined,
    tenant1Phone: t1?.phone ?? undefined,
    tenant1Address: t1?.address ?? undefined,
    tenant1IdNumber: t1?.idNumber ?? undefined,
    tenant2Name: t2?.fullName,
    tenant2Email: t2?.email ?? undefined,
    tenant2Phone: t2?.phone ?? undefined,
    tenant2Address: t2?.address ?? undefined,
    tenant2IdNumber: t2?.idNumber ?? undefined,
    today: formatShortDate(today),
  };
}
