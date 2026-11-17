import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { cancelReservationAction } from "@/app/[locale]/(app)/calendrier/actions";
import { updateDossierAction } from "@/app/[locale]/(app)/dossiers/actions";
import { ReservationForm } from "@/components/calendar/reservation-form";
import { DossierForm } from "@/components/dossiers/dossier-form";
import { NoteForm } from "@/components/dossiers/note-form";
import { StatusSelect } from "@/components/dossiers/status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { formatRef } from "@/lib/dossiers";
import { NotFoundError } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { getDossier } from "@/lib/services/dossiers";
import { listDossierReservations } from "@/lib/services/reservations";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DossierPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || !can(user.role, "dossier.read") || !UUID.test(id)) notFound();

  let data: Awaited<ReturnType<typeof getDossier>>;
  try {
    data = await getDossier(user, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const { dossier, client, notes } = data;

  const canWrite = can(user.role, "dossier.write");
  const canBook = can(user.role, "calendar.write");
  const reservations = can(user.role, "calendar.read") ? await listDossierReservations(user, id) : [];

  const t = await getTranslations("dossiers");
  const tcal = await getTranslations("calendar");
  const tc = await getTranslations("common");
  const dayFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const stampFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const day = (iso: string) => dayFmt.format(new Date(`${iso}T00:00:00Z`));

  return (
    <div className="space-y-6">
      <Link href="/dossiers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </Link>

      <header>
        <p className="font-mono text-sm text-muted-foreground">{formatRef(dossier.number)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{client.name}</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <DossierForm
            action={updateDossierAction}
            submitLabel={tc("save")}
            disabled={!canWrite}
            values={{
              dossierId: dossier.id,
              clientName: client.name,
              clientEmail: client.email,
              clientPhone: client.phone,
              clientLanguage: client.language,
              clientCountry: client.country,
              type: dossier.type,
              targetDate: dossier.targetDate,
              guests: dossier.guests,
              source: dossier.source,
            }}
          />
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <StatusSelect dossierId={dossier.id} status={dossier.status} canWrite={canWrite} />
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-medium">{t("detail.reservations")}</h2>
            {reservations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.noReservations")}</p>
            ) : (
              <ul className="space-y-3">
                {reservations.map((r) => (
                  <li key={r.id} className="space-y-1 text-sm">
                    <p className={r.state === "active" ? "font-medium" : "text-muted-foreground line-through"}>
                      {day(r.startDate)} – {day(r.endDate)}
                    </p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge tone={r.kind === "ferme" && r.state === "active" ? "strong" : "muted"}>
                        {tcal(`kinds.${r.kind}`)}
                      </Badge>
                      {r.state !== "active" ? t(`detail.states.${r.state}`) : null}
                      {r.state === "active" && r.kind === "option" && r.optionExpiresAt
                        ? tcal("optionUntil", { date: dayFmt.format(r.optionExpiresAt) })
                        : null}
                    </p>
                    {canBook && r.state === "active" ? (
                      <form action={cancelReservationAction}>
                        <input type="hidden" name="reservationId" value={r.id} />
                        <Button type="submit" variant="ghost" size="sm" className="-ml-3 text-status-red">
                          {tcal("cancel")}
                        </Button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {canBook ? (
              <details className="border-t border-border pt-4">
                <summary className="cursor-pointer text-sm font-medium">{tcal("newReservation")}</summary>
                <div className="mt-4">
                  <ReservationForm dossierId={dossier.id} idPrefix="dossier-resa" />
                </div>
              </details>
            ) : null}
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-medium">{t("detail.notes")}</h2>
            {canWrite ? <NoteForm dossierId={dossier.id} /> : null}
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.noNotes")}</p>
            ) : (
              <ul className="space-y-4">
                {notes.map((n) => (
                  <li key={n.id} className="border-t border-border pt-3 text-sm">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.authorName} · {stampFmt.format(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
