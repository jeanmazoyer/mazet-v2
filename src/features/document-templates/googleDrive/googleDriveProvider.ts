// The real shared storage: Google Drive for files and folders, Google Docs for filling fields.
// Every response is checked against a schema at this boundary, and a refused or failed call
// becomes an app error; an aborted call is rethrown, never swallowed.
import { z } from "zod";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import {
  DOCS_API_URL,
  DRIVE_API_URL,
  GOOGLE_DOC_MIME,
  GOOGLE_FOLDER_MIME,
  PDF_MIME,
  PLAIN_TEXT_MIME,
} from "@/constants/googleDrive";
import { err, ok, type Result } from "@/types/result";
import type { CreateFromTemplateInput, DriveFile, DriveProvider } from "../driveProvider";
import { buildReplaceAllTextRequests, escapeDriveQueryValue } from "./requests";

const idSchema = z.object({ id: z.string().min(1) });
const filesListSchema = z.object({ files: z.array(idSchema) });

export interface GoogleDriveOptions {
  // Returns a current access token for the connected account (refreshing it when needed).
  accessToken: (signal: AbortSignal) => Promise<Result<string, AppError>>;
  fetchFn: typeof fetch;
}

export function createGoogleDriveProvider(options: GoogleDriveOptions): DriveProvider {
  const { accessToken, fetchFn } = options;

  async function send(
    signal: AbortSignal,
    url: string,
    method: "GET" | "POST",
    body?: unknown,
  ): Promise<Result<Response, AppError>> {
    const token = await accessToken(signal);
    if (!token.ok) return token;
    try {
      const res = await fetchFn(url, {
        method,
        signal,
        headers: {
          Authorization: `Bearer ${token.value}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!res.ok) {
        return err(
          new AppError(ERROR_IDS.DRIVE_REQUEST_FAILED, "Google refused the request", {
            status: res.status,
          }),
        );
      }
      return ok(res);
    } catch (e) {
      signal.throwIfAborted();
      const reason = e instanceof Error ? e.message : "network error";
      return err(
        new AppError(ERROR_IDS.DRIVE_REQUEST_FAILED, "Google could not be reached", { reason }),
      );
    }
  }

  async function sendJson<T>(
    signal: AbortSignal,
    url: string,
    method: "GET" | "POST",
    schema: z.ZodType<T>,
    body?: unknown,
  ): Promise<Result<T, AppError>> {
    const res = await send(signal, url, method, body);
    if (!res.ok) return res;
    const parsed = schema.safeParse(await res.value.json());
    if (!parsed.success) {
      return err(
        new AppError(ERROR_IDS.DRIVE_REQUEST_FAILED, "Google returned an unexpected answer", {}),
      );
    }
    return ok(parsed.data);
  }

  // Walks the folder path from the top of the drive, creating each missing level, and returns the
  // id of the deepest folder.
  async function ensureFolderPath(
    signal: AbortSignal,
    path: readonly string[],
  ): Promise<Result<string, AppError>> {
    let parent = "root";
    for (const name of path) {
      const q = `name = '${escapeDriveQueryValue(name)}' and mimeType = '${GOOGLE_FOLDER_MIME}' and '${parent}' in parents and trashed = false`;
      const found = await sendJson(
        signal,
        `${DRIVE_API_URL}/files?${new URLSearchParams({ q, fields: "files(id)" })}`,
        "GET",
        filesListSchema,
      );
      if (!found.ok) return found;
      const existing = found.value.files[0];
      if (existing !== undefined) {
        parent = existing.id;
        continue;
      }
      const created = await sendJson(signal, `${DRIVE_API_URL}/files`, "POST", idSchema, {
        name,
        mimeType: GOOGLE_FOLDER_MIME,
        parents: [parent],
      });
      if (!created.ok) return created;
      parent = created.value.id;
    }
    return ok(parent);
  }

  return {
    async readText(fileId, signal) {
      const res = await send(
        signal,
        `${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}/export?${new URLSearchParams({ mimeType: PLAIN_TEXT_MIME })}`,
        "GET",
      );
      if (!res.ok) return res;
      return ok(await res.value.text());
    },

    async createFromTemplate(
      input: CreateFromTemplateInput,
      signal,
    ): Promise<Result<DriveFile, AppError>> {
      const folder = await ensureFolderPath(signal, input.folderPath);
      if (!folder.ok) return folder;
      const copy = await sendJson(
        signal,
        `${DRIVE_API_URL}/files/${encodeURIComponent(input.templateFileId)}/copy`,
        "POST",
        idSchema,
        { name: input.name, parents: [folder.value] },
      );
      if (!copy.ok) return copy;
      const requests = buildReplaceAllTextRequests(input.replacements);
      if (requests.length > 0) {
        const filled = await send(
          signal,
          `${DOCS_API_URL}/documents/${encodeURIComponent(copy.value.id)}:batchUpdate`,
          "POST",
          {
            requests,
          },
        );
        if (!filled.ok) return filled;
      }
      return ok({ fileId: copy.value.id, name: input.name });
    },

    async exportPdf(fileId, signal): Promise<Result<Uint8Array, AppError>> {
      const res = await send(
        signal,
        `${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}/export?${new URLSearchParams({ mimeType: PDF_MIME })}`,
        "GET",
      );
      if (!res.ok) return res;
      return ok(new Uint8Array(await res.value.arrayBuffer()));
    },

    async createBlank(input, signal): Promise<Result<DriveFile, AppError>> {
      const folder = await ensureFolderPath(signal, input.folderPath);
      if (!folder.ok) return folder;
      const created = await sendJson(signal, `${DRIVE_API_URL}/files`, "POST", idSchema, {
        name: input.name,
        mimeType: GOOGLE_DOC_MIME,
        parents: [folder.value],
      });
      if (!created.ok) return created;
      return ok({ fileId: created.value.id, name: input.name });
    },
  };
}
