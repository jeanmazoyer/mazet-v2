// Calculs de calendrier sur des dates « jour » (AAAA-MM-JJ), sans fuseau horaire.

const MONTH = /^(\d{4})-(\d{2})$/;

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseMonth(value: string | undefined, today = new Date()): { year: number; month: number } {
  const m = value ? MONTH.exec(value) : null;
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) return { year, month };
  }
  return { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 };
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftMonth(year: number, month: number, delta: number): string {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return monthKey(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

export type CalendarDay = { iso: string; day: number; inMonth: boolean };

// Semaines complètes (lundi à dimanche) couvrant le mois.
export function monthGrid(year: number, month: number): CalendarDay[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // 0 = lundi
  const weeks = Math.ceil((offset + daysInMonth) / 7);

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(Date.UTC(year, month - 1, 1 - offset + w * 7 + d));
      return { iso: toIso(date), day: date.getUTCDate(), inMonth: date.getUTCMonth() === month - 1 };
    }),
  );
}
