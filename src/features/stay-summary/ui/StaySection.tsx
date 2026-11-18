"use client";
import type React from "react";
import { STRINGS } from "@/constants/strings";
import { FieldRow } from "@/features/deal-workspace/sidebar/FieldRow";
import { formatShortDate } from "@/features/document-templates/fieldValues";
import { formatCents } from "@/features/quotes/documentFormat";
import { trpc } from "@/lib/trpc-client";
import type { StaySummary } from "../staySummary";

const S = STRINGS.stay;

function paymentLine(line: StaySummary["payments"][number]): string {
  const amount = formatCents(line.amountCents, "fr");
  const when =
    line.paidOn === null
      ? `${S.dueOn} ${formatShortDate(line.dueOn)}`
      : formatShortDate(line.paidOn);
  return `${amount}, ${STRINGS.payments.statuses[line.status].toLowerCase()} ${when}`;
}

// The booking at a glance, in the deal's sidebar. Nothing is edited here: each fact has its own
// tab (Documents, Payments, Event), and this is where they are read together.
export function StaySection({ dealId }: { dealId: string }): React.ReactNode {
  const query = trpc.dealDocuments.stay.useQuery({ dealId });
  const stay = query.data;
  if (stay === undefined) {
    return (
      <p className="py-1.5 text-sm text-muted-foreground">{query.isError ? S.error : S.loading}</p>
    );
  }
  const { dates, terms } = stay;
  const empty =
    dates === null && terms === null && stay.tenants.length === 0 && stay.payments.length === 0;
  if (empty) return <p className="py-1.5 text-sm text-muted-foreground">{S.empty}</p>;

  return (
    <>
      <FieldRow label={S.dates} empty={dates === null}>
        {dates !== null && (
          <>
            {formatShortDate(dates.startDate)} {S.to} {formatShortDate(dates.endDate)}
            <span className="block text-xs text-muted-foreground">
              {S.nights(dates.nights)}, {S.bookingKinds[dates.kind]}
            </span>
          </>
        )}
      </FieldRow>
      <FieldRow label={S.type} empty={terms === null}>
        {terms !== null && S.natures[terms.nature]}
      </FieldRow>
      <FieldRow label={S.checkIn} empty={terms === null}>
        <span className="tabular-nums">{terms?.arrivalTime}</span>
      </FieldRow>
      <FieldRow label={S.checkOut} empty={terms === null}>
        <span className="tabular-nums">{terms?.departureTime}</span>
      </FieldRow>
      <FieldRow label={S.guests} empty={stay.headcount === null}>
        <span className="tabular-nums">{stay.headcount}</span>
      </FieldRow>
      <FieldRow label={S.sleeping} empty={terms === null}>
        <span className="tabular-nums">{terms?.occupants}</span>
      </FieldRow>
      <FieldRow label={S.tenants} empty={stay.tenants.length === 0}>
        {stay.tenants.map((name) => (
          <span key={name} className="block">
            {name}
          </span>
        ))}
      </FieldRow>
      {stay.payments.map((line) => (
        <FieldRow key={line.id} label={STRINGS.payments.kinds[line.kind]}>
          <span className="tabular-nums">{paymentLine(line)}</span>
        </FieldRow>
      ))}
    </>
  );
}
