import { describe, expect, it } from "vitest";
import { extractDriveFileId } from "./fileId";

describe("Google Doc links pasted into the template form", () => {
  it("takes the file id out of a full Google Docs link", () => {
    expect(
      extractDriveFileId(
        "https://docs.google.com/document/d/1d_9Xq-tbSZuBwBmOia1QPSw4k5imYhHIBhr1eGf4ezCc/edit?usp=drivesdk",
      ),
    ).toBe("1d_9Xq-tbSZuBwBmOia1QPSw4k5imYhHIBhr1eGf4ezCc");
  });

  it("accepts a bare file id as well", () => {
    expect(extractDriveFileId("  1d_9Xq-tbSZuBwBmOia1QPSw4k5imYhHIBhr1eGf4ezCc  ")).toBe(
      "1d_9Xq-tbSZuBwBmOia1QPSw4k5imYhHIBhr1eGf4ezCc",
    );
  });

  it("refuses text that is neither a link nor an id", () => {
    expect(extractDriveFileId("https://example.com/pas-un-doc")).toBeNull();
    expect(extractDriveFileId("   ")).toBeNull();
    expect(extractDriveFileId("un texte avec des espaces")).toBeNull();
  });
});
