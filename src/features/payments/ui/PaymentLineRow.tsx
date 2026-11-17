"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { STRINGS } from "@/constants/strings";
import { recordPaymentAction } from "@/features/payments/paymentActions";
import type { PaymentLineRow as Line } from "@/features/payments/paymentRepo";
import { MAX_PAYMENT_REFERENCE_LENGTH } from "@/features/payments/paymentRules";
import { formatCents } from "@/features/quotes/documentFormat";
import { readCsrfToken } from "@/utils/csrfCookie";
import { PaymentMessage, type PaymentMessageState, paymentErrorText } from "./paymentMessage";

export interface PaymentLineRowProps {
  dealId: string;
  line: Line;
  overdue: boolean;
  today: string;
  // Called after a payment is recorded, so the host can refetch the schedule.
  onSaved?: () => void;
}

// A deposit or balance is settled by recording the day it arrived; a hold by its release day.
export function PaymentLineRow({
  dealId,
  line,
  overdue,
  today,
  onSaved,
}: PaymentLineRowProps): React.ReactNode {
  const [paidOn, setPaidOn] = useState(today);
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState<PaymentMessageState>(null);
  const [pending, startTransition] = useTransition();
  const settled = line.status === "paid" || line.status === "released";
  const actionLabel = line.kind === "hold" ? STRINGS.payments.release : STRINGS.payments.record;

  return (
    <li className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_8rem_10rem_auto] md:items-end">
      <div className="text-sm">
        <p className="font-medium">{STRINGS.payments.kinds[line.kind]}</p>
        <p className="text-muted-foreground">
          {formatCents(line.amountCents, "fr")} · {STRINGS.payments.dueLabel} {line.dueOn}
          {overdue ? (
            <span className="ml-2 font-medium text-destructive">{STRINGS.payments.overdue}</span>
          ) : null}
        </p>
        {line.paidOn !== null ? (
          <p className="text-xs text-muted-foreground">
            {line.paidOn}
            {line.reference !== null ? ` · ${line.reference}` : ""}
          </p>
        ) : null}
      </div>
      <p className="text-sm font-medium md:self-center">{STRINGS.payments.statuses[line.status]}</p>

      {settled ? null : (
        <>
          <Input
            aria-label={`${STRINGS.payments.kinds[line.kind]}: ${STRINGS.payments.paidOnLabel}`}
            type="date"
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
          />
          <div className="flex flex-col items-start gap-1">
            <Input
              aria-label={`${STRINGS.payments.kinds[line.kind]}: ${STRINGS.payments.referenceLabel}`}
              value={reference}
              maxLength={MAX_PAYMENT_REFERENCE_LENGTH}
              onChange={(e) => setReference(e.target.value)}
              className="mb-1"
            />
            <Button
              size="sm"
              disabled={pending}
              onClick={() => {
                setMessage(null);
                startTransition(async () => {
                  const result = await recordPaymentAction(
                    { dealId, lineId: line.id, paidOn, reference },
                    readCsrfToken(),
                  );
                  if (result.ok) onSaved?.();
                  setMessage(
                    result.ok
                      ? { tone: "ok", text: STRINGS.payments.saved }
                      : { tone: "error", text: paymentErrorText(result.error.id) },
                  );
                });
              }}
            >
              {actionLabel}
            </Button>
            <PaymentMessage message={message} />
          </div>
        </>
      )}
    </li>
  );
}
