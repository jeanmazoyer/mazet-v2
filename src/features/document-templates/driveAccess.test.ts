import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import { DRIVE_API_URL, GOOGLE_TOKEN_URL, GOOGLE_USERINFO_URL } from "@/constants/googleDrive";
import { withTestDb } from "@/db/testing";
import { seedUser } from "@/db/testing/factories";
import { completeDriveConnection, driveForUser } from "./driveAccess";
import { scriptedFetch } from "./testing/scriptedFetch";

const SIGNAL = (): AbortSignal => AbortSignal.timeout(10_000);
const CONFIG = {
  clientId: "client-1",
  clientSecret: "secret-1",
  redirectUri: "http://localhost:3200/api/drive/oauth/callback",
};

describe("Drive access for a user (base réelle, Google simulé)", () => {
  it("connects an account, then reads a template through that account's own token", async () => {
    await withTestDb(async (db) => {
      const user = await seedUser(db, { name: "Jean", email: "jean@example.com" });
      const google = scriptedFetch([
        {
          match: (u) => u === GOOGLE_TOKEN_URL,
          json: { access_token: "at-1", refresh_token: "rt-1", expires_in: 3599 },
        },
        { match: (u) => u === GOOGLE_USERINFO_URL, json: { email: "jeanmazoyer@gmail.com" } },
      ]);
      const connected = await completeDriveConnection({
        ...CONFIG,
        db,
        userId: user.id,
        code: "code-1",
        fetchFn: google.fetchFn,
        signal: SIGNAL(),
      });
      expect(connected).toEqual({ ok: true, value: { accountEmail: "jeanmazoyer@gmail.com" } });

      const reader = scriptedFetch([
        {
          match: (u) => u === GOOGLE_TOKEN_URL,
          json: { access_token: "at-fresh", expires_in: 3599 },
        },
        {
          match: (u) => u.startsWith(`${DRIVE_API_URL}/files/tpl-1/export`),
          text: "Affaire : {{dealTitle}}",
        },
      ]);
      const drive = await driveForUser(
        db,
        user.id,
        { ...CONFIG, fetchFn: reader.fetchFn },
        SIGNAL(),
      );
      expect(drive.ok).toBe(true);
      if (!drive.ok) return;
      const text = await drive.value.readText("tpl-1", SIGNAL());
      expect(text).toEqual({ ok: true, value: "Affaire : {{dealTitle}}" });
      expect(reader.calls.find((c) => c.url.includes("/export"))?.auth).toBe("Bearer at-fresh");
    });
  });

  it("gives back the 'not connected' answer for a user who has not connected Drive", async () => {
    await withTestDb(async (db) => {
      const user = await seedUser(db, { name: "Autre", email: "autre@example.com" });
      const drive = await driveForUser(
        db,
        user.id,
        { ...CONFIG, fetchFn: scriptedFetch([]).fetchFn },
        SIGNAL(),
      );
      expect(drive.ok).toBe(true);
      if (!drive.ok) return;
      const read = await drive.value.readText("tpl-1", SIGNAL());
      expect(read.ok).toBe(false);
      if (!read.ok) expect(read.error.id).toBe(ERROR_IDS.DRIVE_NOT_CONNECTED);
    });
  });

  it("stores nothing when Google does not return a refresh token", async () => {
    await withTestDb(async (db) => {
      const user = await seedUser(db, { name: "Jean", email: "jean@example.com" });
      const google = scriptedFetch([
        { match: (u) => u === GOOGLE_TOKEN_URL, json: { access_token: "at-1", expires_in: 3599 } },
      ]);
      const r = await completeDriveConnection({
        ...CONFIG,
        db,
        userId: user.id,
        code: "code-1",
        fetchFn: google.fetchFn,
        signal: SIGNAL(),
      });
      expect(r.ok).toBe(false);
      const drive = await driveForUser(
        db,
        user.id,
        { ...CONFIG, fetchFn: scriptedFetch([]).fetchFn },
        SIGNAL(),
      );
      if (drive.ok) {
        const read = await drive.value.readText("tpl-1", SIGNAL());
        expect(read.ok).toBe(false);
        if (!read.ok) expect(read.error.id).toBe(ERROR_IDS.DRIVE_NOT_CONNECTED);
      }
    });
  });
});
