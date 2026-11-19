// Messages that leave later, and the trace of whether a sent message was opened or one of its links
// followed. Nothing here talks to Google: these are the rules, kept apart so they can be checked alone.
import { randomBytes } from "node:crypto";

export const TRACK_TOKEN = /^[A-Za-z0-9_-]{22}$/;
/** What identifies one tracked message in the addresses placed inside it. Unguessable, and it names nothing. */
export const newToken = (): string => randomBytes(16).toString("base64url");
/** The smallest image there is: one transparent point. Loading it is what tells a message was opened. */
export const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

/** When a message is asked to leave: a real moment, at least a minute away and within a year. Null otherwise. */
export function sendAtOf(value: unknown, now: number): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const at = Date.parse(value);
  return Number.isFinite(at) && at - now >= 60_000 && at - now <= 366 * 86_400_000 ? new Date(at) : null;
}

/** What a message to send is made of, as the page asks for it and as it is kept until its hour. */
export type Job = { dealId: string; subject: string; html: string; threadId: string; to: string[]; files: string[]; gdocs: string[]; pages: Array<{ title: string; html: string }>; track: boolean };
const list = (v: unknown, max: number): string[] => (Array.isArray(v) ? v.slice(0, max + 1).map(String) : []);
/** Reads a request into a job. Shapes only: who may receive it and which files belong to the deal are checked when it leaves. */
export function jobOf(body: Record<string, unknown> | null): Job {
  const pages = Array.isArray(body?.pages) ? body.pages.slice(0, 6).map((p) => ({ title: String((p as { title?: unknown })?.title ?? "").trim().slice(0, 120), html: String((p as { html?: unknown })?.html ?? "") })) : [];
  return { dealId: String(body?.dealId ?? ""), subject: String(body?.subject ?? "").trim().slice(0, 200), html: String(body?.html ?? ""), threadId: String(body?.threadId ?? ""),
    to: Array.isArray(body?.to) ? list(body.to, 6) : body?.to ? [String(body.to)] : [], files: list(body?.files, 10), gdocs: list(body?.gdocs, 5), pages, track: body?.track === true };
}
