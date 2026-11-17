import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  DOCS_API_URL,
  DRIVE_API_URL,
  GOOGLE_DOC_MIME,
  GOOGLE_FOLDER_MIME,
} from "@/constants/googleDrive";
import { ok } from "@/types/result";
import { scriptedFetch } from "../testing/scriptedFetch";
import { createGoogleDriveProvider } from "./googleDriveProvider";

const TOKEN = "access-token-test";
const provider = (fetchFn: typeof fetch) =>
  createGoogleDriveProvider({ accessToken: () => Promise.resolve(ok(TOKEN)), fetchFn });
const signal = () => AbortSignal.timeout(5000);

describe("Google Drive provider", () => {
  it("reads a document as plain text, with the connected account's token", async () => {
    const { fetchFn, calls } = scriptedFetch([
      { match: (u) => u.startsWith(`${DRIVE_API_URL}/files/doc-1/export`), json: "" },
    ]);
    const r = await provider(fetchFn).readText("doc-1", signal());
    expect(r.ok).toBe(true);
    expect(calls[0]?.auth).toBe(`Bearer ${TOKEN}`);
    expect(calls[0]?.url).toContain("mimeType=text%2Fplain");
  });

  it("makes a document from a template: copies it into the deal folder, then fills every field", async () => {
    const { fetchFn, calls } = scriptedFetch([
      {
        match: (u, m) => m === "GET" && u.startsWith(`${DRIVE_API_URL}/files?`),
        json: { files: [{ id: "folder-x" }] },
      },
      {
        match: (u, m) => m === "POST" && u === `${DRIVE_API_URL}/files/tpl-1/copy`,
        json: { id: "copy-1", name: "Contrat Bravo" },
      },
      {
        match: (u, m) => m === "POST" && u === `${DOCS_API_URL}/documents/copy-1:batchUpdate`,
        json: { replies: [] },
      },
    ]);
    const r = await provider(fetchFn).createFromTemplate(
      {
        templateFileId: "tpl-1",
        name: "Contrat Bravo",
        folderPath: ["Deals"],
        replacements: { dealTitle: "Séjour Bravo" },
      },
      signal(),
    );
    expect(r).toEqual(ok({ fileId: "copy-1", name: "Contrat Bravo" }));
    const copy = calls.find((c) => c.url.endsWith("/copy"));
    expect(copy?.body).toEqual({ name: "Contrat Bravo", parents: ["folder-x"] });
    const fill = calls.find((c) => c.url.endsWith(":batchUpdate"));
    expect(fill?.body).toEqual({
      requests: [
        {
          replaceAllText: {
            containsText: { text: "{{dealTitle}}", matchCase: true },
            replaceText: "Séjour Bravo",
          },
        },
      ],
    });
  });

  it("creates the folders of a path that do not exist yet, one level at a time", async () => {
    const { fetchFn, calls } = scriptedFetch([
      {
        match: (u, m) => m === "GET" && u.startsWith(`${DRIVE_API_URL}/files?`),
        json: { files: [] },
      },
      {
        match: (u, m) => m === "POST" && u === `${DRIVE_API_URL}/files`,
        json: { id: "new-folder" },
      },
      { match: (u, m) => m === "POST" && u === `${DRIVE_API_URL}/files`, json: { id: "doc-new" } },
    ]);
    await provider(fetchFn).createBlank({ name: "Note", folderPath: ["Deals", "2026"] }, signal());
    const folderCreates = calls.filter(
      (c) =>
        c.method === "POST" &&
        c.url === `${DRIVE_API_URL}/files` &&
        (c.body as { mimeType?: string }).mimeType === GOOGLE_FOLDER_MIME,
    );
    expect(folderCreates).toHaveLength(2);
    const docCreate = calls.at(-1);
    expect(docCreate?.body).toEqual({
      name: "Note",
      mimeType: GOOGLE_DOC_MIME,
      parents: ["new-folder"],
    });
  });

  it("turns a refused request into an app error, not a crash", async () => {
    const { fetchFn } = scriptedFetch([
      { match: () => true, status: 403, json: { error: { message: "forbidden" } } },
    ]);
    const r = await provider(fetchFn).readText("doc-1", signal());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.DRIVE_REQUEST_FAILED);
  });
});
