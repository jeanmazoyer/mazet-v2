// Ties the Drive pieces together for one user: finishing the connection after consent, and handing
// the documents code the right Drive for whoever is asking (their own account, or none yet).
import type { AppError } from "@/constants/errorIds";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { ok, type Result } from "@/types/result";
import { notConnectedDrive } from "./driveConnection";
import { getDriveConnection, saveDriveConnection } from "./driveConnectionRepo";
import type { DriveProvider } from "./driveProvider";
import { exchangeDriveCode, refreshAccessToken } from "./googleDrive/connection";
import { createGoogleDriveProvider } from "./googleDrive/googleDriveProvider";

export interface DriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fetchFn: typeof fetch;
}

export async function completeDriveConnection(
  args: DriveConfig & { db: DbOrTx; userId: string; code: string; signal: AbortSignal },
): Promise<Result<{ accountEmail: string }, AppError>> {
  const exchanged = await exchangeDriveCode({
    clientId: args.clientId,
    clientSecret: args.clientSecret,
    redirectUri: args.redirectUri,
    code: args.code,
    fetchFn: args.fetchFn,
    signal: args.signal,
  });
  if (!exchanged.ok) return exchanged;
  const saved = await saveDriveConnection(
    args.db,
    args.userId,
    exchanged.value.accountEmail,
    exchanged.value.refreshToken,
    args.signal,
  );
  if (!saved.ok) return saved;
  return ok({ accountEmail: exchanged.value.accountEmail });
}

// The user's own Drive when connected; otherwise the "not connected" provider, which refuses
// every call before anything is written.
export async function driveForUser(
  db: DbOrTx,
  userId: string,
  config: Omit<DriveConfig, "redirectUri">,
  signal: AbortSignal,
): Promise<Result<DriveProvider, AppError>> {
  const connection = await getDriveConnection(db, userId, signal);
  if (!connection.ok) return connection;
  if (connection.value === null) return ok(notConnectedDrive);
  const refreshToken = connection.value.refreshToken;
  return ok(
    createGoogleDriveProvider({
      accessToken: (s) => refreshAccessToken({ ...config, refreshToken, signal: s }),
      fetchFn: config.fetchFn,
    }),
  );
}
