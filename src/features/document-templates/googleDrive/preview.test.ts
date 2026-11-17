import { describe, expect, it } from "vitest";
import { googleDocEditUrl, googleDocPreviewUrl } from "./preview";

describe("Google Doc links for a document in the app", () => {
  it("builds the read-only preview address that the app shows inside its page", () => {
    expect(googleDocPreviewUrl("1d_9Xq-tbSZuBwBmOia1QPSw4k5imYhHIBhr1eGf4ezCc")).toBe(
      "https://docs.google.com/document/d/1d_9Xq-tbSZuBwBmOia1QPSw4k5imYhHIBhr1eGf4ezCc/preview",
    );
  });

  it("builds the edit address that opens the document in Google Docs itself", () => {
    expect(googleDocEditUrl("1d_9Xq-tbSZuBwBmOia1QPSw4k5imYhHIBhr1eGf4ezCc")).toBe(
      "https://docs.google.com/document/d/1d_9Xq-tbSZuBwBmOia1QPSw4k5imYhHIBhr1eGf4ezCc/edit",
    );
  });

  it("never lets an id carry a path or a query into the address", () => {
    expect(googleDocPreviewUrl("abc/../evil?x=1")).toBe(
      "https://docs.google.com/document/d/abc%2F..%2Fevil%3Fx%3D1/preview",
    );
  });
});
