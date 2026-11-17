import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { STRINGS } from "@/constants/strings";
import {
  monthGrid,
  monthKey,
  parseMonth,
  shiftMonth,
  toIso,
} from "@/features/reservations/monthGrid";
import { listBookableDeals, listReservations } from "@/features/reservations/reservationRepo";
import { BookingsMonth } from "@/features/reservations/ui/BookingsMonth";
import { CancelBookingButton } from "@/features/reservations/ui/CancelBookingButton";
import { NewBookingDialog } from "@/features/reservations/ui/NewBookingDialog";
import { createContext } from "@/server/trpc/context";

export const metadata = { title: STRINGS.titles.bookings };

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const DAY_LABEL = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactNode> {
  const ctx = await createContext();
  if (ctx.actor === null) redirect("/login");

  const sp = await searchParams;
  const { year, month } = parseMonth(typeof sp.m === "string" ? sp.m : undefined);
  const grid = monthGrid(year, month);
  const gridFrom = grid[0]?.[0]?.iso ?? toIso(new Date(Date.UTC(year, month - 1, 1)));
  const gridTo = grid.at(-1)?.at(-1)?.iso ?? gridFrom;

  const signal = AbortSignal.timeout(10_000);
  const [reservations, deals] = await Promise.all([
    listReservations(ctx.db, ctx.actor, { from: gridFrom, to: gridTo }, signal),
    listBookableDeals(ctx.db, ctx.actor, signal),
  ]);

  const monthStart = `${monthKey(year, month)}-01`;
  const monthEnd = toIso(new Date(Date.UTC(year, month, 0)));
  const inMonth = reservations.filter((r) => r.startDate <= monthEnd && r.endDate >= monthStart);
  const title = MONTH_LABEL.format(new Date(Date.UTC(year, month - 1, 1)));

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-display font-[450] leading-tight tracking-tight">
            <CalendarClock className="size-5" aria-hidden="true" />
            {STRINGS.titles.bookings}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{STRINGS.bookings.subtitle}</p>
        </div>
        <NewBookingDialog deals={deals} />
      </header>

      <nav aria-label={title} className="flex flex-wrap items-center gap-2">
        <Link
          href={`/calendar?m=${shiftMonth(year, month, -1)}`}
          aria-label={STRINGS.bookings.previousMonth}
          className="rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-accent"
        >
          ‹
        </Link>
        <p className="min-w-40 text-center text-sm font-medium" aria-live="polite">
          {title}
        </p>
        <Link
          href={`/calendar?m=${shiftMonth(year, month, 1)}`}
          aria-label={STRINGS.bookings.nextMonth}
          className="rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-accent"
        >
          ›
        </Link>
        <Link
          href="/calendar"
          className="rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-accent"
        >
          {STRINGS.bookings.today}
        </Link>
      </nav>

      <BookingsMonth grid={grid} reservations={reservations} />

      <section aria-labelledby="bookings-month" className="rounded-lg border bg-card p-4">
        <h2 id="bookings-month" className="text-sm font-semibold">
          {STRINGS.bookings.monthList}
        </h2>
        {inMonth.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{STRINGS.bookings.noBookings}</p>
        ) : (
          <ul className="mt-3 divide-y">
            {inMonth.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{r.dealTitle}</p>
                  <p className="text-muted-foreground">
                    {DAY_LABEL.format(new Date(`${r.startDate}T00:00:00Z`))} –{" "}
                    {DAY_LABEL.format(new Date(`${r.endDate}T00:00:00Z`))}
                    {" · "}
                    {r.kind === "firm" ? STRINGS.bookings.kindFirm : STRINGS.bookings.kindOption}
                    {r.kind === "option" && r.optionExpiresAt !== null
                      ? ` · ${STRINGS.bookings.optionUntil(DAY_LABEL.format(r.optionExpiresAt))}`
                      : ""}
                  </p>
                </div>
                <CancelBookingButton reservationId={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
