// The facts of a booking gathered for the deal's sidebar: dates, contract terms, tenants,
// headcount and the payment schedule. Read-only: each part is still edited in its own tab. Every
// read goes through the repo that owns it, so visibility is decided in one place.
import { and, asc, eq } from "drizzle-orm";
import type { AppError } from "@/constants/errorIds";
import { reservations } from "@/db/schema/reservations";
import { getContractData } from "@/features/contract-data/contractRepo";
import type { ContractTerms } from "@/features/contract-data/contractRules";
import { countNights } from "@/features/document-templates/fieldValues";
import { getEventSheet } from "@/features/event-sheet/eventSheetRepo";
import { listPaymentLines, type PaymentLineRow } from "@/features/payments/paymentRepo";
import type { PermSetUser } from "@/features/permissions/effective";
import type { ReservationKind } from "@/features/reservations/reservationRules";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { ok, type Result } from "@/types/result";

export interface StaySummary {
  dates: { startDate: string; endDate: string; nights: number; kind: ReservationKind } | null;
  terms: ContractTerms | null;
  tenants: string[];
  headcount: number | null;
  payments: PaymentLineRow[];
}

export async function getStaySummary(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  signal: AbortSignal,
): Promise<Result<StaySummary, AppError>> {
  // The first read decides visibility for the whole summary: a deal the actor cannot see stops here.
  const contract = await getContractData(db, actor, dealId, signal);
  if (!contract.ok) return contract;
  const sheet = await getEventSheet(db, actor, dealId, signal);
  if (!sheet.ok) return sheet;
  const payments = await listPaymentLines(db, actor, dealId, signal);
  if (!payments.ok) return payments;

  const [booking] = await db
    .select({
      startDate: reservations.startDate,
      endDate: reservations.endDate,
      kind: reservations.kind,
    })
    .from(reservations)
    .where(and(eq(reservations.dealId, dealId), eq(reservations.state, "active")))
    .orderBy(asc(reservations.startDate))
    .limit(1);
  signal.throwIfAborted();

  return ok({
    dates:
      booking === undefined
        ? null
        : { ...booking, nights: countNights(booking.startDate, booking.endDate) },
    terms: contract.value.terms,
    tenants: contract.value.parties.map((party) => party.fullName),
    headcount: sheet.value.headcount,
    payments: payments.value,
  });
}
