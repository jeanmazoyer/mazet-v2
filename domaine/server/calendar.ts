// Google Agenda, for the visits planned on a deal. The grant asked for is calendar.events: the app writes
// events in the connected account's main calendar. It only ever touches the events it created itself,
// since an event's identifier is derived from the deal and the visit it stands for.
import { createHash } from "node:crypto";
import type { Role } from "./auth.ts";

export const CAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";
// The estate's own time: a visit at 10:00 is at 10:00 there, whatever the clock of the server.
export const CAL_ZONE = "Europe/Paris";
export const VISIT_ID = /^v[a-z0-9]{3,24}$/;
export type CalSetting = { refresh: string; email: string };
export type Visit = { id: string; date: string; time: string; dur: number; note: string };

export function calAuthUrl(clientId: string, baseUrl: string, state: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: `${baseUrl}/auth/callback`, response_type: "code", scope: `openid email ${CAL_SCOPE}`,
    access_type: "offline", prompt: "consent", state }).toString();
  return url.toString();
}
/** What a page may know about the agenda: never the token, and its account only for administrators. */
export function calSeen(stored: unknown, role: Role): { on: boolean; email?: string } {
  const s = stored as Partial<CalSetting> | null;
  if (!s || typeof s.refresh !== "string" || !s.refresh) return { on: false };
  return role === "admin" ? { on: true, email: s.email ?? "" } : { on: true };
}

/** One visit of a deal, checked field by field. Null when it is not there or cannot be a real moment. */
export function visitOf(doc: Record<string, unknown>, visitId: string): Visit | null {
  const found = (Array.isArray(doc.visits) ? doc.visits : []).find((v) => v && typeof v === "object" && (v as { id?: unknown }).id === visitId) as Record<string, unknown> | undefined;
  if (!found || !VISIT_ID.test(visitId)) return null;
  const date = String(found.date ?? ""), time = String(found.time ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const dur = Math.min(480, Math.max(15, Math.round(Number(found.dur)) || 60));
  return { id: visitId, date, time, dur, note: typeof found.note === "string" ? found.note.slice(0, 500) : "" };
}

/** The identifier of a visit's event: the same for the same visit, so that it is updated, never doubled. */
export function eventId(dealId: string, visitId: string): string {
  return "dv" + createHash("sha256").update(`${dealId}:${visitId}`).digest("hex").slice(0, 40);
}

const pad = (n: number) => String(n).padStart(2, "0");
// Google shows a description as HTML: what comes from a note is kept as plain words.
const plain = (s: string) => s.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim();
/** The event Google is asked to hold for a visit. Times are local to the estate, the zone is named. */
export function eventBody(v: Visit, deal: { id: string; title?: unknown; contact?: { name?: unknown; phone?: unknown; email?: unknown } }, baseUrl: string) {
  const [y, m, d] = v.date.split("-").map(Number), [h, min] = v.time.split(":").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d, h, min + v.dur));
  const str = (x: unknown) => (typeof x === "string" ? plain(x) : "");
  const who = [str(deal.contact?.name), str(deal.contact?.phone), str(deal.contact?.email)].filter(Boolean).join(" · ");
  return {
    summary: `Visite : ${str(deal.title) || "affaire"}`.slice(0, 200),
    description: [who, plain(v.note), `${baseUrl}/#affaire-${deal.id}`].filter(Boolean).join("\n\n"),
    start: { dateTime: `${v.date}T${v.time}:00`, timeZone: CAL_ZONE },
    end: { dateTime: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}T${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}:00`, timeZone: CAL_ZONE },
    status: "confirmed",
  };
}

/* ---------- Calls to Google Agenda. Each one gives up after 15 seconds. ---------- */
export class CalError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
const API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const call = (token: string, url: string, method: string, body?: unknown) => fetch(url, { method, signal: AbortSignal.timeout(15_000),
  headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
const refused = (status: number) => new CalError([401, 403].includes(status) ? status : 502, `Google Agenda a refusé (${status})`);
/** Writes a visit's event: updated when it exists, created otherwise. */
export async function putEvent(token: string, id: string, body: ReturnType<typeof eventBody>): Promise<void> {
  const res = await call(token, `${API}/${encodeURIComponent(id)}`, "PUT", body);
  if (res.ok) return;
  if (res.status !== 404) throw refused(res.status);
  const made = await call(token, API, "POST", { id, ...body });
  if (!made.ok) throw refused(made.status);
}
/** Removes a visit's event. One that is already gone is not an error. */
export async function deleteEvent(token: string, id: string): Promise<void> {
  const res = await call(token, `${API}/${encodeURIComponent(id)}`, "DELETE");
  if (!res.ok && res.status !== 404 && res.status !== 410) throw refused(res.status);
}
