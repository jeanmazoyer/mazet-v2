"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { STRINGS } from "@/constants/strings";
import { addPaymentLineAction } from "@/features/payments/paymentActions";
import { PAYMENT_KINDS, type PaymentKind } from "@/features/payments/paymentRules";
import { readCsrfToken } from "@/utils/csrfCookie";
import { PaymentMessage, type PaymentMessageState, paymentErrorText } from "./paymentMessage";

const KIND_OPTIONS = PAYMENT_KINDS.map((kind) => ({
  value: kind,
  label: STRINGS.payments.kinds[kind],
}));

// Creating a line never settles it: the deposit or balance stays due until its money arrives.
export function AddPaymentLineForm({
  dealId,
  onSaved,
}: {
  dealId: string;
  onSaved?: () => void;
}): React.ReactNode {
  const [kind, setKind] = useState<PaymentKind>("deposit");
  const [amountText, setAmountText] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [message, setMessage] = useState<PaymentMessageState>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[12rem_minmax(0,1fr)_12rem_auto] md:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await addPaymentLineAction(
            { dealId, kind, amountText, dueOn },
            readCsrfToken(),
          );
          if (result.ok) {
            setAmountText("");
            setDueOn("");
            onSaved?.();
            setMessage({ tone: "ok", text: STRINGS.payments.saved });
          } else {
            setMessage({ tone: "error", text: paymentErrorText(result.error.id) });
          }
        });
      }}
    >
      <div className="grid gap-1 text-sm">
        <span className="text-muted-foreground">{STRINGS.payments.kindLabel}</span>
        <Select
          ariaLabel={STRINGS.payments.kindLabel}
          value={kind}
          onChange={(v) => setKind(v === "balance" || v === "hold" ? v : "deposit")}
          options={KIND_OPTIONS}
        />
      </div>
      <div className="grid gap-1 text-sm">
        <span className="text-muted-foreground">{STRINGS.payments.amountLabel}</span>
        <Input
          aria-label={STRINGS.payments.amountLabel}
          inputMode="decimal"
          value={amountText}
          maxLength={20}
          onChange={(e) => setAmountText(e.target.value)}
        />
      </div>
      <div className="grid gap-1 text-sm">
        <span className="text-muted-foreground">{STRINGS.payments.dueLabel}</span>
        <Input
          aria-label={STRINGS.payments.dueLabel}
          type="date"
          value={dueOn}
          onChange={(e) => setDueOn(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Button type="submit" size="sm" disabled={pending}>
          {STRINGS.payments.add}
        </Button>
        <PaymentMessage message={message} />
      </div>
    </form>
  );
}
