import { STRINGS } from "@/constants/strings";

// The user-facing sentence for a booking error id; anything unknown falls back to a generic line.
export function bookingErrorText(id: string): string {
  const messages: Record<string, string> = STRINGS.bookings.errors;
  return messages[id] ?? STRINGS.bookings.errors.generic;
}
