"use client";
import { CircleAlert, CircleCheck, Clock, Landmark, ShieldCheck } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { STRINGS } from "@/constants/strings";
import { formatShortDate } from "@/features/document-templates/fieldValues";
import { InlineEditFooter } from "@/features/inline-edit/InlineEditFooter";
import { formatCents } from "@/features/quotes/documentFormat";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";
import type { FinanceLine } from "../financeOverview";

const F = STRINGS.finance;
const ICON = "mt-0.5 h-4 w-4 shrink-0";
const LINK = "text-link text-xs hover:underline disabled:opacity-50";
const PICKER =
  "flex h-8 w-full items-center rounded border border-field-border bg-card px-2 text-left text-sm";

const STATE_ICON: Record<FinanceLine["state"], React.ReactNode> = {
  paid: <CircleCheck aria-hidden="true" className={cn(ICON, "text-success")} />,
  overdue: <CircleAlert aria-hidden="true" className={cn(ICON, "text-destructive")} />,
  due: <Clock aria-hidden="true" className={cn(ICON, "text-muted-foreground")} />,
  held: <ShieldCheck aria-hidden="true" className={cn(ICON, "text-muted-foreground")} />,
  released: <ShieldCheck aria-hidden="true" className={cn(ICON, "text-success")} />,
};

type Mode = "idle" | "settling" | "undoing";

// One payment of the schedule: its state at a glance, whether the bank statement confirms it,
// and the person's own word on it. Marking it received (or not received after all) is a manual
// override: it never invents a bank match, so a line forced by hand stays flagged as unmatched.
export function FinanceLineRow({
  dealId,
  line,
  today,
  onChanged,
}: {
  dealId: string;
  line: FinanceLine;
  today: string;
  onChanged: () => void;
}): React.ReactNode {
  const [mode, setMode] = useState<Mode>("idle");
  const [day, setDay] = useState<string | null>(today);
  const [error, setError] = useState(false);
  const callbacks = {
    onSuccess: () => {
      setMode("idle");
      onChanged();
    },
    onError: () => setError(true),
  };
  const receive = trpc.dealDocuments.markReceived.useMutation(callbacks);
  const undo = trpc.dealDocuments.markNotReceived.useMutation(callbacks);
  const pending = receive.isPending || undo.isPending;
  const settled = line.state === "paid" || line.state === "released";
  const isHold = !line.isIncome;

  function open(next: Mode): void {
    setError(false);
    setDay(today);
    setMode(next);
  }

  return (
    <li className="flex gap-2 py-1.5">
      {STATE_ICON[line.state]}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">{STRINGS.payments.kinds[line.kind]}</span>
          <span className="shrink-0 tabular-nums">{formatCents(line.amountCents, "fr")}</span>
        </div>
        <p
          className={cn(
            "text-xs",
            line.state === "overdue" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {F.states[line.state](formatShortDate(line.paidOn ?? line.dueOn))}
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

        {mode === "idle" && (
          <button
            type="button"
            className={cn(LINK, "mt-0.5")}
            onClick={() => open(settled ? "undoing" : "settling")}
          >
            {settled
              ? isHold
                ? F.actions.markHeld
                : F.actions.markNotReceived
              : isHold
                ? F.actions.markReleased
                : F.actions.markReceived}
          </button>
        )}
        {mode === "settling" && (
          <div className="mt-1">
            <span className="text-muted-foreground text-xs">
              {isHold ? F.actions.releasedOn : F.actions.receivedOn}
            </span>
            <DatePicker
              ariaLabel={isHold ? F.actions.releasedOn : F.actions.receivedOn}
              value={day}
              triggerClassName={PICKER}
              formatLabel={formatShortDate}
              onChange={setDay}
            />
            <InlineEditFooter
              onCancel={() => setMode("idle")}
              onSave={() => {
                if (day !== null) receive.mutate({ dealId, lineId: line.id, paidOn: day });
              }}
              saveDisabled={day === null}
              pending={pending}
            />
          </div>
        )}
        {mode === "undoing" && (
          <div className="mt-1 flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={pending} onClick={() => setMode("idle")}>
              {F.actions.cancel}
            </Button>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => undo.mutate({ dealId, lineId: line.id })}
            >
              {F.actions.confirmUndo}
            </Button>
          </div>
        )}
        {error && (
          <span role="alert" className="mt-1 block text-destructive text-xs">
            {F.actions.error}
          </span>
        )}
      </div>
    </li>
  );
}
