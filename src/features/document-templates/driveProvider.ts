// The storage the documents live in. The app talks to it only through this contract, so the
// Google implementation and the in-memory one used by tests behave the same way.
import type { AppError } from "@/constants/errorIds";
import type { Result } from "@/types/result";

export interface DriveFile {
  fileId: string;
  name: string;
}

export interface CreateFromTemplateInput {
  templateFileId: string;
  name: string;
  // Folders from the top of the shared drive down, created when missing.
  folderPath: readonly string[];
  // Each {{key}} in the template is replaced with its value; keys not listed stay as they are.
  replacements: Readonly<Record<string, string>>;
}

export interface DriveProvider {
  readText(fileId: string, signal: AbortSignal): Promise<Result<string, AppError>>;
  createFromTemplate(
    input: CreateFromTemplateInput,
    signal: AbortSignal,
  ): Promise<Result<DriveFile, AppError>>;
  createBlank(
    input: { name: string; folderPath: readonly string[] },
    signal: AbortSignal,
  ): Promise<Result<DriveFile, AppError>>;
}
