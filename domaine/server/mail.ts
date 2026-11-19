// Gmail, for the conversations of a deal: read them and answer from the app. The grant asks to read the
// mailbox and to send from it. The routes built on this file only ever search and show threads in which
// one of the deal's own addresses takes part, and only ever write to the deal's contact.
import type { Role } from "./auth.ts";

export const MAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"];
export type MailSetting = { refresh: string; email: string };
export type Mail = { id: string; from: string; to: string; subject: string; at: string; mine: boolean; html: string; messageId: string; files: MailFile[] };
export type MailFile = { n: number; name: string; type: string; size: number };

export function mailAuthUrl(clientId: string, baseUrl: string, state: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: `${baseUrl}/auth/callback`, response_type: "code", scope: `openid email ${MAIL_SCOPES.join(" ")}`,
    access_type: "offline", prompt: "consent", state }).toString();
  return url.toString();
}
/** What a page may know about the mailbox: never the token, and its address only for administrators. */
export function mailSeen(stored: unknown, role: Role): { on: boolean; email?: string } {
  const s = stored as Partial<MailSetting> | null;
  if (!s || typeof s.refresh !== "string" || !s.refresh) return { on: false };
  return role === "admin" ? { on: true, email: s.email ?? "" } : { on: true };
}

const ADDRESS = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
/** The addresses a deal's conversations are looked up by: its contact's, plus any other it lists. */
export function addressesOf(doc: Record<string, unknown>): string[] {
  const contact = (doc.contact ?? {}) as { email?: unknown }, more = Array.isArray(doc.mailAddrs) ? doc.mailAddrs : [];
  const all = [contact.email, ...more].map((a) => (typeof a === "string" ? a.trim().toLowerCase() : "")).filter((a) => ADDRESS.test(a));
  return [...new Set(all)].slice(0, 6);
}
/** Who a message from a deal goes to: the address asked for when it is one of the deal's, its contact otherwise. */
export function recipientFor(doc: Record<string, unknown>, asked: string): string | null {
  const known = addressesOf(doc), want = asked.trim().toLowerCase();
  return want ? (known.includes(want) ? want : null) : known[0] ?? null;
}
/** Who a message goes to when several are asked for: every one of them must be an address of the deal. */
export function recipientsFor(doc: Record<string, unknown>, asked: string[]): string[] | null {
  const known = addressesOf(doc), want = [...new Set(asked.map((a) => a.trim().toLowerCase()).filter(Boolean))];
  if (!want.length) return known.length ? [known[0]] : null;
  return want.every((a) => known.includes(a)) ? want : null;
}
/** The Gmail search for those addresses (braces mean "any of"). */
export function mailQuery(addresses: string[]): string {
  return `{${addresses.map((a) => `from:"${a}" to:"${a}"`).join(" ")}}`;
}
const addressesIn = (header: string) => (header.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) ?? []);
/** Whether one of the deal's addresses really takes part in a thread (a search hit is not proof enough). */
export function concerns(messages: Array<{ from: string; to: string }>, addresses: string[]): boolean {
  return messages.some((m) => [...addressesIn(m.from), ...addressesIn(m.to)].some((a) => addresses.includes(a)));
}

