"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { STRINGS } from "@/constants/strings";
import { createReservationAction } from "@/features/reservations/reservationActions";
import { readCsrfToken } from "@/utils/csrfCookie";
import { bookingErrorText } from "./bookingErrors";

export interface BookableDeal {
  id: string;
  title: string;
}

// Opens over the calendar. The server decides every rule (dates, overlap, rights); this form only
// collects the values and shows the refusal in plain words.
export function NewBookingDialog({ deals }: { deals: BookableDeal[] }): React.ReactNode {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dealId, setDealId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [kind, setKind] = useState<"option" | "firm">("firm");
  const [optionExpiresOn, setOptionExpiresOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createReservationAction(
        {
          dealId,
          startDate,
          endDate,
          kind,
          optionExpiresOn: kind === "option" ? optionExpiresOn : null,
        },
        readCsrfToken(),
      );
      if (result.ok) {
        setOpen(false);
        router.refresh();
        return;
      }
      setError(bookingErrorText(result.error.id));
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={deals.length === 0}>
        {STRINGS.bookings.newBooking}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{STRINGS.bookings.dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1 text-sm">
              <span className="font-medium">{STRINGS.bookings.fieldDeal}</span>
              <Select
                ariaLabel={STRINGS.bookings.fieldDeal}
                value={dealId}
                onChange={setDealId}
                placeholder={STRINGS.bookings.chooseDeal}
                options={deals.map((d) => ({ value: d.id, label: d.title }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1 text-sm">
                <span className="font-medium">{STRINGS.bookings.fieldStart}</span>
                <Input
                  aria-label={STRINGS.bookings.fieldStart}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-1 text-sm">
                <span className="font-medium">{STRINGS.bookings.fieldEnd}</span>
                <Input
                  aria-label={STRINGS.bookings.fieldEnd}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1 text-sm">
                <span className="font-medium">{STRINGS.bookings.fieldKind}</span>
                <Select
                  ariaLabel={STRINGS.bookings.fieldKind}
                  value={kind}
                  onChange={(v) => setKind(v === "option" ? "option" : "firm")}
                  options={[
                    { value: "firm", label: STRINGS.bookings.kindFirm },
                    { value: "option", label: STRINGS.bookings.kindOption },
                  ]}
                />
              </div>
              {kind === "option" ? (
                <div className="grid gap-1 text-sm">
                  <span className="font-medium">{STRINGS.bookings.fieldExpires}</span>
                  <Input
                    aria-label={STRINGS.bookings.fieldExpires}
                    type="date"
                    value={optionExpiresOn}
                    onChange={(e) => setOptionExpiresOn(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {error !== null ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              {STRINGS.bookings.cancel}
            </Button>
            <Button
              onClick={submit}
              disabled={pending || dealId === "" || startDate === "" || endDate === ""}
            >
              {STRINGS.bookings.submit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
