import type { CalendarDay } from "@/features/reservations/monthGrid";
import type { ReservationRow } from "@/features/reservations/reservationRepo";
import { cn } from "@/lib/utils";

const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

// Plain month grid. Each booking is drawn on every day it covers, so a run of days reads as one
// band. Options use a dashed outline so they never look like firm bookings.
export function BookingsMonth({
  grid,
  reservations,
}: {
  grid: CalendarDay[][];
  reservations: ReservationRow[];
}): React.ReactNode {
  const weekdays = (grid[0] ?? []).map((d) => WEEKDAY.format(new Date(`${d.iso}T00:00:00Z`)));

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {weekdays.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>
      {grid.map((week) => (
        <div key={week[0]?.iso ?? "week"} className="grid grid-cols-7 border-b last:border-b-0">
          {week.map((day) => {
            const covering = reservations.filter(
              (r) => r.startDate <= day.iso && r.endDate >= day.iso,
            );
            return (
              <div
                key={day.iso}
                data-day={day.iso}
                className={cn(
                  "min-h-24 min-w-0 border-r p-1.5 last:border-r-0",
                  !day.inMonth && "bg-muted/30 text-muted-foreground",
                )}
              >
                <p className="text-right text-xs">{day.day}</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {covering.map((r) => (
                    <li
                      key={r.id}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
                        r.kind === "firm"
                          ? "bg-action text-action-foreground"
                          : "border border-dashed text-foreground",
                      )}
                    >
                      {r.dealTitle}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
