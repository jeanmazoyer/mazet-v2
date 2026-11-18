// The Drive connection the app uses. Until a Google account is connected, every call answers
// "not connected" at once, so nothing is half-created: no Drive file and no database row.
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { err, type Result } from "@/types/result";
import type { DriveFile, DriveProvider } from "./driveProvider";

function notConnected<T>(): Promise<Result<T, AppError>> {
  return Promise.resolve(
    err(new AppError(ERROR_IDS.DRIVE_NOT_CONNECTED, "Google Drive is not connected", {})),
  );
}

export const notConnectedDrive: DriveProvider = {
  readText: () => notConnected<string>(),
  createFromTemplate: () => notConnected<DriveFile>(),
  createBlank: () => notConnected<DriveFile>(),
  exportPdf: () => notConnected<Uint8Array>(),
};
