// In-memory stand-in for the shared drive, for tests only. Files keep their text so a test can
// read what a generated document actually says.
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { err, ok, type Result } from "@/types/result";
import type { CreateFromTemplateInput, DriveFile, DriveProvider } from "../driveProvider";

interface StoredFile {
  name: string;
  text: string;
  folderPath: readonly string[];
}

export interface FakeDrive extends DriveProvider {
  seedFile(name: string, text: string): string;
  textOf(fileId: string): string | undefined;
  folderOf(fileId: string): readonly string[] | undefined;
}

export function createFakeDrive(): FakeDrive {
  const files = new Map<string, StoredFile>();
  let counter = 0;
  const add = (name: string, text: string, folderPath: readonly string[]): DriveFile => {
    counter += 1;
    const fileId = `fake-${counter}`;
    files.set(fileId, { name, text, folderPath });
    return { fileId, name };
  };
  const missing = (fileId: string): Result<never, AppError> =>
    err(new AppError(ERROR_IDS.DOCUMENT_NOT_FOUND, "Drive file not found", { fileId }));

  return {
    seedFile(name, text) {
      return add(name, text, []).fileId;
    },
    textOf(fileId) {
      return files.get(fileId)?.text;
    },
    folderOf(fileId) {
      return files.get(fileId)?.folderPath;
    },
    readText(fileId) {
      const file = files.get(fileId);
      return Promise.resolve(file === undefined ? missing(fileId) : ok(file.text));
    },
    createFromTemplate(input: CreateFromTemplateInput) {
      const source = files.get(input.templateFileId);
      if (source === undefined) return Promise.resolve(missing(input.templateFileId));
      let text = source.text;
      for (const [key, value] of Object.entries(input.replacements)) {
        text = text.split(`{{${key}}}`).join(value);
      }
      return Promise.resolve(ok(add(input.name, text, input.folderPath)));
    },
    createBlank(input) {
      return Promise.resolve(ok(add(input.name, "", input.folderPath)));
    },
  };
}
