"use client";
import { STRINGS } from "@/constants/strings";
import { isOverdue } from "@/features/payments/paymentRules";
import { AddPaymentLineForm } from "@/features/payments/ui/AddPaymentLineForm";
import { PaymentLineRow } from "@/features/payments/ui/PaymentLineRow";
import { trpc } from "@/lib/trpc-client";

// The booking's payment schedule, shown inside the deal's Payments tab.
export function DealPaymentsPanel({ dealId }: { dealId: string }): React.ReactNode {
  const utils = trpc.useUtils();
  const query = trpc.dealDocuments.payments.useQuery({ dealId });
  const refresh = () => void utils.dealDocuments.payments.invalidate({ dealId });
  if (query.isPending)
    return <p className="text-sm text-muted-foreground">{STRINGS.dealRecords.loading}</p>;
  if (query.isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {STRINGS.dealRecords.loadError}
      </p>
    );

  // Overdue is judged on the day the panel is shown, in UTC, the same day the schedule stores.
  const today = new Date().toISOString().slice(0, 10);
  const lines = query.data;
  return (
    <div className="flex flex-col gap-4">
      <AddPaymentLineForm dealId={dealId} onSaved={refresh} />
      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{STRINGS.payments.empty}</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card px-4">
          {lines.map((line) => (
            <PaymentLineRow
              key={line.id}
              dealId={dealId}
              line={line}
              today={today}
              overdue={isOverdue(line, today)}
              onSaved={refresh}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
