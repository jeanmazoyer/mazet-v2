"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { STRINGS } from "@/constants/strings";
import { upsertPriceItemAction } from "@/features/quotes/quoteActions";
import { VAT_RATES_BP } from "@/features/quotes/quoteMath";
import { readCsrfToken } from "@/utils/csrfCookie";
import { quoteErrorText } from "./quoteErrors";

const t = STRINGS.quotes;

export function PriceGridForm(): React.ReactNode {
  const router = useRouter();
  const [labelFr, setLabelFr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [unit, setUnit] = useState<"flat" | "per_day" | "per_person">("flat");
  const [price, setPrice] = useState("");
  const [vatRateBp, setVatRateBp] = useState(2000);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1 text-sm">
          <span className="font-medium">{t.labelFr}</span>
          <Input
            aria-label={t.labelFr}
            value={labelFr}
            onChange={(e) => setLabelFr(e.target.value)}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="font-medium">{t.labelEn}</span>
          <Input
            aria-label={t.labelEn}
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="font-medium">{t.unit}</span>
          <Select
            ariaLabel={t.unit}
            value={unit}
            onChange={(v) => setUnit(v === "per_day" || v === "per_person" ? v : "flat")}
            options={[
              { value: "flat", label: t.units.flat },
              { value: "per_day", label: t.units.per_day },
              { value: "per_person", label: t.units.per_person },
            ]}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="font-medium">{t.price}</span>
          <Input
            aria-label={t.price}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="font-medium">{t.vatRate}</span>
          <Select
            ariaLabel={t.vatRate}
            value={String(vatRateBp)}
            onChange={(v) => setVatRateBp(Number(v))}
            options={VAT_RATES_BP.map((bp) => ({ value: String(bp), label: `${bp / 100} %` }))}
          />
        </div>
      </div>

      {error !== null ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div>
        <Button
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await upsertPriceItemAction(
                { labelFr, labelEn, unit, price, vatRateBp, active: true },
                readCsrfToken(),
              );
              if (result.ok) {
                setLabelFr("");
                setLabelEn("");
                setPrice("");
                router.refresh();
                return;
              }
              setError(quoteErrorText(result.error.id));
            });
          }}
        >
          {t.priceSave}
        </Button>
      </div>
    </div>
  );
}
