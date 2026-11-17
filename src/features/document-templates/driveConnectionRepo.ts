// The Drive connection of one user. The refresh token is encrypted before it is written and only
// decrypted here, for the connected user's own requests.
import { eq, sql } from "drizzle-orm";
import type { AppError } from "@/constants/errorIds";
import { driveConnections } from "@/db/schema/driveConnections";
import { decryptToken, encryptToken } from "@/features/email/crypto";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";

export interface DriveConnectionSecrets {
  accountEmail: string;
  refreshToken: string;
}

export async function saveDriveConnection(
  db: DbOrTx,
  userId: string,
  accountEmail: string,
  refreshToken: string,
  signal: AbortSignal,
): Promise<Result<true, AppError>> {
  const enc = encryptToken(refreshToken);
  await db
    .insert(driveConnections)
    .values({ userId, accountEmail, refreshTokenEnc: enc })
    .onConflictDoUpdate({
      target: driveConnections.userId,
      set: { accountEmail, refreshTokenEnc: enc, connectedAt: sql`now()` },
    });
  signal.throwIfAborted();
  return ok(true);
}

export async function getDriveConnection(
  db: DbOrTx,
  userId: string,
  signal: AbortSignal,
): Promise<Result<DriveConnectionSecrets | null, AppError>> {
  const [row] = await db
    .select()
    .from(driveConnections)
    .where(eq(driveConnections.userId, userId))
    .limit(1);
  signal.throwIfAborted();
  if (row === undefined) return ok(null);
  const plain = decryptToken(row.refreshTokenEnc);
  if (!plain.ok) return err(plain.error);
  return ok({ accountEmail: row.accountEmail, refreshToken: plain.value });
}
