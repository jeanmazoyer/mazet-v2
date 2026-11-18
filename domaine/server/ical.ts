import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type Stay = { src: string; title: string; start: string; end: string };
export type Source = { id: string; kind: string; name: string; url: string; last?: string };

/** The stays of an iCal file. An all-day event's DTEND is the departure day, kept as such. */
export function parseIcal(text: string, source: Source): Stay[] {
  const out: Stay[] = [];
  const lines = text.replace(/\r\n[ \t]/g, "").split(/\r?\n/);
  let cur: Record<string, string> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") {
      const day = (v: string | undefined) => (v && /^\d{8}/.test(v) ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}` : "");
      const start = day(cur?.DTSTART), end = day(cur?.DTEND) || start;
      if (cur && start && end >= start) out.push({ src: source.id, title: `${source.kind}, ${source.name}${cur.SUMMARY ? " · " + cur.SUMMARY.slice(0, 60) : ""}`, start, end });
      cur = null;
    } else if (cur) {
      const at = line.indexOf(":");
      if (at > 0) cur[line.slice(0, at).split(";")[0]] = line.slice(at + 1).trim();
    }
  }
  return out;
}

const PRIVATE = [/^10\./, /^127\./, /^169\.254\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^0\./, /^::1$/, /^f[cd]/i, /^fe80:/i, /^::ffff:/i];
/** A calendar link is fetched by the server, so it must point to the public internet. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("le lien doit commencer par https://");
  if (isIP(url.hostname) || url.hostname === "localhost") throw new Error("adresse non autorisée");
  for (const a of await lookup(url.hostname, { all: true })) if (PRIVATE.some((re) => re.test(a.address))) throw new Error("adresse non autorisée");
  return url;
}

export async function fetchIcal(source: Source, signal: AbortSignal): Promise<Stay[]> {
  let url = await assertPublicUrl(source.url);
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, { redirect: "manual", signal, headers: { accept: "text/calendar, text/plain" } });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) { url = await assertPublicUrl(new URL(res.headers.get("location") ?? "", url).href); continue; }
    if (!res.ok) throw new Error(`le calendrier a répondu ${res.status}`);
    const text = await res.text();
    if (text.length > 2_000_000 || !text.includes("BEGIN:VCALENDAR")) throw new Error("ce lien ne renvoie pas un calendrier");
    return parseIcal(text, source);
  }
  throw new Error("trop de redirections");
}
