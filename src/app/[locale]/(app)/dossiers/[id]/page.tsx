import { ArrowLeft, CalendarDays, Flag, Globe, Languages, Mail, Megaphone, Phone, Tag, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { cancelReservationAction } from "@/app/[locale]/(app)/calendrier/actions";
import { updateDossierAction } from "@/app/[locale]/(app)/dossiers/actions";
import { ReservationForm } from "@/components/calendar/reservation-form";
import { DossierForm } from "@/components/dossiers/dossier-form";
import { NoteForm } from "@/components/dossiers/note-form";
import { StageBar } from "@/components/dossiers/stage-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { DOSSIER_STATUSES, RESERVATION_KINDS, formatRef, isOneOf } from "@/lib/dossiers";
import { NotFoundError } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { getDossier, getDossierHistory } from "@/lib/services/dossiers";
import { listDossierReservations } from "@/lib/services/reservations";
import { isIsoDate } from "@/lib/validation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KNOWN_ACTIONS = [
  "dossier.created",
  "dossier.updated",
  "dossier.status_changed",
  "reservation.created",
  "reservation.cancelled",
  "reservation.option_expired",
];

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
  const [history, reservations] = await Promise.all([
    getDossierHistory(user, id),
    can(user.role, "calendar.read") ? listDossierReservations(user, id) : Promise.resolve([]),
  ]);

  const t = await getTranslations("dossiers");
  const tcal = await getTranslations("calendar");
  const tc = await getTranslations("common");
  const dayFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const stampFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const day = (iso: string) => dayFmt.format(new Date(`${iso}T00:00:00Z`));

  // Libellé lisible d'une entrée de journal. Les valeurs inconnues ne sont jamais affichées brutes.
  function describe(action: string, detail: Record<string, unknown> | null): string {
    if (!KNOWN_ACTIONS.includes(action)) return t("historyActions.other");
    const key = action.replace(".", "_");
    if (action === "dossier.status_changed") {
      const from = detail?.from;
      const to = detail?.to;
      if (!isOneOf(DOSSIER_STATUSES, from) || !isOneOf(DOSSIER_STATUSES, to)) return t("historyActions.other");
      return t(`historyActions.${key}`, { from: t(`statuses.${from}`), to: t(`statuses.${to}`) });
    }
    if (action === "reservation.created") {
      const { kind, startDate, endDate } = detail ?? {};
      if (!isOneOf(RESERVATION_KINDS, kind) || !isIsoDate(startDate) || !isIsoDate(endDate)) {
        return t("historyActions.other");
      }
      return t(`historyActions.${key}`, { kind: tcal(`kinds.${kind}`), start: day(startDate), end: day(endDate) });
    }
    return t(`historyActions.${key}`);
  }

  // Fil unique : notes et événements du journal, du plus récent au plus ancien.
  const feed = [
    ...notes.map((n) => ({ id: `n-${n.id}`, at: n.createdAt, author: n.authorName, note: n.body as string | null, label: "" })),
    ...history
      .filter((h) => h.action !== "dossier.note_added")
      .map((h) => ({ id: `j-${h.id}`, at: h.at, author: h.actorName, note: null, label: describe(h.action, h.detail) })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="space-y-4">
      <Link href="/dossiers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </Link>

      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
        <p className="font-mono text-sm text-muted-foreground">{formatRef(dossier.number)}</p>
      </header>

      <StageBar dossierId={dossier.id} status={dossier.status} canWrite={canWrite} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">{t("summary")}</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Row icon={<Tag className="size-4" />} label={t("form.type")}>
                {t(`types.${dossier.type}`)}
              </Row>
              <Row icon={<Users className="size-4" />} label={t("form.guests")}>
                {dossier.guests !== null ? t("guests", { count: dossier.guests }) : "—"}
              </Row>
              <Row icon={<Flag className="size-4" />} label={t("form.targetDate")}>
                {dossier.targetDate ? day(dossier.targetDate) : t("noDate")}
              </Row>
              <Row icon={<Megaphone className="size-4" />} label={t("form.source")}>
                {dossier.source ?? "—"}
              </Row>
            </dl>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold">{t("person")}</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Row icon={<Mail className="size-4" />} label={t("form.clientEmail")}>
                {client.email ? (
                  <a href={`mailto:${client.email}`} className="break-all text-status-blue underline-offset-4 hover:underline">
                    {client.email}
                  </a>
                ) : (
                  "—"
                )}
              </Row>
              <Row icon={<Phone className="size-4" />} label={t("form.clientPhone")}>
                {client.phone ? (
                  <a href={`tel:${client.phone}`} className="text-status-blue underline-offset-4 hover:underline">
                    {client.phone}
                  </a>
                ) : (
                  "—"
                )}
              </Row>
              <Row icon={<Languages className="size-4" />} label={t("form.clientLanguage")}>
                {t(`languages.${client.language}`)}
              </Row>
              <Row icon={<Globe className="size-4" />} label={t("form.clientCountry")}>
                {client.country ?? "—"}
              </Row>
            </dl>
            {canWrite ? (
              <details className="mt-4 border-t border-border pt-3">
                <summary className="cursor-pointer text-sm font-medium text-status-blue">{t("edit")}</summary>
                <div className="mt-4">
                  <DossierForm
                    action={updateDossierAction}
                    submitLabel={tc("save")}
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
                </div>
              </details>
            ) : null}
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4 text-muted-foreground" />
              {t("detail.reservations")}
            </h2>
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
              <details className="border-t border-border pt-3">
                <summary className="cursor-pointer text-sm font-medium text-status-blue">{tcal("newReservation")}</summary>
                <div className="mt-4">
                  <ReservationForm dossierId={dossier.id} idPrefix="dossier-resa" />
                </div>
              </details>
            ) : null}
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          {canWrite ? (
            <Card className="overflow-hidden">
              <p className="border-b border-border px-4 py-2.5 text-sm font-medium">
                <span className="border-b-2 border-primary pb-2.5">{t("noteTab")}</span>
              </p>
              <div className="p-4">
                <NoteForm dossierId={dossier.id} />
              </div>
            </Card>
          ) : null}

          <section aria-labelledby="history-title" className="space-y-3">
            <h2 id="history-title" className="text-sm font-semibold">
              {t("history")}
            </h2>
            {feed.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noHistory")}</p>
            ) : (
              <ol className="relative space-y-2 border-l border-border pl-5">
                {feed.map((item) => (
                  <li key={item.id} className="relative">
                    <span
                      aria-hidden="true"
                      className={
                        item.note !== null
                          ? "absolute top-4 -left-[25.5px] size-2.5 rounded-full bg-status-amber"
                          : "absolute top-3.5 -left-[25.5px] size-2.5 rounded-full border border-border bg-card"
                      }
                    />
                    {item.note !== null ? (
                      <div className="rounded-lg border border-status-amber/30 bg-status-amber/10 px-4 py-3 text-sm">
                        <p className="break-words whitespace-pre-wrap">{item.note}</p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {stampFmt.format(item.at)} · {item.author}
                        </p>
                      </div>
                    ) : (
                      <div className="px-1 py-2 text-sm">
                        <p>{item.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {stampFmt.format(item.at)} · {item.author}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="mt-0.5 shrink-0 text-muted-foreground" title={label}>
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