const TAGS = new Set(["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "div", "span", "table", "thead", "tbody", "tr", "td", "th", "hr", "a", "s", "strike", "font"]);
// The only attributes a <font> may carry, each with a shape that cannot hold anything but a font, a size or a colour.
const FONT_ATTRS: Array<[string, RegExp]> = [["face", /^[A-Za-z][A-Za-z ,-]{1,60}$/], ["size", /^[1-7]$/], ["color", /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20})$/]];
const attrOf = (attrs: string, name: string) => { const m = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(attrs); return (m?.[1] ?? m?.[2] ?? "").trim(); };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
/** Mail content made safe to show and to send: simple formatting tags, no attribute except a web or mail link. */
export function cleanMailHtml(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|head|title|iframe|object|svg|template)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (m: string, tag: string, attrs: string) => {
      const t = tag.toLowerCase(); if (!TAGS.has(t)) return "";
      if (m.startsWith("</")) return `</${t}>`;
      if (t === "font") return `<font${FONT_ATTRS.map(([name, shape]) => { const v = attrOf(attrs, name); return shape.test(v) ? ` ${name}="${v}"` : ""; }).join("")}>`;
      if (t !== "a") return `<${t}>`;
      const url = attrOf(attrs, "href");
      return /^(https?:\/\/|mailto:)/i.test(url) ? `<a href="${esc(url.replace(/&amp;/g, "&"))}" target="_blank" rel="noopener noreferrer">` : "<a>";
    }).trim();
}
const decode = (data: string) => Buffer.from(data ?? "", "base64url").toString("utf8");
type Part = { mimeType?: string; filename?: string; body?: { data?: string; attachmentId?: string; size?: number }; parts?: Part[]; headers?: Array<{ name: string; value: string }> };
const findPart = (p: Part, type: string): Part | null => (p.mimeType === type && p.body?.data ? p : (p.parts ?? []).map((c) => findPart(c, type)).find(Boolean) ?? null);
// The files joined to a message, in order. An image placed inside the text (a signature, a logo) is not one.
const inText = (p: Part) => (p.mimeType ?? "").startsWith("image/") && /^\s*inline/i.test((p.headers ?? []).find((h) => h.name.toLowerCase() === "content-disposition")?.value ?? "");
const fileParts = (p: Part): Part[] => [...(p.filename && !inText(p) ? [p] : []), ...(p.parts ?? []).flatMap(fileParts)];
const fileType = (p: Part) => (p.mimeType ?? "").slice(0, 100);
/** Where to fetch the n-th file of a message. Null when there is none at that place. */
export function attachmentOf(msg: { payload?: Part }, n: number): { id: string; name: string; type: string } | null {
  const part = Number.isInteger(n) && n >= 0 ? fileParts(msg.payload ?? {})[n] : undefined;
  return part?.body?.attachmentId ? { id: part.body.attachmentId, name: (part.filename ?? "").slice(0, 120), type: fileType(part) } : null;
}
const SHOWN = new Set(["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"]);
/** How a file from a message is handed to the browser: displayed only when that runs nothing, downloaded otherwise. */
export function attachmentHeaders(name: string, type: string): Record<string, string> {
  const shown = SHOWN.has(type);
  return { "content-type": shown ? type : "application/octet-stream", "content-disposition": `${shown ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name || "piece-jointe")}`,
    "x-content-type-options": "nosniff", "cache-control": "private, max-age=600", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'" };
}
const QUOTED = /^(Le .{5,90} a écrit ?:|On .{5,90} wrote:|Am .{5,90} schrieb .*:|-{3,} ?(Original Message|Message d'origine) ?-{3,}|_{10,})\s*$/m;
/** One Gmail message, as the app shows it: who, when, and its own words without the history quoted below them. */
export function readMessage(msg: { id: string; internalDate?: string; payload?: Part }, mailbox: string): Mail {
  const payload = msg.payload ?? {}, h = (n: string) => (payload.headers ?? []).find((x) => x.name.toLowerCase() === n)?.value ?? "";
  const htmlPart = findPart(payload, "text/html"), textPart = findPart(payload, "text/plain");
  let html = "";
  if (htmlPart) html = cleanMailHtml(decode(htmlPart.body?.data ?? "").split(/<(?:div|blockquote)[^>]*class\s*=\s*"[^"]*gmail_quote/i)[0].split(/<blockquote[^>]*type\s*=\s*"cite"/i)[0]);
  else if (textPart) { const text = decode(textPart.body?.data ?? ""), cut = QUOTED.exec(text);
    html = esc((cut ? text.slice(0, cut.index) : text).split("\n").filter((l) => !l.startsWith(">")).join("\n").trim()).replace(/\n/g, "<br>"); }
  const from = h("from");
  return { id: msg.id, from, to: h("to"), subject: h("subject"), at: new Date(Number(msg.internalDate ?? 0)).toISOString(), mine: addressesIn(from).includes(mailbox.toLowerCase()), html: html.slice(0, 40_000), messageId: h("message-id"), files: fileParts(payload).slice(0, 20).map((p, n) => ({ n, name: (p.filename ?? "").slice(0, 120), type: fileType(p), size: Number(p.body?.size ?? 0) })) };
}

const wrap = (b64: string) => b64.replace(/(.{76})/g, "$1\r\n");
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
export type OutFile = { name: string; type: string; bytes: Buffer };
const OUT_TYPE = /^[a-z]+\/[a-z0-9.+-]+$/;
/**
 * A message ready for Gmail: plain text and HTML, plus the files joined to it when there are some.
 * Headers cannot be injected through its fields, a file's name or its type.
 */
export function buildMime(m: { from: string; to: string; subject: string; html: string; inReplyTo?: string; references?: string; files?: OutFile[] }, boundary: string): string {
  for (const v of [m.from, m.to, m.inReplyTo ?? "", m.references ?? ""]) if (/[\r\n]/.test(v)) throw new Error("invalid header");
  const html = cleanMailHtml(m.html), text = html.replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|blockquote)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\n{3,}/g, "\n\n").trim();
  const files = m.files ?? [], outer = `${boundary}m`;
  const head = [`From: ${m.from}`, `To: ${m.to}`, `Subject: =?UTF-8?B?${Buffer.from(oneLine(m.subject), "utf8").toString("base64")}?=`, "MIME-Version: 1.0",
    ...(m.inReplyTo ? [`In-Reply-To: ${m.inReplyTo}`, `References: ${m.references || m.inReplyTo}`] : [])];
  const part = (type: string, body: string) => `--${boundary}\r\nContent-Type: ${type}; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap(Buffer.from(body, "utf8").toString("base64"))}\r\n`;
  const words = `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n${part("text/plain", text)}${part("text/html", `<div>${html}</div>`)}--${boundary}--`;
  if (!files.length) return `${head.join("\r\n")}\r\n${words}`;
  const joined = files.map((f) => `--${outer}\r\nContent-Type: ${OUT_TYPE.test(f.type) ? f.type : "application/octet-stream"}\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename*=UTF-8''${encodeURIComponent(f.name || "piece-jointe")}\r\n\r\n${wrap(f.bytes.toString("base64"))}\r\n`).join("");
  return `${head.join("\r\n")}\r\nContent-Type: multipart/mixed; boundary="${outer}"\r\n\r\n--${outer}\r\n${words}\r\n${joined}--${outer}--`;
}
/** What Gmail's upload address expects for a large message: what it is about, then the message itself. */
export function uploadBody(mime: string, threadId: string, boundary: string): { type: string; body: string } {
  return { type: `multipart/related; boundary="${boundary}"`, body: `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(threadId ? { threadId } : {})}\r\n--${boundary}\r\nContent-Type: message/rfc822\r\n\r\n${mime}\r\n--${boundary}--` };
}
export const toRaw = (mime: string) => Buffer.from(mime, "utf8").toString("base64url");

