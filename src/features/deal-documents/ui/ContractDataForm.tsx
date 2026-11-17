"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { STRINGS } from "@/constants/strings";
import type { PartyRole } from "@/features/contract-data/contractRules";
import { CONTRACT_NATURES, type ContractNature } from "@/features/contract-data/contractRules";
import {
  PaymentMessage,
  type PaymentMessageState,
  paymentErrorText,
} from "@/features/payments/ui/paymentMessage";
import { trpc } from "@/lib/trpc-client";
import { TenantFields, type TenantInitial } from "./TenantFields";

// What the contract form shows: the stay (if any), the tenants (if any), and whether this viewer
// may see and edit identity numbers.
export interface ContractView {
  terms: {
    nature: ContractNature;
    occupants: number;
    arrivalTime: string;
    departureTime: string;
  } | null;
  parties: Array<TenantInitial & { role: PartyRole }>;
  viewerIsAdmin: boolean;
}

const NATURE_OPTIONS = CONTRACT_NATURES.map((n) => ({
  value: n,
  label: STRINGS.contractForm.natures[n],
}));

// The details the rental contract is written from: the stay, then the two tenants.
export function ContractDataForm({ dealId }: { dealId: string }): React.ReactNode {
  const query = trpc.dealDocuments.contract.get.useQuery({ dealId });
  if (query.isPending)
    return <p className="text-sm text-muted-foreground">{STRINGS.dealRecords.loading}</p>;
  if (query.isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {STRINGS.dealRecords.loadError}
      </p>
    );
  return <ContractFields dealId={dealId} data={query.data} />;
}

function ContractFields({ dealId, data }: { dealId: string; data: ContractView }): React.ReactNode {
  const t = STRINGS.contractForm;
  const utils = trpc.useUtils();
  const save = trpc.dealDocuments.contract.saveTerms.useMutation({
    onSuccess: () => void utils.dealDocuments.contract.get.invalidate({ dealId }),
  });
  const [nature, setNature] = useState<ContractNature>(data.terms?.nature ?? "stay");
  const [occupants, setOccupants] = useState(String(data.terms?.occupants ?? ""));
  const [arrival, setArrival] = useState(data.terms?.arrivalTime ?? "16:00");
  const [departure, setDeparture] = useState(data.terms?.departureTime ?? "19:00");
  const [message, setMessage] = useState<PaymentMessageState>(null);

  const submit = (): void => {
    setMessage(null);
    save.mutate(
      {
        dealId,
        nature,
        occupants: Number(occupants),
        arrivalTime: arrival,
        departureTime: departure,
      },
      {
        onSuccess: () => setMessage({ tone: "ok", text: t.saved }),
        onError: (e) => setMessage({ tone: "error", text: paymentErrorText(e.message) }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2">
        <div className="grid gap-1 text-sm">
          <span className="text-muted-foreground">{t.nature}</span>
          <Select
            ariaLabel={t.nature}
            value={nature}
            onChange={(v) => setNature(v === "event" ? "event" : "stay")}
            options={NATURE_OPTIONS}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-muted-foreground">{t.occupants}</span>
          <Input
            aria-label={t.occupants}
            type="number"
            min={1}
            max={500}
            value={occupants}
            onChange={(e) => setOccupants(e.target.value)}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-muted-foreground">{t.arrivalTime}</span>
          <Input
            aria-label={t.arrivalTime}
            type="time"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-muted-foreground">{t.departureTime}</span>
          <Input
            aria-label={t.departureTime}
            type="time"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
        </div>
        <div className="flex flex-col items-start gap-1 md:col-span-2">
          <Button size="sm" disabled={save.isPending} onClick={submit}>
            {t.save}
          </Button>
          <PaymentMessage message={message} />
        </div>
      </section>

      {(["tenant_1", "tenant_2"] as const).map((role) => {
        const party = data.parties.find((p) => p.role === role) ?? null;
        return (
          <TenantFields
            key={role}
            dealId={dealId}
            role={role}
            label={role === "tenant_1" ? t.tenant1 : t.tenant2}
            initial={party}
            viewerIsAdmin={data.viewerIsAdmin}
          />
        );
      })}
    </div>
  );
}
