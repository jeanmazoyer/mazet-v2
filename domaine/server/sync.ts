// What the hourly synchronisation decides, kept apart from the calls to Google so it can be checked alone.
// Three subjects: the files of a deal's Drive folder, the mail exchanged with its contact, and its visits
// as the agenda now holds them. Nothing here deletes anything: what has gone on Google's side is marked.

export type DriveItem = { id: string; name: string; mime: string; modified: string; path: string[]; link: string; size: number };
export type DocLine = { t: string; k?: string; d?: string; st?: string; slot?: string; url?: string; did?: string; gid?: string; fileId?: string; src?: string; size?: number; gone?: boolean; [key: string]: unknown };

/** The identifier of a Drive file or folder, from one of Google's own addresses. Empty for anything else. */
export function driveIdOf(url: unknown): string {
  if (typeof url !== "string" || !/^https:\/\/(drive|docs)\.google\.com\//.test(url)) return "";
  return (/\/(?:folders|d)\/([\w-]{10,80})/.exec(url) ?? [])[1] ?? "";
}

const plain = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const SLOT_WORDS: Array<[string, RegExp]> = [["solde", /solde|balance/], ["acompte", /acompte/], ["devis", /devis|quote/], ["contrat", /contrat|contract|agreement/],
  ["caution", /caution|swikly/], ["assurance", /assurance|attestation|insurance/]];
/** Which expected document a file is, from its own name first, then from the folder it was put in. */
export function slotFor(path: string[], name: string): string | undefined {
  const own = plain(name), where = plain(path.join(" "));
  return (SLOT_WORDS.find(([, re]) => re.test(own)) ?? SLOT_WORDS.find(([, re]) => re.test(where)))?.[0];
}
/** The kind of a file, as the app shows it. */
export function docKind(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "img";
  if (mime === "application/vnd.google-apps.document" || mime.includes("wordprocessingml") || mime === "application/msword") return "gdoc";
  if (mime === "application/vnd.google-apps.spreadsheet" || mime.includes("spreadsheetml") || mime === "text/csv") return "xls";
  return "file";
}

/**
 * The documents of a deal once its Drive folder has been read. A file not known yet is added; one renamed
 * in Drive takes its new name; one the synchronisation had added and that is no longer there is marked as
 * gone. A copy the app itself pushed to Drive is recognised and not added a second time.
 */
export function planDocs(docs: DocLine[], files: DriveItem[]): { docs: DocLine[]; added: number; renamed: number; missing: number; changed: boolean } {
  const out = docs.map((x) => ({ ...x })), byId = new Map(files.map((f) => [f.id, f]));
  const idOf = (x: DocLine) => (typeof x.did === "string" && x.did) || driveIdOf(x.url), copies = new Set(out.map((x) => x.gid).filter(Boolean));
  let added = 0, renamed = 0, missing = 0, changed = false;
  const seen = new Set<string>();
  for (const x of out) {
    const id = idOf(x); if (!id) continue;
    const f = byId.get(id);
    if (f) { seen.add(id);
      if (x.gone) { delete x.gone; changed = true; }
      // A document written by the app keeps the name the app gave it; one that came from Drive follows Drive.
      if (!x.did && f.name && f.name !== x.t) { x.t = f.name; renamed++; changed = true; }
    } else if (x.src === "drive") { missing++; if (!x.gone) { x.gone = true; changed = true; } }
  }
  const taken = new Set(out.map((x) => x.slot).filter(Boolean));
  for (const f of files) {
    if (seen.has(f.id) || copies.has(f.id)) continue;
    const want = slotFor(f.path, f.name), slot = want && !taken.has(want) ? want : undefined;
    if (slot) taken.add(slot);
    out.push({ t: f.name, k: docKind(f.mime), d: (f.modified || "").slice(0, 10), st: "Reçu", url: f.link, src: "drive", size: f.size, ...(slot ? { slot } : {}) });
    added++; changed = true;
  }
  return { docs: out, added, renamed, missing, changed };
}

type ThreadLine = { id: string; subject: string; messages: Array<{ at: string; mine: boolean }> };
/** What a deal keeps of its mail between two openings: how much was exchanged, when, and whether the client spoke last. */
export function mailSummary(threads: ThreadLine[]) {
  const day = (iso: string) => iso.slice(0, 10), all = threads.flatMap((t) => t.messages), dates = all.map((m) => m.at).sort();
  const list = threads.filter((t) => t.messages.length).map((t) => { const at = t.messages.map((m) => m.at).sort(); return { id: t.id, subject: t.subject, n: t.messages.length, first: day(at[0]), last: day(at[at.length - 1]), end: at[at.length - 1], mine: [...t.messages].sort((a, b) => (a.at < b.at ? -1 : 1))[t.messages.length - 1].mine }; })
    .sort((a, b) => (a.end < b.end ? 1 : -1));
  return { threads: list.length, messages: all.length, received: all.filter((m) => !m.mine).length, sent: all.filter((m) => m.mine).length, first: dates.length ? day(dates[0]) : "", last: dates.length ? day(dates[dates.length - 1]) : "",
    waiting: list.length > 0 && !list[0].mine, list: list.slice(0, 12).map(({ id, subject, n, first, last }) => ({ id, subject, n, first, last })) };
}

type EventLine = { status?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } } | null;
/**
 * What the agenda says of a visit, read in the estate's own time zone. Null when nothing differs;
 * `gone` when the event was removed or cancelled there; otherwise the day, hour and length to take back.
 */
export function visitFromEvent(v: { date: string; time: string; dur: number }, ev: EventLine): { gone: true } | { date: string; time: string; dur: number } | null {
  if (!ev || ev.status === "cancelled") return { gone: true };
  const from = ev.start?.dateTime ?? "", to = ev.end?.dateTime ?? "";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(from) || !to) return null;
  const date = from.slice(0, 10), time = from.slice(11, 16), dur = Math.max(15, Math.round((Date.parse(to) - Date.parse(from)) / 60000));
  return date === v.date && time === v.time && dur === v.dur ? null : { date, time, dur };
}
