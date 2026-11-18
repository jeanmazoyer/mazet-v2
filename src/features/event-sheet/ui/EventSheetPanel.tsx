"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { STRINGS } from "@/constants/strings";
import {
  PaymentMessage,
  type PaymentMessageState,
  paymentErrorText,
} from "@/features/payments/ui/paymentMessage";
import { trpc } from "@/lib/trpc-client";

const t = STRINGS.eventSheet;

// The event sheet of the booking: headcount, notes, providers and accommodations. Printing takes
// the same data onto a page for the people on site.
export function EventSheetPanel({ dealId }: { dealId: string }): React.ReactNode {
  const query = trpc.dealDocuments.event.get.useQuery({ dealId });
  if (query.isPending)
    return <p className="text-sm text-muted-foreground">{STRINGS.dealRecords.loading}</p>;
  if (query.isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {STRINGS.dealRecords.loadError}
      </p>
    );
  return <EventSheetFields dealId={dealId} sheet={query.data} />;
}

interface SheetView {
  headcount: number | null;
  notes: string | null;
  providers: Array<{
    id: string;
    name: string;
    role: string;
    contact: string | null;
    arrivalTime: string | null;
  }>;
  accommodations: Array<{ id: string; name: string; beds: number | null; notes: string | null }>;
}

function EventSheetFields({
  dealId,
  sheet,
}: {
  dealId: string;
  sheet: SheetView;
}): React.ReactNode {
  const utils = trpc.useUtils();
  const refresh = () => void utils.dealDocuments.event.get.invalidate({ dealId });
  const [headcount, setHeadcount] = useState(
    sheet.headcount === null ? "" : String(sheet.headcount),
  );
  const [notes, setNotes] = useState(sheet.notes ?? "");
  const [message, setMessage] = useState<PaymentMessageState>(null);
  const saveSheet = trpc.dealDocuments.event.saveSheet.useMutation({ onSuccess: refresh });
  const removeProvider = trpc.dealDocuments.event.removeProvider.useMutation({
    onSuccess: refresh,
  });
  const removeAccommodation = trpc.dealDocuments.event.removeAccommodation.useMutation({
    onSuccess: refresh,
  });

  const saveHeadcount = (): void => {
    setMessage(null);
    saveSheet.mutate(
      {
        dealId,
        headcount: headcount.trim() === "" ? null : Number(headcount),
        notes: notes.trim() === "" ? null : notes.trim(),
      },
      {
        onSuccess: () => setMessage({ tone: "ok", text: t.saved }),
        onError: (e) => setMessage({ tone: "error", text: paymentErrorText(e.message) }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link
          href={`/deals/${dealId}/event-sheet`}
          target="_blank"
          className="text-sm underline underline-offset-4"
        >
          {t.print}
        </Link>
      </div>

      <section className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="grid gap-1 text-sm">
          <span className="text-muted-foreground">{t.headcount}</span>
          <Input
            aria-label={t.headcount}
            type="number"
            min={1}
            max={1000}
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value)}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-muted-foreground">{t.notes}</span>
          <Textarea
            aria-label={t.notes}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex flex-col items-start gap-1 md:col-span-2">
          <Button size="sm" disabled={saveSheet.isPending} onClick={saveHeadcount}>
            {t.save}
          </Button>
          <PaymentMessage message={message} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">{t.providers}</h3>
        {sheet.providers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.none}</p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {sheet.providers.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span>
                  <span className="font-medium">{p.name}</span> · {p.role}
                  {p.arrivalTime !== null ? ` · ${p.arrivalTime}` : ""}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeProvider.mutate({ dealId, providerId: p.id })}
                >
                  {t.remove}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <ProviderForm dealId={dealId} onAdded={refresh} />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">
          {t.accommodations}
        </h3>
        {sheet.accommodations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.none}</p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {sheet.accommodations.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span>
                  <span className="font-medium">{a.name}</span>
                  {a.beds !== null ? ` · ${a.beds}` : ""}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeAccommodation.mutate({ dealId, accommodationId: a.id })}
                >
                  {t.remove}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <AccommodationForm dealId={dealId} onAdded={refresh} />
      </section>
    </div>
  );
}

function ProviderForm({
  dealId,
  onAdded,
}: {
  dealId: string;
  onAdded: () => void;
}): React.ReactNode {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [contact, setContact] = useState("");
  const [arrival, setArrival] = useState("");
  const add = trpc.dealDocuments.event.addProvider.useMutation({ onSuccess: onAdded });
  return (
    <form
      className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_9rem_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate(
          {
            dealId,
            name: name.trim(),
            role: role.trim(),
            contact: contact.trim() === "" ? null : contact.trim(),
            arrivalTime: arrival === "" ? null : arrival,
          },
          {
            onSuccess: () => {
              setName("");
              setRole("");
              setContact("");
              setArrival("");
            },
          },
        );
      }}
    >
      <Input
        aria-label={t.providerName}
        placeholder={t.providerName}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        aria-label={t.providerRole}
        placeholder={t.providerRole}
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <Input
        aria-label={t.providerContact}
        placeholder={t.providerContact}
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />
      <Input
        aria-label={t.providerArrival}
        type="time"
        value={arrival}
        onChange={(e) => setArrival(e.target.value)}
      />
      <Button
        type="submit"
        size="sm"
        disabled={add.isPending || name.trim() === "" || role.trim() === ""}
      >
        {t.addProvider}
      </Button>
    </form>
  );
}

function AccommodationForm({
  dealId,
  onAdded,
}: {
  dealId: string;
  onAdded: () => void;
}): React.ReactNode {
  const [name, setName] = useState("");
  const [beds, setBeds] = useState("");
  const [notes, setNotes] = useState("");
  const add = trpc.dealDocuments.event.addAccommodation.useMutation({ onSuccess: onAdded });
  return (
    <form
      className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate(
          {
            dealId,
            name: name.trim(),
            beds: beds === "" ? null : Number(beds),
            notes: notes.trim() === "" ? null : notes.trim(),
          },
          {
            onSuccess: () => {
              setName("");
              setBeds("");
              setNotes("");
            },
          },
        );
      }}
    >
      <Input
        aria-label={t.accommodationName}
        placeholder={t.accommodationName}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        aria-label={t.accommodationBeds}
        type="number"
        min={1}
        placeholder={t.accommodationBeds}
        value={beds}
        onChange={(e) => setBeds(e.target.value)}
      />
      <Input
        aria-label={t.accommodationNotes}
        placeholder={t.accommodationNotes}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={add.isPending || name.trim() === ""}>
        {t.addAccommodation}
      </Button>
    </form>
  );
}
