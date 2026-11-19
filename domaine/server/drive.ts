// Google Drive, for the documents the app creates (contract, security deposit). The grant asked for is
// drive.file: the app reaches the files and folders it created itself, nothing else in the Drive.
// A document is private to the account that connected, plus whoever that person shares the folder with.
import type { Role } from "./auth.ts";

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const DRIVE_ID = /^[\w-]{10,80}$/;
export type DriveSetting = { refresh: string; email: string; folder: string };

/** Where an administrator is sent to let the app create documents in their Drive. */
export function driveAuthUrl(clientId: string, baseUrl: string, state: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  // offline + consent: Google then hands a refresh token, so the grant outlives the hour.
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: `${baseUrl}/auth/callback`, response_type: "code", scope: `openid email ${DRIVE_SCOPE}`,
    access_type: "offline", prompt: "consent", state }).toString();
  return url.toString();
}

/** What a page may know about the connection: never the token, and the account only for administrators. */
export function driveSeen(stored: unknown, role: Role): { on: boolean; email?: string; folder?: string } {
  const s = stored as Partial<DriveSetting> | null;
  if (!s || typeof s.refresh !== "string" || !s.refresh || typeof s.folder !== "string") return { on: false };
  return role === "admin" ? { on: true, email: s.email ?? "", folder: s.folder } : { on: true };
}

const TAGS = new Set(["h1", "h2", "h3", "p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "table", "thead", "tbody", "tr", "td", "th", "div", "span", "hr"]);
const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
/** The page handed to Google for conversion: text and layout tags only, a class name at most as attribute. */
export function docHtml(title: string, body: string): string {
  const clean = body.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|iframe|object|svg|template)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (m: string, tag: string, attrs: string) => {
      const t = tag.toLowerCase(); if (!TAGS.has(t)) return "";
      if (m.startsWith("</")) return `</${t}>`;
      const cls = /\bclass\s*=\s*"([a-z0-9 _-]{1,40})"/i.exec(attrs);
      return `<${t}${cls ? ` class="${cls[1]}"` : ""}>`;
    });
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Lato,Arial,sans-serif;font-size:11pt;line-height:1.45}h1{font-size:18pt;text-align:center}h2{font-size:13pt}p.c{text-align:center;color:#666}table{width:100%;border-collapse:collapse}td,th{padding:4pt 6pt;vertical-align:top}</style></head><body>${clean}</body></html>`;
}

/** How a new document is described to Drive: a Google Docs file, in one folder the app created. */
export function docMeta(name: string, folder: string): { name: string; mimeType: string; parents: string[] } {
  return { name, mimeType: "application/vnd.google-apps.document", parents: [folder] };
}

/* ---------- Calls to Google. Each one gives up after 15 seconds. ---------- */
const wait = () => AbortSignal.timeout(15_000);
export class DriveError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }

/** The code Google hands back after consent, exchanged for the lasting grant and the account's identity. */
export async function exchangeCode(code: string, clientId: string, secret: string, baseUrl: string): Promise<{ refresh: string; access: string; idToken: string } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", signal: wait(),
    body: new URLSearchParams({ code, client_id: clientId, client_secret: secret, redirect_uri: `${baseUrl}/auth/callback`, grant_type: "authorization_code" }) });
  if (!res.ok) return null;
  const t = (await res.json()) as { refresh_token?: string; access_token?: string; id_token?: string; scope?: string };
  if (!t.refresh_token || !t.access_token || !(t.scope ?? "").split(" ").includes(DRIVE_SCOPE)) return null;
  return { refresh: t.refresh_token, access: t.access_token, idToken: t.id_token ?? "" };
}

let cached: { refresh: string; token: string; until: number } | null = null;
/** A one-hour token from the lasting grant, kept in memory until a minute before it ends. */
export async function accessToken(refresh: string, clientId: string, secret: string): Promise<string> {
  if (cached && cached.refresh === refresh && cached.until > Date.now()) return cached.token;
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", signal: wait(),
    body: new URLSearchParams({ refresh_token: refresh, client_id: clientId, client_secret: secret, grant_type: "refresh_token" }) });
  if (!res.ok) throw new DriveError(res.status === 400 || res.status === 401 ? 401 : 502, "Google Drive n'est plus connecté");
  const t = (await res.json()) as { access_token: string; expires_in: number };
  cached = { refresh, token: t.access_token, until: Date.now() + (t.expires_in - 60) * 1000 };
  return t.access_token;
}
export const forgetToken = () => { cached = null; };

async function driveJson(token: string, url: string, init: RequestInit): Promise<{ id: string }> {
  const res = await fetch(url, { ...init, signal: wait(), headers: { authorization: `Bearer ${token}`, ...(init.headers as Record<string, string>) } });
  if (!res.ok) throw new DriveError(res.status === 401 || res.status === 403 ? 401 : res.status === 404 ? 404 : 502, `Google Drive a refusé (${res.status})`);
  return (await res.json()) as { id: string };
}
/** A folder, private unless its parent is shared. */
export async function createFolder(token: string, name: string, parent = ""): Promise<string> {
  const meta = { name, mimeType: "application/vnd.google-apps.folder", ...(parent ? { parents: [parent] } : {}) };
  return (await driveJson(token, "https://www.googleapis.com/drive/v3/files?fields=id", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(meta) })).id;
}
/**
 * A Google Docs file made from a page, inside a folder the app created. It takes that folder's sharing,
 * nothing wider. Two plain calls, both checked against the real API: the empty document first, then its
 * content, which Google converts from HTML. A document left empty by a failed second call is removed.
 */
export async function createDoc(token: string, name: string, html: string, folder: string): Promise<string> {
  const { id } = await driveJson(token, "https://www.googleapis.com/drive/v3/files?fields=id", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(docMeta(name, folder)) });
  try {
    await driveJson(token, `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(id)}?uploadType=media&fields=id`, { method: "PATCH", headers: { "content-type": "text/html; charset=UTF-8" }, body: html });
  } catch (e) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`, { method: "DELETE", signal: wait(), headers: { authorization: `Bearer ${token}` } }).catch(() => null);
    throw e;
  }
  return id;
}
/** Hands the grant back to Google. A failure here is not an obstacle: the stored token is dropped anyway. */
export async function revoke(refresh: string): Promise<void> {
  await fetch("https://oauth2.googleapis.com/revoke", { method: "POST", signal: wait(), body: new URLSearchParams({ token: refresh }) }).catch(() => null);
}
