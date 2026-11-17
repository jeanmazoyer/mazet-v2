"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { STRINGS } from "@/constants/strings";
import { formatCents } from "@/features/quotes/documentFormat";
import { createQuoteAction } from "@/features/quotes/quoteActions";
import type { PriceItemRow } from "@/features/quotes/quoteRepo";
import { readCsrfToken } from "@/utils/csrfCookie";
import { quoteErrorText } from "./quoteErrors";

// Each service is a quantity field: 0 leaves it out. The server re-prices every line from the
// grid, so what is typed here can only choose services, never set a price.
export function NewQuoteForm({
  dealId,
  items,
  onChanged,
}: {
  dealId: string;
  items: PriceItemRow[];
  onChanged?: () => void;
}): React.ReactNode {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    const lines = items
      .map((item) => ({ priceItemId: item.id, quantity: Number(quantities[item.id] ?? "0") }))
      .filter((line) => line.quantity > 0);
    startTransition(async () => {
      const result = await createQuoteAction(
        {
          dealId,
          language,
          validUntil: validUntil === "" ? null : validUntil,
          notes: notes === "" ? null : notes,
          lines,
        },
        readCsrfToken(),
      );
      if (result.ok) {
        setQuantities({});
        setNotes("");
        router.refresh();
        onChanged?.();
        return;
      }
      setError(quoteErrorText(result.error.id));
    });
  };

  return (
    <div className="grid gap-4">
      <ul className="grid gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-3 text-sm"
          >
            <span>
              {item.labelEn}
              <span className="ml-2 text-muted-foreground">
                {formatCents(item.unitPriceCents, "en")} · {STRINGS.quotes.units[item.unit]} · VAT{" "}
                {item.vatRateBp / 100}%
              </span>
            </span>
            <Input
              aria-label={`${item.labelEn}: quantity`}
              type="number"
              min={0}
              max={1000}
              step={1}
              value={quantities[item.id] ?? ""}
              onChange={(e) => setQuantities((q) => ({ ...q, [item.id]: e.target.value }))}
            />
          </li>
        ))}
      </ul>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1 text-sm">
          <span className="font-medium">{STRINGS.quotes.documentLanguage}</span>
          <Select
            ariaLabel={STRINGS.quotes.documentLanguage}
            value={language}
            onChange={(v) => setLanguage(v === "en" ? "en" : "fr")}
            options={[
              { value: "fr", label: STRINGS.quotes.french },
              { value: "en", label: STRINGS.quotes.english },
            ]}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="font-medium">{STRINGS.quotes.validUntil}</span>
          <Input
            aria-label={STRINGS.quotes.validUntil}
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-1 text-sm">
        <span className="font-medium">{STRINGS.quotes.notes}</span>
        <Textarea
          aria-label={STRINGS.quotes.notes}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error !== null ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div>
        <Button onClick={submit} disabled={pending || items.length === 0}>
          {STRINGS.quotes.create}
        </Button>
      </div>
    </div>
  );
}
