"use client";
import { CircleAlert, CircleCheck, Clock, Landmark, ShieldCheck } from "lucide-react";
import type React from "react";
import { Progress } from "@/components/ui/Progress";
import { STRINGS } from "@/constants/strings";
import { formatShortDate } from "@/features/document-templates/fieldValues";
import { formatCents } from "@/features/quotes/documentFormat";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";
import { buildFinanceOverview, type FinanceLine } from "../financeOverview";
import type { StaySummary } from "../staySummary";

const F = STRINGS.finance;
const ICON = "mt-0.5 h-4 w-4 shrink-0";
const money = (cents: number): string => formatCents(cents, "fr");

const STATE_ICON: Record<FinanceLine["state"], React.ReactNode> = {
  paid: <CircleCheck aria-hidden="true" className={cn(ICON, "text-success")} />,
  overdue: <CircleAlert aria-hidden="true" className={cn(ICON, "text-destructive")} />,
  due: <Clock aria-hidden="true" className={cn(ICON, "text-muted-foreground")} />,
  held: <ShieldCheck aria-hidden="true" className={cn(ICON, "text-muted-foreground")} />,
  released: <ShieldCheck aria-hidden="true" className={cn(ICON, "text-success")} />,
};

function stateText(line: FinanceLine): string {
  const day = formatShortDate(line.paidOn ?? line.dueOn);
  return F.states[line.state](day);
}

function LineRow({ line }: { line: FinanceLine }): React.ReactNode {
  return (
    <li className="flex gap-2 py-1.5">
      {STATE_ICON[line.state]}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">{STRINGS.payments.kinds[line.kind]}</span>
          <span className="shrink-0 tabular-nums">{money(line.amountCents)}</span>
        </div>
        <p
          className={cn(
            "text-xs",
            line.state === "overdue" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {stateText(line)}
        </p>
        {line.isIncome && line.state === "paid" && (
          <p
            className={cn(
              "mt-0.5 flex items-start gap-1 text-xs",
              line.bankMatched ? "text-success" : "text-warning-foreground",
            )}
          >
            <Landmark aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="min-w-0 break-words">
              {line.bankMatched ? F.bankMatched(line.reference ?? "") : F.bankUnmatched}
            </span>
          </p>
        )}
      </div>
    </li>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }): React.ReactNode {
  return (
    <li className="flex items-start gap-2 py-0.5 text-xs">
      {ok ? (
        <CircleCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
      ) : (
        <CircleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
      )}
      <span className={ok ? "text-muted-foreground" : "text-destructive"}>{label}</span>
    </li>
  );
}

// The money side of a booking at a glance: how much has come in, where each payment stands, and
// whether what was received has been found on the bank statement. Read-only: payments are
// recorded in the Payments tab.
export function FinanceSection({
  dealId,
  dealValueCents,
  initialStay,
}: {
  dealId: string;
  dealValueCents: number | null;
  initialStay?: StaySummary;
}): React.ReactNode {
  const query = trpc.dealDocuments.stay.useQuery({ dealId }, { initialData: initialStay });
  if (query.data === undefined) {
    return <p className="py-1.5 text-muted-foreground text-sm">{F.loading}</p>;
  }
  // The day is taken in UTC on both sides, so the server and the browser agree on what is overdue.
  const today = new Date().toISOString().slice(0, 10);
  const overview = buildFinanceOverview(query.data.payments, dealValueCents, today);
  if (overview.lines.length === 0) {
    return <p className="py-1.5 text-muted-foreground text-sm">{F.empty}</p>;
  }
  const percent =
    overview.expectedCents === 0
      ? 0
      : Math.round((overview.receivedCents / overview.expectedCents) * 100);
  const { checks } = overview;

  return (
    <div className="text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold tabular-nums">{money(overview.receivedCents)}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {F.receivedOf(money(overview.expectedCents), percent)}
        </span>
      </div>
      <Progress
        value={percent}
        label={F.progressLabel}
        className="mt-1.5 mb-2"
        indicatorClassName={percent === 100 ? "bg-success" : undefined}
      />
      <ul className="divide-y">
        {overview.lines.map((line) => (
          <LineRow key={line.id} line={line} />
        ))}
      </ul>
      <p className="mt-2 mb-0.5 font-medium text-muted-foreground text-xs">{F.checksTitle}</p>
      <ul>
        {checks.scheduleMatchesDeal !== null && (
          <Check
            ok={checks.scheduleMatchesDeal}
            label={checks.scheduleMatchesDeal ? F.checks.scheduleOk : F.checks.scheduleOff}
          />
        )}
        <Check
          ok={checks.nothingOverdue}
          label={checks.nothingOverdue ? F.checks.noOverdue : F.checks.overdue}
        />
        <Check
          ok={checks.receivedAllMatched}
          label={checks.receivedAllMatched ? F.checks.bankOk : F.checks.bankMissing}
        />
      </ul>
    </div>
  );
}
