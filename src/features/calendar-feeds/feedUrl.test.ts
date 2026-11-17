import { describe, expect, it } from "vitest";
import { isAllowedFeedUrl } from "./feedUrl";

// Only the calendars the estate actually uses are fetched: a feed URL is an outgoing request, so
// anything else (plain http, another host, a local address) is refused before any request.
describe("isAllowedFeedUrl", () => {
  it("accepts an Airbnb calendar over https", () => {
    expect(isAllowedFeedUrl("https://www.airbnb.com/calendar/ical/123456.ics?s=abc")).toBe(true);
    expect(isAllowedFeedUrl("https://www.airbnb.fr/calendar/ical/123.ics")).toBe(true);
  });

  it("refuses plain http, other hosts and lookalike domains", () => {
    expect(isAllowedFeedUrl("http://www.airbnb.com/calendar/ical/1.ics")).toBe(false);
    expect(isAllowedFeedUrl("https://example.com/calendar.ics")).toBe(false);
    expect(isAllowedFeedUrl("https://airbnb.com.evil.example/calendar.ics")).toBe(false);
    expect(isAllowedFeedUrl("https://evilairbnb.com/calendar.ics")).toBe(false);
  });

  it("refuses local and private addresses and garbage", () => {
    expect(isAllowedFeedUrl("https://localhost/calendar.ics")).toBe(false);
    expect(isAllowedFeedUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedFeedUrl("not a url")).toBe(false);
  });
});
