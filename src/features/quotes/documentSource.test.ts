import { describe, expect, it } from "vitest";
import { eventPeriodText, quoteReference } from "./documentSource";

describe("quoteReference", () => {
  it("builds a stable reference from the deal and the version", () => {
    expect(quoteReference("af2e46ed-01f9-413b-94f0-7612707e9e8c", 3)).toBe("DV-3-AF2E46ED");
  });
});

describe("eventPeriodText", () => {
  it("says nothing when no booking holds dates yet", () => {
    expect(eventPeriodText(null, null, "fr")).toBeNull();
  });

  it("gives a single day when the event starts and ends the same day", () => {
    expect(eventPeriodText("2027-06-12", "2027-06-12", "fr")).toBe("12 juin 2027");
  });

  it("gives the range in each language", () => {
    expect(eventPeriodText("2027-06-12", "2027-06-14", "fr")).toBe(
      "du 12 juin 2027 au 14 juin 2027",
    );
    expect(eventPeriodText("2027-06-12", "2027-06-14", "en")).toBe(
      "from 12 Jun 2027 to 14 Jun 2027",
    );
  });
});
