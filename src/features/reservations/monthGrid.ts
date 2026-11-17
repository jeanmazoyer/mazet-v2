// Calendar-month arithmetic on plain YYYY-MM-DD days. Everything is UTC so that no local time
// zone can move a booking onto the neighbouring day.

export interface CalendarDay {
  iso: string;
  day: number;
  inMonth: boolean;
}

const MONTH_PARAM = /^(\d{4})-(\d{2})$/;

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftMonth(year: number, month: number, delta: number): string {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return monthKey(date.getUTCFullYear(), date.getUTCMonth() + 1);
}

// Reads the `m` search parameter ("2027-06"). Anything unusable falls back to the current month.
export function parseMonth(
  value: string | undefined,
  today: Date = new Date(),
): { year: number; month: number } {
  const match = value !== undefined ? MONTH_PARAM.exec(value) : null;
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) return { year, month };
  }
  return { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 };
}

// Whole weeks, Monday first, covering every day of the month.
export function monthGrid(year: number, month: number): CalendarDay[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // 0 = Monday
  const weeks = Math.ceil((offset + daysInMonth) / 7);

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(Date.UTC(year, month - 1, 1 - offset + w * 7 + d));
      return {
        iso: toIso(date),
        day: date.getUTCDate(),
        inMonth: date.getUTCMonth() === month - 1,
      };
    }),
  );
}
