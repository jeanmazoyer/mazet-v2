import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { cancelReservationAction } from "@/app/[locale]/(app)/calendrier/actions";
import { ReservationForm } from "@/components/calendar/reservation-form";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { monthGrid, monthKey, parseMonth, shiftMonth, toIso } from "@/lib/calendar";
import { getCurrentUser } from "@/lib/current-user";
import { formatRef } from "@/lib/dossiers";
import { can } from "@/lib/permissions";
import { listDossiers } from "@/lib/services/dossiers";
import { listReservations } from "@/lib/services/reservations";
import { cn } from "@/lib/utils";

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mois?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || !can(user.role, "calendar.read")) notFound();

  const { mois } = await searchParams;
  const { year, month } = parseMonth(mois);
  const grid = monthGrid(year, month);
  const gridFrom = grid[0][0].iso;
  const gridTo = grid.at(-1)!.at(-1)!.iso;
  const monthFrom = `${monthKey(year, month)}-01`;
  const monthTo = toIso(new Date(Date.UTC(year, month, 0)));
  const today = toIso(new Date());

  const reservations = await listReservations(user, { from: gridFrom, to: gridTo });
  const inMonth = reservations.filter((r) => r.startDate <= monthTo && r.endDate >= monthFrom);

  const canBook = can(user.role, "calendar.write");
  const canOpenDossier = can(user.role, "dossier.read");
  const dossierOptions = canBook
    ? (await listDossiers(user))
        .filter((d) => d.status !== "perdu")
        .map((d) => ({ id: d.id, label: `${formatRef(d.number)} · ${d.clientName}` }))
    : [];

  const t = await getTranslations("calendar");
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const dayFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const day = (iso: string) => dayFmt.format(new Date(`${iso}T00:00:00Z`));
  const title = monthFmt.format(new Date(Date.UTC(year, month - 1, 1)));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendrier?mois=${shiftMonth(year, month, -1)}`}
            aria-label={t("previous")}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronLeft />
          </Link>
          <p className="min-w-36 text-center text-sm font-medium capitalize" aria-live="polite">
            {title}
          </p>
          <Link
            href={`/calendrier?mois=${shiftMonth(year, month, 1)}`}
            aria-label={t("next")}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronRight />
          </Link>
          <Link href="/calendrier" className={buttonVariants({ variant: "outline" })}>
            {t("today")}
          </Link>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border bg-muted text-center text-xs font-medium text-muted-foreground">
          {grid[0].map((d) => (
            <div key={d.iso} className="py-2 capitalize">
              {weekdayFmt.format(new Date(`${d.iso}T00:00:00Z`))}
            </div>
          ))}
        </div>
        {grid.map((week) => (
          <div key={week[0].iso} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((d, index) => {
              const dayReservations = reservations.filter((r) => r.startDate <= d.iso && r.endDate >= d.iso);
              return (
                <div
                  key={d.iso}
                  className={cn(
                    "min-h-20 min-w-0 border-r border-border py-1.5 last:border-r-0 md:min-h-24",
                    !d.inMonth && "bg-muted",
                  )}
                >
                  <p className="px-1.5 text-right text-xs">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full",
                        d.iso === today && "bg-primary font-medium text-primary-foreground",
                        d.iso !== today && !d.inMonth && "text-muted-foreground",
                      )}
                    >
                      {d.day}
                    </span>
                  </p>
                  {dayReservations.map((r) => {
                    const isStart = r.startDate === d.iso;
                    const isEnd = r.endDate === d.iso;
                    const label = `${formatRef(r.dossierNumber)} ${r.clientName}`;
                    return (
                      <p
                        key={r.id}
                        title={`${label} · ${t(`kinds.${r.kind}`)} · ${day(r.startDate)} – ${day(r.endDate)}`}
                        className={cn(
                          "mt-1 h-5 truncate px-1.5 text-[11px] leading-5 font-medium",
                          r.kind === "ferme"
                            ? "bg-primary text-primary-foreground"
                            : "bg-status-amber/15 text-status-amber",
                          isStart && "ml-1 rounded-l-sm",
                          isEnd && "mr-1 rounded-r-sm",
                        )}
                      >
                        {isStart || index === 0 ? label : <span className="sr-only">{label}</span>}
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-5 rounded-sm bg-primary" />
          {t("kinds.ferme")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-5 rounded-sm bg-status-amber/15 ring-1 ring-status-amber/40" />
          {t("kinds.option")}
        </span>
      </p>

      <div className={cn("grid gap-6", canBook && "lg:grid-cols-3")}>
        <Card className={cn("p-6", canBook && "lg:col-span-2")}>
          <h2 className="text-sm font-medium">{t("monthList")}</h2>
          {inMonth.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("noReservations")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {inMonth.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {day(r.startDate)} – {day(r.endDate)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-muted-foreground">
                      <Badge tone={r.kind === "ferme" ? "strong" : "muted"}>{t(`kinds.${r.kind}`)}</Badge>
                      {canOpenDossier ? (
                        <Link href={`/dossiers/${r.dossierId}`} className="underline-offset-4 hover:underline">
                          {formatRef(r.dossierNumber)} · {r.clientName}
                        </Link>
                      ) : (
                        <span>
                          {formatRef(r.dossierNumber)} · {r.clientName}
                        </span>
                      )}
                      {r.kind === "option" && r.optionExpiresAt ? (
                        <span>{t("optionUntil", { date: dayFmt.format(r.optionExpiresAt) })}</span>
                      ) : null}
                    </p>
                  </div>
                  {canBook ? (
                    <form action={cancelReservationAction}>
                      <input type="hidden" name="reservationId" value={r.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-status-red">
                        {t("cancel")}
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {canBook ? (
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-medium">{t("newReservation")}</h2>
            <ReservationForm dossiers={dossierOptions} />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
