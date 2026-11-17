import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { driveConnections } from "@/db/schema/driveConnections";
import { withTestDb } from "@/db/testing";
import { seedUser } from "@/db/testing/factories";
import { getDriveConnection, saveDriveConnection } from "./driveConnectionRepo";

const SIGNAL = (): AbortSignal => AbortSignal.timeout(10_000);
const REFRESH = "1//refresh-token-fictif-0001";

describe("Drive connection storage (base réelle)", () => {
  it("stores the refresh token encrypted, and gives it back in clear to the same user only", async () => {
    await withTestDb(async (db) => {
      const user = await seedUser(db, { name: "Jean", email: "jean@example.com" });
      const saved = await saveDriveConnection(
        db,
        user.id,
        "jeanmazoyer@gmail.com",
        REFRESH,
        SIGNAL(),
      );
      expect(saved.ok).toBe(true);

      const [row] = await db
        .select()
        .from(driveConnections)
        .where(eq(driveConnections.userId, user.id));
      expect(row).toBeDefined();
      expect(row?.refreshTokenEnc.toString("utf8")).not.toContain(REFRESH);

      const got = await getDriveConnection(db, user.id, SIGNAL());
      expect(got.ok && got.value).toEqual({
        accountEmail: "jeanmazoyer@gmail.com",
        refreshToken: REFRESH,
      });
    });
  });

  it("answers nothing for a user who never connected, so the app keeps saying so", async () => {
    await withTestDb(async (db) => {
      const user = await seedUser(db, { name: "Autre", email: "autre@example.com" });
      const got = await getDriveConnection(db, user.id, SIGNAL());
      expect(got.ok && got.value).toBeNull();
    });
  });

  it("replaces the connection when the user connects again, rather than keeping two", async () => {
    await withTestDb(async (db) => {
      const user = await seedUser(db, { name: "Jean", email: "jean@example.com" });
      await saveDriveConnection(db, user.id, "ancien@gmail.com", "rt-old", SIGNAL());
      await saveDriveConnection(db, user.id, "nouveau@gmail.com", "rt-new", SIGNAL());
      const got = await getDriveConnection(db, user.id, SIGNAL());
      expect(got.ok && got.value).toEqual({
        accountEmail: "nouveau@gmail.com",
        refreshToken: "rt-new",
      });
    });
  });
});
