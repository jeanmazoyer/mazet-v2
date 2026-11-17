// Reads the events of an iCalendar feed (RFC 5545) as the days they block. Only what a booking
// needs is read: the event id, its first and last day. Dates are calendar days in UTC.
// Airbnb sends all-day events whose DTEND is the checkout day, which is not blocked.

export interface IcsEvent {
  uid: string;
  startDate: string;
  endDate: string;
}

export type IcsError = "not_a_calendar" | "event_without_uid";

interface RawEvent {
  [key: string]: string;
}

// Unfolds continuation lines (RFC 5545 §3.1): a line starting with a space or tab continues the
// previous one.
function unfold(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += raw.slice(1);
    } else if (raw.length > 0) {
      lines.push(raw);
    }
  }
  return lines;
}

// "DTSTART;VALUE=DATE:20270612" -> key "DTSTART", value "20270612". Parameters are dropped.
function splitProperty(line: string): [string, string] | null {
  const colon = line.indexOf(":");
  if (colon < 0) return null;
  const name = line.slice(0, colon).split(";")[0]?.toUpperCase() ?? "";
  return [name, line.slice(colon + 1)];
}

function isoFromIcsDate(value: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})(T\d{6}Z?)?$/.exec(value.trim());
  if (m === null) return null;
  const day = `${m[1]}-${m[2]}-${m[3]}`;
  return Number.isNaN(new Date(`${day}T00:00:00Z`).getTime()) ? null : day;
}

function dayBefore(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Collects the properties of each VEVENT block, in file order.
function collectEvents(lines: string[]): RawEvent[] {
  const events: RawEvent[] = [];
  let current: RawEvent | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
    } else if (line === "END:VEVENT") {
      if (current !== null) events.push(current);
      current = null;
    } else if (current !== null) {
      const prop = splitProperty(line);
      if (prop !== null) current[prop[0]] = prop[1];
    }
  }
  return events;
}

// One event as the days it blocks, or null when it blocks nothing (cancelled, no dates, or an
// empty range). A missing id is a broken feed, reported to the caller.
function readEvent(event: RawEvent): IcsEvent | null | "no_uid" {
  if ((event.STATUS ?? "").toUpperCase() === "CANCELLED") return null;
  const uid = (event.UID ?? "").trim();
  if (uid === "") return "no_uid";
  const start = isoFromIcsDate(event.DTSTART ?? "");
  const endExclusive = isoFromIcsDate(event.DTEND ?? "");
  if (start === null || endExclusive === null) return null;
  // DTEND is exclusive (the checkout day): the last blocked day is the day before it.
  const last = dayBefore(endExclusive);
  return last < start ? null : { uid, startDate: start, endDate: last };
}

export function parseIcs(
  text: string,
): { ok: true; value: IcsEvent[] } | { ok: false; error: IcsError } {
  const lines = unfold(text);
  if (!lines.includes("BEGIN:VCALENDAR")) return { ok: false, error: "not_a_calendar" };

  const out: IcsEvent[] = [];
  for (const raw of collectEvents(lines)) {
    const event = readEvent(raw);
    if (event === "no_uid") return { ok: false, error: "event_without_uid" };
    if (event !== null) out.push(event);
  }
  return { ok: true, value: out };
}
