"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { STRINGS } from "@/constants/strings";
import { cancelReservationAction } from "@/features/reservations/reservationActions";
import { readCsrfToken } from "@/utils/csrfCookie";
import { bookingErrorText } from "./bookingErrors";

export function CancelBookingButton({ reservationId }: { reservationId: string }): React.ReactNode {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await cancelReservationAction({ reservationId }, readCsrfToken());
            if (!result.ok) setError(bookingErrorText(result.error.id));
          });
        }}
      >
        {STRINGS.bookings.cancelBooking}
      </Button>
      {error !== null ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