/* ---------- Calls to Gmail. Each one gives up after 15 seconds. ---------- */
export class MailError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
const API = "https://gmail.googleapis.com/gmail/v1/users/me";
async function gmail<T>(token: string, path: string, init: RequestInit = {}, wait = 15_000): Promise<T> {
  const res = await fetch(API + path, { ...init, signal: AbortSignal.timeout(wait), headers: { authorization: `Bearer ${token}`, ...(init.headers as Record<string, string>) } });
  if (!res.ok) throw new MailError([401, 403, 404].includes(res.status) ? res.status : 502, `Gmail a refusé (${res.status})`);
  return (await res.json()) as T;
}
/** The threads in which the given addresses take part, newest first, each with its messages read. */
export async function threadsFor(token: string, addresses: string[], mailbox: string): Promise<Array<{ id: string; subject: string; messages: Mail[] }>> {
  if (!addresses.length) return [];
  const list = await gmail<{ threads?: Array<{ id: string }> }>(token, `/threads?maxResults=12&q=${encodeURIComponent(mailQuery(addresses))}`);
  const full = await Promise.all((list.threads ?? []).map((t) => gmail<{ id: string; messages?: Array<{ id: string; internalDate?: string; payload?: Part; labelIds?: string[] }> }>(token, `/threads/${encodeURIComponent(t.id)}?format=full`)));
  return full.map((t) => { const messages = (t.messages ?? []).filter((m) => !(m.labelIds ?? []).includes("DRAFT")).map((m) => readMessage(m, mailbox)).sort((a, b) => (a.at < b.at ? -1 : 1));
    return { id: t.id, subject: messages[0]?.subject ?? "", messages }; }).filter((t) => t.messages.length && concerns(t.messages, addresses));
}
/** What a reply needs from its thread. Null when the thread is not one of the deal's. */
export async function threadHead(token: string, threadId: string, addresses: string[], mailbox: string): Promise<{ messageId: string; subject: string } | null> {
  const t = await gmail<{ messages?: Array<{ id: string; internalDate?: string; payload?: Part }> }>(token, `/threads/${encodeURIComponent(threadId)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Message-ID`);
  const messages = (t.messages ?? []).map((m) => readMessage(m, mailbox));
  if (!messages.length || !concerns(messages, addresses)) return null;
  const last = messages[messages.length - 1];
  return { messageId: last.messageId, subject: messages[0].subject };
}
/**
 * One file of one message, for a deal. Null when the message is not part of the deal's conversations
 * or holds no such file: a page cannot use this to read anything else in the mailbox.
 */
export async function readAttachment(token: string, messageId: string, n: number, addresses: string[], mailbox: string): Promise<{ name: string; type: string; bytes: Buffer } | null> {
  const msg = await gmail<{ id: string; threadId?: string; internalDate?: string; payload?: Part }>(token, `/messages/${encodeURIComponent(messageId)}?format=full`);
  const mine = concerns([readMessage(msg, mailbox)], addresses) || (msg.threadId ? (await threadHead(token, msg.threadId, addresses, mailbox)) !== null : false);
  const file = mine ? attachmentOf(msg, n) : null;
  if (!file) return null;
  const got = await gmail<{ data?: string }>(token, `/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(file.id)}`, {}, 45_000);
  return { name: file.name, type: file.type, bytes: Buffer.from(got.data ?? "", "base64url") };
}
/**
 * Sends a message from the mailbox, inside a thread when one is given. A message that carries files
 * goes through Gmail's upload address, made for large messages.
 */
export async function sendMail(token: string, mime: string, threadId = "", large = false): Promise<{ id: string; threadId: string }> {
  if (!large) return gmail(token, "/messages/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ raw: toRaw(mime), ...(threadId ? { threadId } : {}) }) });
  const up = uploadBody(mime, threadId, "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const res = await fetch("https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=multipart", { method: "POST", signal: AbortSignal.timeout(90_000), headers: { authorization: `Bearer ${token}`, "content-type": up.type }, body: up.body });
  if (!res.ok) throw new MailError([401, 403, 404].includes(res.status) ? res.status : 502, `Gmail a refusé (${res.status})`);
  return (await res.json()) as { id: string; threadId: string };
}
