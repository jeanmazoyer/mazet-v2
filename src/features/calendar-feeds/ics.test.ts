import { describe, expect, it } from "vitest";
import { parseIcs } from "./ics";

// Airbnb-style calendar: all-day events, DTEND is the checkout day (exclusive).
const ICS = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "UID:abc-123@airbnb.com",
  "DTSTART;VALUE=DATE:20270612",
  "DTEND;VALUE=DATE:20270615",
  "SUMMARY:Reserved",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:cancelled-1@airbnb.com",
  "DTSTART;VALUE=DATE:20270701",
  "DTEND;VALUE=DATE:20270702",
  "STATUS:CANCELLED",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

describe("parseIcs", () => {
  it("reads an all-day event as the nights it blocks, end date inclusive", () => {
    const r = parseIcs(ICS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Checkout on the 15th: the last blocked day is the 14th.
    expect(r.value).toEqual([
      { uid: "abc-123@airbnb.com", startDate: "2027-06-12", endDate: "2027-06-14" },
    ]);
  });

  it("ignores cancelled events", () => {
    const r = parseIcs(ICS);
    expect(r.ok && r.value.map((e) => e.uid)).not.toContain("cancelled-1@airbnb.com");
  });

  it("joins folded lines (continuation lines start with a space)", () => {
    const folded = ICS.replace("SUMMARY:Reserved", "SUMMARY:Rese\r\n rved");
    expect(parseIcs(folded).ok).toBe(true);
  });

  it("reads a date-time event by its calendar day", () => {
    const text =
      "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:x\r\nDTSTART:20270612T140000Z\r\nDTEND:20270614T100000Z\r\nEND:VEVENT\r\nEND:VCALENDAR";
    const r = parseIcs(text);
    expect(r.ok && r.value[0]).toEqual({
      uid: "x",
      startDate: "2027-06-12",
      endDate: "2027-06-13",
    });
  });

  it("refuses a file that is not a calendar, or an event without an id", () => {
    expect(parseIcs("<html>not a calendar</html>")).toEqual({ ok: false, error: "not_a_calendar" });
    expect(
      parseIcs(
        "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20270612\r\nDTEND;VALUE=DATE:20270613\r\nEND:VEVENT\r\nEND:VCALENDAR",
      ),
    ).toEqual({ ok: false, error: "event_without_uid" });
  });

  it("skips an event whose end is not after its start", () => {
    const text =
      "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:bad\r\nDTSTART;VALUE=DATE:20270612\r\nDTEND;VALUE=DATE:20270612\r\nEND:VEVENT\r\nEND:VCALENDAR";
    expect(parseIcs(text)).toEqual({ ok: true, value: [] });
  });
});
