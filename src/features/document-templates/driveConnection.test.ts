import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import { notConnectedDrive } from "./driveConnection";

// Until a Google account is connected, every Drive call fails with one clear reason, so nothing is
// half-created on the deal (no Drive file, no database row).
describe("Drive connection: before Google is connected", () => {
  it("every Drive call says the drive is not connected", async () => {
    const signal = AbortSignal.timeout(5000);
    const read = await notConnectedDrive.readText("any", signal);
    const make = await notConnectedDrive.createBlank({ name: "x", folderPath: [] }, signal);
    expect(read.ok).toBe(false);
    expect(make.ok).toBe(false);
    if (!read.ok) expect(read.error.id).toBe(ERROR_IDS.DRIVE_NOT_CONNECTED);
    if (!make.ok) expect(make.error.id).toBe(ERROR_IDS.DRIVE_NOT_CONNECTED);
  });
});
