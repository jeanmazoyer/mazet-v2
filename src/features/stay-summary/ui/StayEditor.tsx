"use client";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { STRINGS } from "@/constants/strings";
import { CONTRACT_NATURES, PARTY_ROLES } from "@/features/contract-data/contractRules";
import { BulkEditRow } from "@/features/deal-workspace/sidebar/BulkEditRow";
import { InlineEditFooter } from "@/features/inline-edit/InlineEditFooter";
import { trpc } from "@/lib/trpc-client";
import type { StaySummary } from "../staySummary";
import { stayErrorMessage } from "./stayErrors";

const S = STRINGS.stay;
const NATURE_OPTIONS = CONTRACT_NATURES.map((value) => ({ value, label: S.natures[value] }));
const DEFAULT_ARRIVAL = "16:00";
const DEFAULT_DEPARTURE = "18:00";

// Every booking fact of the sidebar open at once behind a single Save, like the other sections'
// pencil. Payments are not edited here: recording money keeps its own tab and its own checks.
export function StayEditor({
  dealId,
  stay,
  onExit,
}: {
  dealId: string;
  stay: StaySummary;
  onExit: () => void;
}): React.ReactNode {
  const router = useRouter();
  const utils = trpc.useUtils();
  const save = trpc.dealDocuments.saveStay.useMutation();
  const [startDate, setStartDate] = useState(stay.dates?.startDate ?? "");
  const [endDate, setEndDate] = useState(stay.dates?.endDate ?? "");
  const [nature, setNature] = useState<string>(stay.terms?.nature ?? "stay");
  const [arrival, setArrival] = useState(stay.terms?.arrivalTime ?? DEFAULT_ARRIVAL);
  const [departure, setDeparture] = useState(stay.terms?.departureTime ?? DEFAULT_DEPARTURE);
  const [headcount, setHeadcount] = useState(String(stay.headcount ?? ""));
  const [occupants, setOccupants] = useState(String(stay.terms?.occupants ?? ""));
  const [tenants, setTenants] = useState(PARTY_ROLES.map((_, i) => stay.tenants[i] ?? ""));
  const [error, setError] = useState<string | null>(null);

  function onSave(): void {
    const sleeping = Number(occupants);
    const guests = headcount.trim() === "" ? null : Number(headcount);
    if (!Number.isInteger(sleeping) || (guests !== null && !Number.isInteger(guests))) {
      setError(S.errors.numbers);
      return;
    }
    setError(null);
    save.mutate(
      {
        dealId,
        startDate,
        endDate,
        nature: nature === "event" ? "event" : "stay",
        occupants: sleeping,
        arrivalTime: arrival.trim(),
        departureTime: departure.trim(),
        headcount: guests,
        tenants,
      },
      {
        onSuccess: () => {
          void utils.dealDocuments.invalidate();
          router.refresh();
          onExit();
        },
        onError: (e) => setError(stayErrorMessage(e.message)),
      },
    );
  }

  const pending = save.isPending;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5 text-muted-foreground text-xs">
          <span>{S.startDate}</span>
          <Input
            aria-label={S.startDate}
            type="date"
            value={startDate}
            disabled={pending}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-0.5 text-muted-foreground text-xs">
          <span>{S.endDate}</span>
          <Input
            aria-label={S.endDate}
            type="date"
            value={endDate}
            disabled={pending}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-0.5 text-muted-foreground text-xs">
        <span>{S.type}</span>
        <Select ariaLabel={S.type} value={nature} onChange={setNature} options={NATURE_OPTIONS} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <BulkEditRow label={S.checkIn} value={arrival} onChange={setArrival} disabled={pending} />
        <BulkEditRow
          label={S.checkOut}
          value={departure}
          onChange={setDeparture}
          disabled={pending}
        />
        <BulkEditRow
          label={S.guests}
          value={headcount}
          onChange={setHeadcount}
          disabled={pending}
        />
        <BulkEditRow
          label={S.sleeping}
          value={occupants}
          onChange={setOccupants}
          disabled={pending}
        />
      </div>
      {tenants.map((name, index) => (
        <BulkEditRow
          // The list has a fixed length (one row per contract role), so the position is the identity.
          key={PARTY_ROLES[index]}
          label={S.tenant(index + 1)}
          value={name}
          onChange={(value) => setTenants(tenants.map((t, i) => (i === index ? value : t)))}
          disabled={pending}
        />
      ))}
      <p className="text-muted-foreground text-xs">{S.paymentsHint}</p>
      {error !== null ? (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      ) : null}
      <InlineEditFooter onCancel={onExit} onSave={onSave} saveDisabled={false} pending={pending} />
    </div>
  );
}
