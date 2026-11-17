import { describe, expect, it } from "vitest";
import { buildReplaceAllTextRequests, escapeDriveQueryValue } from "./requests";

describe("Google Docs replacement requests", () => {
  it("turns each field into a replaceAllText request, in the order given, matching the {{key}} exactly", () => {
    expect(buildReplaceAllTextRequests({ dealTitle: "Séjour Bravo", nights: "2" })).toEqual([
      {
        replaceAllText: {
          containsText: { text: "{{dealTitle}}", matchCase: true },
          replaceText: "Séjour Bravo",
        },
      },
      {
        replaceAllText: { containsText: { text: "{{nights}}", matchCase: true }, replaceText: "2" },
      },
    ]);
  });

  it("builds no request when there is nothing to fill", () => {
    expect(buildReplaceAllTextRequests({})).toEqual([]);
  });
});

describe("Drive search values", () => {
  it("escapes quotes and backslashes so a folder name cannot break the query", () => {
    expect(escapeDriveQueryValue("Séjour d'été")).toBe("Séjour d\\'été");
    expect(escapeDriveQueryValue("a\\b")).toBe("a\\\\b");
  });
});
