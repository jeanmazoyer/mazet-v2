import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { Readable } from "node:stream";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { etag } from "hono/etag";
import { streamSSE } from "hono/streaming";
import { cookie, decideAccess, hashToken, mayBootstrap, readCookie, readIdToken, signIn, signOut, userFromCookie, type Access, type Role, type User } from "./auth.ts";
import { config } from "./config.ts";
import { migrate, sql } from "./db.ts";
import { DEAL_ID, forRole, mergeForSave, stored, type Doc } from "./deals.ts";
import { AiError, draftMail, draftPrompt, draftToHtml, plainText } from "./ai.ts";
import { driveIdOf, mailSummary, planDocs, visitFromEvent, type DocLine } from "./sync.ts";
import { jobOf, newToken, PIXEL, sendAtOf, TRACK_TOKEN, type Job } from "./outbox.ts";
import { calAuthUrl, CalError, calSeen, CAL_SCOPE, deleteEvent, eventBody, eventId, putEvent, readEvent, visitOf, VISIT_ID, type CalSetting } from "./calendar.ts";
import { addressesOf, buildMime, cleanMailHtml, inlineImages, trackLinks, type InlineFile, type OutFile, mailAuthUrl, MailError, mailSeen, MAIL_SCOPES, attachmentHeaders, readAttachment, recipientsFor, sendMail, threadsMeta, threadHead, threadsFor, type MailSetting } from "./mail.ts";
import { accessToken, createDoc, createFolder, docHtml, driveAuthUrl, DriveError, driveSeen, DRIVE_ID, exchangeCode, editedSince, folderName, forgetToken, listTree, uploadTo, exportPdf, ownDriveDocs, pagePdf, pdfName, lockDoc, moveQuery, readFolder, readStamp, revoke, updateFolder, writeDoc, type DriveSetting } from "./drive.ts";
import { fetchIcal, type Source, type Stay } from "./ical.ts";

const app = new Hono<{ Variables: { user: User } }>();
const CHANNEL = "domaine_changes";
// Settings anyone signed in may write, and those only an administrator may.
const SHARED_KEYS = ["library", "feeds", "agents", "mailkit"], ADMIN_KEYS = ["prefs", "bank", "invoices"];
// Settings the team does not even receive: the bank statement, the register of invoices, and the secret of the calendar link.
const PRIVATE_KEYS = ["bank", "invoices", "ical_token", "drive", "gmail", "agenda", "ai_usage", "sync"];
// Settings that never leave the server at all: they hold a secret.
const SECRET_KEYS = ["ical_token", "drive", "gmail", "agenda", "ai_usage"];
const UPLOAD_MIME = ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
const MAX_UPLOAD = 25 * 1024 * 1024, MAX_JSON = 3 * 1024 * 1024;

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "same-origin");
  // Scripts only from this site and no inline script: text that slipped through unescaped
  // somewhere in a page still cannot run.
  if (!c.res.headers.has("Content-Security-Policy")) c.header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; frame-src 'self' https://drive.google.com https://docs.google.com; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
});

// Pages and data travel compressed; a live stream and files already compressed do not.
const zip = compress();
app.use("*", (c, next) => (c.req.path === "/api/events" || c.req.path.startsWith("/api/files") ? next() : zip(c, next)));

app.get("/healthz", async (c) => { await sql`select 1`; return c.text("ok"); });

/* ---------- The estate's stays as a calendar other sites can read (Airbnb, Booking) ---------- */
// No sign-in here: those sites cannot sign in. The link carries a long secret instead, and the
// calendar says only "Réservé" with the dates, never a name.
async function icalToken(): Promise<string> {
  const [row] = await sql`select value from settings where key = 'ical_token'`;
  if (row) return String(row.value);
  const token = randomBytes(24).toString("base64url");
  await sql`insert into settings (key, value) values ('ical_token', ${sql.json(token)}) on conflict (key) do nothing`;
  return icalToken();
}
app.get("/ical/:file", async (c) => {
  const given = c.req.param("file").replace(/\.ics$/, "");
  if (given.length < 20 || given !== (await icalToken())) return c.text("introuvable", 404);
  const rows = await sql`select id, doc->>'start' as start, doc->>'end' as end from deals where (doc->>'stage')::int >= 2 and coalesce(doc->>'status', '') <> 'Perdu'`;
  const day = (iso: string, plus = 0) => { const d = new Date(Date.parse(iso) + plus * 86400000); return d.toISOString().slice(0, 10).replace(/-/g, ""); };
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  // DTEND is exclusive in iCal: the departure day stays blocked, as on the estate's own planning.
  const events = rows.filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.start ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(r.end ?? "")).map((r) => `BEGIN:VEVENT\r\nUID:${r.id}@domaine\r\nDTSTAMP:${stamp}\r\nDTSTART;VALUE=DATE:${day(r.start)}\r\nDTEND;VALUE=DATE:${day(r.end, 1)}\r\nSUMMARY:Réservé\r\nEND:VEVENT`);
  return c.body(["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Le Domaine//FR", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n") + "\r\n", 200, { "content-type": "text/calendar; charset=utf-8", "cache-control": "no-store" });
});

/* ---------- Followed messages: the open (an image) and the click (a redirect) ---------- */
// Reached by the recipient's mail service, so without sign-in. The image is always answered the same,
// whether the token exists or not; a link leads only to the address the app kept when sending.
app.get("/t/:file", async (c) => {
  const token = /^([A-Za-z0-9_-]{22})\.gif$/.exec(c.req.param("file"))?.[1] ?? "";
  if (TRACK_TOKEN.test(token)) await sql`update mail_tracks set opens = opens + 1, first_open = coalesce(first_open, now()), last_open = now() where token = ${token}`.catch(() => null);
  return c.body(PIXEL, 200, { "content-type": "image/gif", "cache-control": "no-store, private", "content-length": String(PIXEL.length) });
});
app.get("/t/:token/:n", async (c) => {
  const token = c.req.param("token"), n = Number(c.req.param("n"));
  if (!TRACK_TOKEN.test(token) || !Number.isInteger(n) || n < 0 || n > 40) return c.text("Lien introuvable", 404);
  const [row] = await sql`update mail_tracks set clicks = clicks + 1, last_click = now() where token = ${token} and jsonb_array_length(links) > ${n} returning links->>${n} as url`;
  if (!row || !/^https?:\/\//i.test(row.url ?? "")) return c.text("Lien introuvable", 404);
  return c.redirect(row.url, 302);
});

/* ---------- Sign-in ---------- */
const deny = (reason: string) => new Response(null, { status: 302, headers: { location: `/#connexion?refus=${encodeURIComponent(reason)}` } });
app.get("/auth/google", (c) => {
  if (!config.googleId) return deny("connexion Google non configurée");
  const state = randomBytes(16).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: config.googleId, redirect_uri: `${config.baseUrl}/auth/callback`, response_type: "code", scope: "openid email profile", state, prompt: "select_account" }).toString();
  c.header("Set-Cookie", cookie("oauth_state", state, 600));
  // A setup code given in the link rides along in a short-lived cookie until Google answers.
  const setup = c.req.query("setup") ?? "";
  if (/^[A-Za-z0-9_-]{20,100}$/.test(setup)) c.header("Set-Cookie", cookie("setup", setup, 600), { append: true });
  return c.redirect(url.toString());
});
app.get("/auth/callback", async (c) => {
  const state = c.req.query("state") ?? "", code = c.req.query("code") ?? "";
  if (!state || !code || state !== readCookie(c.req.header("cookie"), "oauth_state")) return deny("connexion interrompue, recommencez");
  if (state.startsWith("drive.")) return driveConnected(c.req.header("cookie"), code);
  if (state.startsWith("gmail.")) return mailConnected(c.req.header("cookie"), code);
  if (state.startsWith("agenda.")) return calConnected(c.req.header("cookie"), code);
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", signal: AbortSignal.timeout(10_000),
    body: new URLSearchParams({ code, client_id: config.googleId, client_secret: config.googleSecret, redirect_uri: `${config.baseUrl}/auth/callback`, grant_type: "authorization_code" }) });
  const who = res.ok ? readIdToken(((await res.json()) as { id_token?: string }).id_token ?? "", config.googleId, Date.now()) : null;
  if (!who) return deny("Google n'a pas confirmé votre identité");
  const [invited] = await sql`select role from users where email = ${who.email}`;
  let access: Access = decideAccess(who.email, who.verified, config.allowed, invited ? (invited.role as Role) : null);
  if (!access.ok && who.verified) {
    const [{ n }] = await sql`select count(*)::int as n from users where role = 'admin'`;
    if (mayBootstrap(readCookie(c.req.header("cookie"), "setup"), config.setupHash, n)) { access = { ok: true, role: "admin" }; console.warn("first administrator created with the setup code"); }
  }
  if (!access.ok) { console.warn(`sign-in refused: ${access.reason}`); return deny(access.reason); }
  return new Response(null, { status: 302, headers: [["location", "/"], ["set-cookie", await signIn(who.email, who.name, access.role)], ["set-cookie", cookie("oauth_state", "", 0)], ["set-cookie", cookie("setup", "", 0)]] });
});
/* ---------- Google Drive: an administrator lets the app create documents in their Drive ---------- */
const driveSetting = async (): Promise<DriveSetting | null> => { const [row] = await sql`select value from settings where key = 'drive'`; return row && driveSeen(row.value, "admin").on ? (row.value as DriveSetting) : null; };
const backTo = (note: string) => new Response(null, { status: 302, headers: [["location", `/?drive=${note}#reglages`], ["set-cookie", cookie("oauth_state", "", 0)]] });
app.get("/auth/drive", async (c) => {
  const u = await userFromCookie(c.req.header("cookie"));
  if (!u || u.role !== "admin") return deny("réservé aux administrateurs");
  if (!config.googleId) return backTo("refus");
  const state = "drive." + randomBytes(16).toString("base64url");
  c.header("Set-Cookie", cookie("oauth_state", state, 600));
  return c.redirect(driveAuthUrl(config.googleId, config.baseUrl, state));
});
async function driveConnected(cookies: string | undefined, code: string): Promise<Response> {
  const u = await userFromCookie(cookies);
  if (!u || u.role !== "admin") return deny("réservé aux administrateurs");
  const got = await exchangeCode(code, config.googleId, config.googleSecret, config.baseUrl);
  const who = got ? readIdToken(got.idToken, config.googleId, Date.now()) : null;
  if (!got || !who) return backTo("refus");
  try {
    // The same account connecting again keeps its folder: the documents already created stay reachable.
    const before = await driveSetting();
    const folder = before && before.email === who.email ? before.folder : await createFolder(got.access, "Les jardins de Campagne");
    const same = before && before.email === who.email ? before : null;
    const value: DriveSetting = { refresh: got.refresh, email: who.email, folder, full: true, ...(same?.prospects ? { prospects: same.prospects } : {}), ...(same?.clients ? { clients: same.clients } : {}) };
    await sql`insert into settings (key, value) values ('drive', ${sql.json(value as never)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
    forgetToken(); await sql.notify(CHANNEL, JSON.stringify({ kind: "setting", key: "drive", client: "" }));
    return backTo("ok");
  } catch (e) { console.error("drive connection failed", e); return backTo("refus"); }
}
/* ---------- Gmail: an administrator lets the app read and answer the estate's mailbox ---------- */
const mailSetting = async (): Promise<MailSetting | null> => { const [row] = await sql`select value from settings where key = 'gmail'`; return row && mailSeen(row.value, "admin").on ? (row.value as MailSetting) : null; };
const backMail = (note: string) => new Response(null, { status: 302, headers: [["location", `/?gmail=${note}#reglages`], ["set-cookie", cookie("oauth_state", "", 0)]] });
app.get("/auth/gmail", async (c) => {
  const u = await userFromCookie(c.req.header("cookie"));
  if (!u || u.role !== "admin") return deny("réservé aux administrateurs");
  if (!config.googleId) return backMail("refus");
  const state = "gmail." + randomBytes(16).toString("base64url");
  c.header("Set-Cookie", cookie("oauth_state", state, 600));
  return c.redirect(mailAuthUrl(config.googleId, config.baseUrl, state));
});
async function mailConnected(cookies: string | undefined, code: string): Promise<Response> {
  const u = await userFromCookie(cookies);
  if (!u || u.role !== "admin") return deny("réservé aux administrateurs");
  const got = await exchangeCode(code, config.googleId, config.googleSecret, config.baseUrl, MAIL_SCOPES);
  const who = got ? readIdToken(got.idToken, config.googleId, Date.now()) : null;
  if (!got || !who) return backMail("refus");
  const value: MailSetting = { refresh: got.refresh, email: who.email };
  await sql`insert into settings (key, value) values ('gmail', ${sql.json(value as never)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
  forgetToken(); await sql.notify(CHANNEL, JSON.stringify({ kind: "setting", key: "gmail", client: "" }));
  return backMail("ok");
}
/* ---------- Google Agenda: an administrator lets the app write the visits in the estate's calendar ---------- */
const calSetting = async (): Promise<CalSetting | null> => { const [row] = await sql`select value from settings where key = 'agenda'`; return row && calSeen(row.value, "admin").on ? (row.value as CalSetting) : null; };
const backCal = (note: string) => new Response(null, { status: 302, headers: [["location", `/?agenda=${note}#reglages`], ["set-cookie", cookie("oauth_state", "", 0)]] });
app.get("/auth/agenda", async (c) => {
  const u = await userFromCookie(c.req.header("cookie"));
  if (!u || u.role !== "admin") return deny("réservé aux administrateurs");
  if (!config.googleId) return backCal("refus");
  const state = "agenda." + randomBytes(16).toString("base64url");
  c.header("Set-Cookie", cookie("oauth_state", state, 600));
  return c.redirect(calAuthUrl(config.googleId, config.baseUrl, state));
});
async function calConnected(cookies: string | undefined, code: string): Promise<Response> {
  const u = await userFromCookie(cookies);
  if (!u || u.role !== "admin") return deny("réservé aux administrateurs");
  const got = await exchangeCode(code, config.googleId, config.googleSecret, config.baseUrl, [CAL_SCOPE]);
  const who = got ? readIdToken(got.idToken, config.googleId, Date.now()) : null;
  if (!got || !who) return backCal("refus");
  const value: CalSetting = { refresh: got.refresh, email: who.email };
  await sql`insert into settings (key, value) values ('agenda', ${sql.json(value as never)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
  forgetToken(); await sql.notify(CHANNEL, JSON.stringify({ kind: "setting", key: "agenda", client: "" }));
  return backCal("ok");
}
if (config.devLogin) app.get("/auth/dev", async (c) => {
  const email = (c.req.query("email") ?? "dev@localhost").toLowerCase(), role = c.req.query("role") === "team" ? "team" : "admin";
  return new Response(null, { status: 302, headers: [["location", "/"], ["set-cookie", await signIn(email, c.req.query("name") ?? "Dev", role)]] });
});
app.post("/auth/logout", async (c) => { c.header("Set-Cookie", await signOut(c.req.header("cookie"))); return c.json({ ok: true }); });

/* ---------- API: signed-in people only ---------- */
app.use("/api/*", async (c, next) => {
  // A request that changes something must come from this site's own pages.
  const origin = c.req.header("origin");
  if (c.req.method !== "GET" && origin && origin !== new URL(config.baseUrl).origin) return c.json({ error: "origine refusée" }, 403);
  if (Number(c.req.header("content-length") ?? 0) > MAX_UPLOAD + 1024 * 1024) return c.json({ error: "envoi trop volumineux" }, 413);
  const user = await userFromCookie(c.req.header("cookie"));
  if (!user) return c.json({ error: "non connecté" }, 401);
  c.set("user", user);
  await next();
});
const adminOnly = (u: User) => u.role === "admin";
// Handing a grant back to Google ends everything that account allowed this app, its other connections
// included (Drive, mailbox, agenda). So it is only done when no other connection relies on the account.
async function release(key: string, grant: { refresh: string; email: string }): Promise<void> {
  const others = await sql`select value->>'email' as email from settings where key in ('drive', 'gmail', 'agenda') and key <> ${key}`;
  if (!others.some((o) => o.email === grant.email)) await revoke(grant.refresh);
}
const notify = (c: { req: { header: (k: string) => string | undefined } }, event: Record<string, unknown>) =>
  sql.notify(CHANNEL, JSON.stringify({ ...event, client: c.req.header("x-client") ?? "" }));
const readJson = async (c: { req: { text: () => Promise<string> } }): Promise<Record<string, unknown> | null> => {
  const text = await c.req.text();
  if (text.length > MAX_JSON) return null;
  try { const v = JSON.parse(text); return v && typeof v === "object" ? v : null; } catch { return null; }
};
const dealOut = (row: { id: string; doc: Doc; version: number }, role: Role) => ({ ...forRole(row.doc, role), id: row.id, _v: row.version });

// Which version of the pages is being served: it changes whenever one of their files does. A page left
// open compares it with the one it started from, so that nobody keeps working in yesterday's version.
const PAGE_FILES = ["index.html", "app.js", "contract.js", "invoices.js", "app.css"];
async function buildId(): Promise<string> {
  const parts = await Promise.all(PAGE_FILES.map((f) => stat(join("web", f)).then((i) => `${f}:${i.size}:${Math.round(i.mtimeMs)}`, () => `${f}:-`)));
  return hashToken(parts.join("|")).slice(0, 16);
}
app.get("/api/build", async (c) => { c.header("Cache-Control", "no-store"); return c.json({ build: await buildId() }); });
app.get("/api/state", async (c) => {
  const u = c.get("user");
  const deals = await sql`select id, doc, version from deals order by updated_at desc`;
  const settings = Object.fromEntries((await sql`select key, value from settings`).filter((r) => adminOnly(u) ? !SECRET_KEYS.includes(r.key) : !PRIVATE_KEYS.includes(r.key)).map((r) => [r.key, r.value]));
  const [drive] = await sql`select value from settings where key = 'drive'`, [gmail] = await sql`select value from settings where key = 'gmail'`, [agenda] = await sql`select value from settings where key = 'agenda'`;
  const users = adminOnly(u) ? await sql`select email, name, role, last_login is null as pending from users order by created_at` : [];
  const admin = adminOnly(u) ? { icalUrl: `${config.baseUrl}/ical/${await icalToken()}.ics`, lastBackup: await lastBackup() } : null;
  return c.json({ user: { email: u.email, name: u.name, role: u.role }, deals: deals.map((r) => dealOut(r as never, u.role)), settings, users, admin, drive: driveSeen(drive ? drive.value : null, u.role), mail: mailSeen(gmail ? gmail.value : null, u.role), agenda: calSeen(agenda ? agenda.value : null, u.role), ai: Boolean(config.aiKey) && config.aiDailyMax > 0, build: await buildId() });
});
app.get("/api/deals/:id", async (c) => {
  const [row] = await sql`select id, doc, version from deals where id = ${c.req.param("id")}`;
  return row ? c.json(dealOut(row as never, c.get("user").role)) : c.json({ error: "introuvable" }, 404);
});
app.post("/api/deals", async (c) => {
  const body = await readJson(c), doc = body?.doc as Doc | undefined, id = String(doc?.id ?? "");
  if (!doc || !DEAL_ID.test(id)) return c.json({ error: "affaire invalide" }, 400);
  const u = c.get("user");
  const [row] = await sql`insert into deals (id, doc, updated_by) values (${id}, ${sql.json(mergeForSave(doc, null, u.role) as never)}, ${u.id}) on conflict (id) do nothing returning version`;
  if (!row) return c.json({ error: "cette affaire existe déjà" }, 409);
  await notify(c, { kind: "deal", id, version: row.version });
  return c.json({ version: row.version });
});
app.put("/api/deals/:id", async (c) => {
  const id = c.req.param("id"), body = await readJson(c), doc = body?.doc as Doc | undefined, version = Number(body?.version);
  if (!doc || !Number.isInteger(version)) return c.json({ error: "affaire invalide" }, 400);
  const u = c.get("user");
  const out = await sql.begin(async (tx) => {
    const [cur] = await tx`select doc, version from deals where id = ${id} for update`;
    if (!cur) return { status: 404 as const };
    // Someone else saved in between: hand back what is stored instead of overwriting it.
    if (cur.version !== version) return { status: 409 as const, deal: dealOut({ id, doc: cur.doc, version: cur.version }, u.role) };
    const [row] = await tx`update deals set doc = ${tx.json(mergeForSave({ ...doc, id }, cur.doc, u.role) as never)}, version = version + 1, updated_at = now(), updated_by = ${u.id} where id = ${id} returning version`;
    return { status: 200 as const, version: row.version as number };
  });
  if (out.status === 404) return c.json({ error: "introuvable" }, 404);
  if (out.status === 409) return c.json({ error: "modifiée ailleurs", deal: out.deal }, 409);
  await notify(c, { kind: "deal", id, version: out.version });
  return c.json({ version: out.version });
});
app.delete("/api/deals/:id", async (c) => {
  if (!adminOnly(c.get("user"))) return c.json({ error: "réservé aux administrateurs" }, 403);
  await sql`delete from deals where id = ${c.req.param("id")}`;
  await notify(c, { kind: "deal", id: c.req.param("id"), deleted: true });
  return c.json({ ok: true });
});

app.put("/api/settings/:key", async (c) => {
  const key = c.req.param("key"), body = await readJson(c), u = c.get("user");
  if (!body || !("value" in body) || ![...SHARED_KEYS, ...ADMIN_KEYS].includes(key)) return c.json({ error: "réglage invalide" }, 400);
  if (ADMIN_KEYS.includes(key) && !adminOnly(u)) return c.json({ error: "réservé aux administrateurs" }, 403);
  await sql`insert into settings (key, value) values (${key}, ${sql.json(body.value as never)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
  await notify(c, { kind: "setting", key });
  return c.json({ ok: true });
});
app.get("/api/settings/:key", async (c) => {
  if (SECRET_KEYS.includes(c.req.param("key")) || (PRIVATE_KEYS.includes(c.req.param("key")) && !adminOnly(c.get("user")))) return c.json({ error: "réservé aux administrateurs" }, 403);
  const [row] = await sql`select value from settings where key = ${c.req.param("key")}`;
  return c.json({ value: row ? row.value : null });
});

/* People: the list an administrator keeps. Administrators named in ALLOWED_EMAILS cannot be removed here. */
app.put("/api/users", async (c) => {
  const u = c.get("user"), body = await readJson(c), list = Array.isArray(body?.users) ? (body.users as Array<Record<string, unknown>>) : null;
  if (!adminOnly(u)) return c.json({ error: "réservé aux administrateurs" }, 403);
  if (!list) return c.json({ error: "liste invalide" }, 400);
  const wanted = list.map((x) => ({ email: String(x.email ?? "").trim().toLowerCase(), name: String(x.name ?? ""), role: x.role === "admin" ? "admin" : "team" })).filter((x) => /^\S+@\S+\.\S+$/.test(x.email));
  await sql.begin(async (tx) => {
    for (const x of wanted) await tx`insert into users (email, name, role) values (${x.email}, ${x.name}, ${x.role}) on conflict (email) do update set role = case when users.email = any(${config.allowed}) then 'admin' else excluded.role end`;
    await tx`delete from users where email <> all(${[...wanted.map((x) => x.email), u.email, ...config.allowed]})`;
  });
  await notify(c, { kind: "users" });
  return c.json({ ok: true });
});

/* ---------- Files ---------- */
app.post("/api/files", async (c) => {
  const form = await c.req.parseBody(), file = form.file, u = c.get("user");
  if (!(file instanceof File)) return c.json({ error: "aucun fichier reçu" }, 400);
  if (file.size > MAX_UPLOAD) return c.json({ error: "fichier trop volumineux (25 Mo au maximum)" }, 413);
  if (!UPLOAD_MIME.includes(file.type)) return c.json({ error: "type de fichier non accepté (PDF, image, Word, Excel, texte)" }, 415);
  const name = file.name.replace(/[\u0000-\u001f\\/]/g, "").slice(0, 200) || "fichier";
  const [row] = await sql`insert into files (deal_id, name, mime, size, created_by) values (${typeof form.deal === "string" && DEAL_ID.test(form.deal) ? form.deal : null}, ${name}, ${file.type}, ${file.size}, ${u.id}) returning id`;
  await mkdir(join(config.dataDir, "files"), { recursive: true });
  await writeFile(join(config.dataDir, "files", row.id), Buffer.from(await file.arrayBuffer()));
  return c.json({ id: row.id, name, mime: file.type, size: file.size });
});
app.get("/api/files/:id", async (c) => {
  const id = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/.test(id)) return c.json({ error: "introuvable" }, 404);
  const [row] = await sql`select name, mime, admin_only from files where id = ${id}`;
  if (!row || (row.admin_only && !adminOnly(c.get("user")))) return c.json({ error: "introuvable" }, 404);
  const path = join(config.dataDir, "files", id), info = await stat(path).catch(() => null);
  if (!info) return c.json({ error: "introuvable" }, 404);
  // Shown in the page only for the kinds a browser displays without running anything.
  const inline = row.mime === "application/pdf" || row.mime.startsWith("image/");
  return new Response(Readable.toWeb(createReadStream(path)) as ReadableStream, { headers: {
    "content-type": row.mime, "content-length": String(info.size), "cache-control": "private, max-age=3600",
    "content-disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(row.name)}`,
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'" } });
});

/* ---------- Imported calendars ---------- */
async function syncFeeds(): Promise<{ feeds: Stay[]; errors: string[] }> {
  const [row] = await sql`select value from settings where key = 'prefs'`;
  const prefs = (row?.value ?? {}) as { sources?: Source[] }, sources = prefs.sources ?? [], feeds: Stay[] = [], errors: string[] = [];
  const [old] = await sql`select value from settings where key = 'feeds'`;
  for (const s of sources) {
    try { feeds.push(...(await fetchIcal(s, AbortSignal.timeout(15_000)))); s.last = new Date().toISOString(); }
    catch (e) { errors.push(`${s.kind}, ${s.name} : ${e instanceof Error ? e.message : "erreur"}`); feeds.push(...(((old?.value ?? []) as Stay[]).filter((f) => f.src === s.id))); }
  }
  await sql`insert into settings (key, value) values ('feeds', ${sql.json(feeds as never)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
  await sql`update settings set value = ${sql.json({ ...prefs, sources } as never)} where key = 'prefs'`;
  await sql.notify(CHANNEL, JSON.stringify({ kind: "setting", key: "feeds", client: "" }));
  return { feeds, errors };
}
app.post("/api/feeds/sync", async (c) => c.json(await syncFeeds()));

/* ---------- Google Drive: one folder per stay, and the documents created in it ---------- */
// "Prospects" and "Clients" are made the first time they are needed. One request at a time does it,
// so two people clicking together do not end up with two folders of the same name.
let makingPlaces: Promise<DriveSetting> | null = null;
function withPlaces(drive: DriveSetting, token: string): Promise<DriveSetting> {
  if (drive.prospects && drive.clients) return Promise.resolve(drive);
  makingPlaces ??= (async () => {
    const value: DriveSetting = { ...drive, prospects: drive.prospects ?? await createFolder(token, "Prospects", drive.folder), clients: drive.clients ?? await createFolder(token, "Clients", drive.folder) };
    await sql`update settings set value = ${sql.json(value as never)}, updated_at = now() where key = 'drive'`;
    return value;
  })().finally(() => { makingPlaces = null; });
  return makingPlaces;
}
/**
 * The folder of one stay, where it belongs: in "Clients" once signed, in "Prospects" before. A known
 * folder is renamed or moved when needed; one that was deleted in Drive is made again.
 */
async function dealFolder(token: string, drive: DriveSetting, given: string, name: string, client: boolean, fixed = false): Promise<string> {
  // A folder the estate already kept for the stay is used as it is: never renamed, never moved.
  if (fixed && DRIVE_ID.test(given) && (await readFolder(token, given))) return given;
  const places = await withPlaces(drive, token), want = (client ? places.clients : places.prospects) as string;
  const known = DRIVE_ID.test(given) ? await readFolder(token, given) : null;
  if (!known) return createFolder(token, name, want);
  const query = moveQuery(known.parents, want);
  if (query || known.name !== name) await updateFolder(token, given, name, query);
  return given;
}
const driveFailure = (c: { json: (body: unknown, status: 409 | 502) => Response }, e: unknown): Response => {
  if (e instanceof DriveError && e.status === 401) { forgetToken(); return c.json({ error: "Google Drive n'est plus connecté : reconnectez-le dans les réglages" }, 409); }
  console.error("drive call failed", e); return c.json({ error: "Google Drive ne répond pas, réessayez" }, 502);
};
const folderAsk = (body: Record<string, unknown> | null) => ({ dealId: String(body?.dealId ?? ""), given: String(body?.folder ?? ""), name: folderName(String(body?.name ?? "")), client: body?.client === true, fixed: body?.fixed === true });
app.post("/api/drive/folder", async (c) => {
  const ask = folderAsk(await readJson(c));
  if (!DEAL_ID.test(ask.dealId)) return c.json({ error: "affaire invalide" }, 400);
  const drive = await driveSetting();
  if (!drive) return c.json({ error: "Google Drive n'est pas connecté" }, 409);
  try {
    const token = await accessToken(drive.refresh, config.googleId, config.googleSecret);
    return c.json({ folder: await dealFolder(token, drive, ask.given, ask.name, ask.client, ask.fixed) });
  } catch (e) { return driveFailure(c as never, e); }
});
app.post("/api/drive/docs", async (c) => {
  const body = await readJson(c), ask = folderAsk(body), title = String(body?.title ?? "").trim().slice(0, 120), html = String(body?.html ?? "");
  if (!DEAL_ID.test(ask.dealId) || !title || !html || html.length > 300_000) return c.json({ error: "document invalide" }, 400);
  const drive = await driveSetting();
  if (!drive) return c.json({ error: "Google Drive n'est pas connecté" }, 409);
  try {
    const token = await accessToken(drive.refresh, config.googleId, config.googleSecret);
    const folder = await dealFolder(token, drive, ask.given, ask.name, ask.client, ask.fixed);
    const made = await createDoc(token, title, docHtml(title, html), folder);
    return c.json({ id: made.id, stamp: made.stamp, url: `https://docs.google.com/document/d/${made.id}/edit`, folder });
  } catch (e) { return driveFailure(c as never, e); }
});
// A draft follows its deal: when the deal changes, the page is written again, unless someone has
// typed in the document since. `force` is the person saying "overwrite my edits".
app.post("/api/drive/docs/refresh", async (c) => {
  const body = await readJson(c), id = String(body?.id ?? ""), title = String(body?.title ?? "").trim().slice(0, 120), html = String(body?.html ?? ""), stamp = String(body?.stamp ?? "");
  if (!DRIVE_ID.test(id) || !title || !html || html.length > 300_000) return c.json({ error: "document invalide" }, 400);
  const drive = await driveSetting();
  if (!drive) return c.json({ error: "Google Drive n'est pas connecté" }, 409);
  try {
    const token = await accessToken(drive.refresh, config.googleId, config.googleSecret), now = await readStamp(token, id);
    if (now === null) return c.json({ gone: true });
    if (body?.force !== true && editedSince(stamp, now)) return c.json({ edited: true });
    return c.json({ stamp: await writeDoc(token, id, docHtml(title, html)) });
  } catch (e) { return driveFailure(c as never, e); }
});
// Out of the draft state (sent for signature, signed), a document must not change any more: Drive
// itself then refuses edits, whoever opens it. Back to draft lifts the lock.
app.post("/api/drive/docs/lock", async (c) => {
  const body = await readJson(c), id = String(body?.id ?? "");
  if (!DRIVE_ID.test(id) || typeof body?.locked !== "boolean") return c.json({ error: "document invalide" }, 400);
  const drive = await driveSetting();
  if (!drive) return c.json({ error: "Google Drive n'est pas connecté" }, 409);
  try {
    await lockDoc(await accessToken(drive.refresh, config.googleId, config.googleSecret), id, body.locked, String(body?.reason ?? ""));
    return c.json({ ok: true });
  } catch (e) { return driveFailure(c as never, e); }
});
app.delete("/api/drive", async (c) => {
  if (!adminOnly(c.get("user"))) return c.json({ error: "réservé aux administrateurs" }, 403);
  const drive = await driveSetting();
  if (drive) await release("drive", drive);
  await sql`delete from settings where key = 'drive'`; forgetToken();
  await notify(c, { kind: "setting", key: "drive" });
  return c.json({ ok: true });
});

/* ---------- Gmail: the conversations of a deal, and answers sent from the app ---------- */
// The page names a deal, never an address: the server takes the addresses from the deal itself, so a
// page cannot be used to read or write to anyone else in the mailbox.
const mailFailure = (c: { json: (body: unknown, status: 409 | 502) => Response }, e: unknown): Response => {
  if ((e instanceof DriveError || e instanceof MailError) && e.status === 401) { forgetToken(); return c.json({ error: "La boîte Gmail n'est plus connectée : reconnectez-la dans les réglages" }, 409); }
  if (e instanceof MailError && e.status === 403) return c.json({ error: "Gmail refuse l'accès : vérifiez que « Gmail API » est activée dans le projet Google Cloud" }, 409);
  console.error("gmail call failed", e); return c.json({ error: "Gmail ne répond pas, réessayez" }, 502);
};
const dealDoc = async (id: string): Promise<Doc | null> => { if (!DEAL_ID.test(id)) return null; const [row] = await sql`select doc from deals where id = ${id}`; return row ? (row.doc as Doc) : null; };
app.get("/api/mail", async (c) => {
  const doc = await dealDoc(c.req.query("dealId") ?? "");
  if (!doc) return c.json({ error: "affaire introuvable" }, 404);
  const box = await mailSetting();
  if (!box) return c.json({ error: "La boîte Gmail n'est pas connectée" }, 409);
  try {
    const addresses = addressesOf(doc as never);
    return c.json({ addresses, threads: await threadsFor(await accessToken(box.refresh, config.googleId, config.googleSecret), addresses, box.email) });
  } catch (e) { return mailFailure(c as never, e); }
});
// A file joined to a message of one of the deal's conversations, opened from the page.
app.get("/api/mail/attachment", async (c) => {
  const doc = await dealDoc(c.req.query("dealId") ?? ""), messageId = c.req.query("messageId") ?? "", n = Number(c.req.query("n") ?? "x");
  if (!doc || !/^[0-9a-f]{8,32}$/.test(messageId) || !Number.isInteger(n)) return c.json({ error: "pièce jointe introuvable" }, 404);
  const box = await mailSetting();
  if (!box) return c.json({ error: "La boîte Gmail n'est pas connectée" }, 409);
  try {
    const file = await readAttachment(await accessToken(box.refresh, config.googleId, config.googleSecret), messageId, n, addressesOf(doc as never), box.email);
    if (!file) return c.json({ error: "pièce jointe introuvable" }, 404);
    return new Response(new Uint8Array(file.bytes), { headers: { ...attachmentHeaders(file.name, file.type), "content-length": String(file.bytes.length) } });
  } catch (e) { return mailFailure(c as never, e); }
});
// One message, from what was asked to what Gmail receives. Used when a person sends, and again by the
// clock for a message set to leave later: every check is made at the moment it really leaves.
type Refusal = { status: 400 | 404 | 409 | 413; error: string };
const refuse = (status: Refusal["status"], error: string): Refusal => ({ status, error });
const isRefusal = (v: unknown): v is Refusal => typeof v === "object" && v !== null && "error" in v && "status" in v;
/** Who the message goes to and whether its text holds up. No call to Google. */
async function checkJob(job: Job, admin: boolean): Promise<Refusal | { doc: Doc; to: string[]; html: string; images: string[] }> {
  const doc = await dealDoc(job.dealId);
  if (!doc) return refuse(404, "affaire introuvable");
  const to = recipientsFor(doc as never, job.to), cut = inlineImages(job.html), html = cleanMailHtml(cut.html, true);
  if (!to) return refuse(400, job.to.length ? "Un destinataire n'est pas une adresse de cette affaire" : "Cette affaire n'a pas d'adresse e-mail valable");
  if (!html.replace(/<[^>]+>/g, "").trim() || html.length > 100_000 || (job.threadId && !/^[0-9a-f]{8,32}$/.test(job.threadId))) return refuse(400, "message invalide");
  if (job.files.length > 10 || cut.ids.length > 10 || [...job.files, ...cut.ids].some((id) => !/^[0-9a-f-]{36}$/.test(id))) return refuse(400, "pièce jointe invalide");
  if (job.gdocs.length > 5 || job.pages.length > 5 || job.pages.some((p) => !p.title || !p.html || p.html.length > 300_000)) return refuse(400, "document à joindre invalide");
  // Only files stored for this very deal can be joined, and the team cannot join one reserved to administrators.
  for (const id of [...job.files, ...cut.ids]) {
    const [row] = await sql`select admin_only from files where id = ${id} and deal_id = ${job.dealId}`;
    if (!row || (row.admin_only && !admin)) return refuse(400, "pièce jointe introuvable dans cette affaire");
  }
  const own = ownDriveDocs(doc as never);
  if (job.gdocs.some((id) => !own.has(id))) return refuse(400, "Ce document Google n'appartient pas à l'affaire");
  return { doc, to, html, images: cut.ids };
}
async function deliver(job: Job, by: string, admin: boolean): Promise<Refusal | { threadId: string }> {
  const ok = await checkJob(job, admin);
  if (isRefusal(ok)) return ok;
  const box = await mailSetting();
  if (!box) return refuse(409, "La boîte Gmail n'est pas connectée");
  const stored = async (id: string): Promise<OutFile | null> => { const [row] = await sql`select name, mime from files where id = ${id} and deal_id = ${job.dealId}`; const bytes = row ? await readFile(join(config.dataDir, "files", id)).catch(() => null) : null; return row && bytes ? { name: String(row.name), type: String(row.mime), bytes } : null; };
  const files: OutFile[] = [], inline: InlineFile[] = [];
  for (const id of job.files) { const f = await stored(id); if (!f) return refuse(400, "pièce jointe introuvable dans cette affaire"); files.push(f); }
  for (const id of ok.images) { const f = await stored(id); if (!f || !f.type.startsWith("image/")) return refuse(400, "image introuvable dans cette affaire"); inline.push({ ...f, cid: `${id}@domaine` }); }
  // Documents written in Google Docs, and pages made in the app, leave as PDF by way of the Drive.
  if (job.gdocs.length || job.pages.length) {
    const drive = await driveSetting();
    if (!drive) return refuse(409, "Connectez Google Drive dans les réglages pour joindre ce document en PDF");
    const dtoken = await accessToken(drive.refresh, config.googleId, config.googleSecret), own = ownDriveDocs(ok.doc as never);
    for (const id of job.gdocs) files.push({ name: pdfName(own.get(id) ?? "document"), type: "application/pdf", bytes: await exportPdf(dtoken, id) });
    for (const p of job.pages) files.push({ name: pdfName(p.title), type: "application/pdf", bytes: await pagePdf(dtoken, p.title, docHtml(p.title, p.html), drive.folder) });
  }
  if ([...files, ...inline].reduce((n, f) => n + f.bytes.length, 0) > 20 * 1024 * 1024) return refuse(413, "Les pièces jointes dépassent 20 Mo au total");
  const token = await accessToken(box.refresh, config.googleId, config.googleSecret);
  // A reply joins its thread only when that thread really is one of this deal's.
  const head = job.threadId ? await threadHead(token, job.threadId, addressesOf(ok.doc as never), box.email) : null;
  if (job.threadId && !head) return refuse(400, "Cette conversation n'appartient pas à l'affaire");
  const subject = job.subject || (head ? `Re: ${head.subject.replace(/^(re\s*:\s*)+/i, "")}` : "(sans objet)");
  // Following opens and clicks only makes sense on an address the recipient's mail service can reach.
  const track = job.track && config.secure ? newToken() : "", followed = track ? trackLinks(ok.html, config.baseUrl, track) : { html: ok.html, links: [] };
  const mime = buildMime({ from: box.email, to: ok.to.join(", "), subject, html: followed.html, files, inline, ...(track ? { pixel: `${config.baseUrl}/t/${track}.gif` } : {}), ...(head?.messageId ? { inReplyTo: head.messageId, references: head.messageId } : {}) }, "b" + randomBytes(12).toString("hex"));
  const sent = await sendMail(token, mime, head ? job.threadId : "", files.length + inline.length > 0);
  if (track) await sql`insert into mail_tracks (token, deal_id, message_id, subject, links, sent_by) values (${track}, ${job.dealId}, ${sent.id ?? ""}, ${subject}, ${sql.json(followed.links)}, ${by})`;
  console.warn(`e-mail sent for deal ${job.dealId} by ${by}`);
  return { threadId: sent.threadId };
}
const googleFailure = (c: { json: (body: unknown, status: 409 | 502) => Response }, e: unknown): Response => (e instanceof DriveError && e.status !== 401 && !(e instanceof MailError) ? driveFailure(c, e) : mailFailure(c, e));
app.post("/api/mail/send", async (c) => {
  const body = await readJson(c), job = jobOf(body), u = c.get("user");
  try {
    if (body?.at !== undefined) {
      // Set to leave later: checked now so a mistake shows at once, checked again when it leaves.
      const at = sendAtOf(body.at, Date.now());
      if (!at) return c.json({ error: "Choisissez un moment à venir, dans l'année" }, 400);
      const ok = await checkJob(job, adminOnly(u));
      if (isRefusal(ok)) return c.json({ error: ok.error }, ok.status);
      if (!(await mailSetting())) return c.json({ error: "La boîte Gmail n'est pas connectée" }, 409);
      const [{ n }] = await sql`select count(*)::int as n from mail_outbox where status = 'pending'`;
      if (n >= 200) return c.json({ error: "Trop de messages programmés : annulez-en ou attendez leur envoi" }, 409);
      const [row] = await sql`insert into mail_outbox (deal_id, job, send_at, created_by) values (${job.dealId}, ${sql.json({ ...job, admin: adminOnly(u) } as never)}, ${at}, ${u.email}) returning id`;
      await notify(c, { kind: "mail", id: job.dealId });
      return c.json({ ok: true, scheduled: row.id, at: at.toISOString() });
    }
    const out = await deliver(job, u.email, adminOnly(u));
    if (isRefusal(out)) return c.json({ error: out.error }, out.status);
    return c.json({ ok: true, threadId: out.threadId });
  } catch (e) { return googleFailure(c as never, e); }
});
// Messages waiting for their hour, and those that could not leave, for one deal.
app.get("/api/mail/outbox", async (c) => {
  const dealId = c.req.query("dealId") ?? "";
  if (!DEAL_ID.test(dealId)) return c.json({ error: "affaire introuvable" }, 404);
  const rows = await sql`select id, job->>'subject' as subject, job->'to' as "to", send_at, status, error, created_by from mail_outbox where deal_id = ${dealId} and status in ('pending', 'failed') order by send_at`;
  return c.json({ list: rows.map((r) => ({ id: r.id, subject: r.subject, to: r.to, at: r.send_at, status: r.status, error: r.error, by: r.created_by })) });
});
app.delete("/api/mail/outbox/:id", async (c) => {
  const id = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/.test(id)) return c.json({ error: "introuvable" }, 404);
  const [row] = await sql`delete from mail_outbox where id = ${id} and status in ('pending', 'failed') returning deal_id`;
  if (!row) return c.json({ error: "Ce message est déjà parti ou n'existe plus" }, 409);
  await notify(c, { kind: "mail", id: row.deal_id });
  return c.json({ ok: true });
});
// Every half minute: the messages whose hour has come leave, one after the other. A line is taken
// (status "sending") before anything is sent, so a message can never leave twice.
async function sendDue(): Promise<void> {
  const due = await sql`update mail_outbox set status = 'sending' where id in (select id from mail_outbox where status = 'pending' and send_at <= now() order by send_at limit 5 for update skip locked) returning id, deal_id, job, created_by`;
  for (const row of due) {
    const job = row.job as Job & { admin?: boolean };
    let error = "";
    try { const out = await deliver(jobOf(job as never), String(row.created_by), job.admin === true); if (isRefusal(out)) error = out.error; }
    catch (e) { console.error("scheduled e-mail failed", e); error = e instanceof Error && (e instanceof MailError || e instanceof DriveError) ? e.message : "Google ne répond pas"; }
    await sql`update mail_outbox set status = ${error ? "failed" : "sent"}, error = ${error.slice(0, 300)}, done_at = now() where id = ${row.id}`;
    await sql.notify(CHANNEL, JSON.stringify({ kind: "mail", id: row.deal_id, client: "" }));
  }
}
// What was sent with its opens and clicks followed, for one deal.
app.get("/api/mail/tracks", async (c) => {
  const dealId = c.req.query("dealId") ?? "";
  if (!DEAL_ID.test(dealId)) return c.json({ error: "affaire introuvable" }, 404);
  const rows = await sql`select message_id, subject, sent_at, opens, first_open, last_open, clicks, last_click from mail_tracks where deal_id = ${dealId} order by sent_at desc limit 100`;
  return c.json({ list: rows.map((r) => ({ messageId: r.message_id, subject: r.subject, at: r.sent_at, opens: r.opens, firstOpen: r.first_open, lastOpen: r.last_open, clicks: r.clicks, lastClick: r.last_click })) });
});
// A draft written by Claude, on request. A daily ceiling keeps what it costs known in advance.
app.post("/api/mail/draft", async (c) => {
  const body = await readJson(c), dealId = String(body?.dealId ?? ""), doc = await dealDoc(dealId), threadId = String(body?.threadId ?? ""), u = c.get("user");
  if (!doc) return c.json({ error: "affaire introuvable" }, 404);
  if (!config.aiKey || !config.aiDailyMax) return c.json({ error: "La rédaction par IA n'est pas activée sur ce serveur" }, 409);
  if (threadId && !/^[0-9a-f]{8,32}$/.test(threadId)) return c.json({ error: "conversation invalide" }, 400);
  const day = new Date().toISOString().slice(0, 10), [usage] = await sql`select value from settings where key = 'ai_usage'`, used = usage && usage.value.day === day ? Number(usage.value.n) || 0 : 0;
  if (used >= config.aiDailyMax) return c.json({ error: `Le plafond de ${config.aiDailyMax} rédactions par jour est atteint : il repart demain` }, 429);
  try {
    let turns: Array<{ mine: boolean; from: string; text: string }> = [];
    if (threadId) {
      const box = await mailSetting();
      if (!box) return c.json({ error: "La boîte Gmail n'est pas connectée" }, 409);
      const threads = await threadsFor(await accessToken(box.refresh, config.googleId, config.googleSecret), addressesOf(doc as never), box.email), thread = threads.find((t) => t.id === threadId);
      if (!thread) return c.json({ error: "Cette conversation n'appartient pas à l'affaire" }, 400);
      turns = thread.messages.map((m) => ({ mine: m.mine, from: m.from, text: plainText(m.html) }));
    }
    await sql`insert into settings (key, value) values ('ai_usage', ${sql.json({ day, n: used + 1 })}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
    const text = await draftMail(config.aiKey, config.aiModel, draftPrompt(doc as never, turns, String(body?.hint ?? ""), u.name || ""));
    return c.json({ html: draftToHtml(text), left: config.aiDailyMax - used - 1 });
  } catch (e) {
    if (e instanceof AiError) return c.json({ error: e.message }, e.status as 409);
    return mailFailure(c as never, e);
  }
});
app.delete("/api/mail", async (c) => {
  if (!adminOnly(c.get("user"))) return c.json({ error: "réservé aux administrateurs" }, 403);
  const box = await mailSetting();
  if (box) await release("gmail", box);
  await sql`delete from settings where key = 'gmail'`; forgetToken();
  await notify(c, { kind: "setting", key: "gmail" });
  return c.json({ ok: true });
});

/* ---------- Google Agenda: one event per visit ---------- */
// The page names a deal and one of its visits. The server reads the visit from the saved deal and
// derives the event's identifier itself: no other event of the calendar can be reached from a page.
const calFailure = (c: { json: (body: unknown, status: 409 | 502) => Response }, e: unknown): Response => {
  if ((e instanceof DriveError || e instanceof CalError) && e.status === 401) { forgetToken(); return c.json({ error: "Google Agenda n'est plus connecté : reconnectez-le dans les réglages" }, 409); }
  if (e instanceof CalError && e.status === 403) return c.json({ error: "Google Agenda refuse l'accès : vérifiez que « Google Calendar API » est activée dans le projet Google Cloud" }, 409);
  console.error("calendar call failed", e); return c.json({ error: "Google Agenda ne répond pas, réessayez" }, 502);
};
app.post("/api/calendar/visit", async (c) => {
  const body = await readJson(c), dealId = String(body?.dealId ?? ""), doc = await dealDoc(dealId), visit = doc ? visitOf(doc as never, String(body?.visitId ?? "")) : null;
  if (!doc || !visit) return c.json({ error: "visite introuvable" }, 404);
  const cal = await calSetting();
  if (!cal) return c.json({ error: "Google Agenda n'est pas connecté" }, 409);
  try {
    await putEvent(await accessToken(cal.refresh, config.googleId, config.googleSecret), eventId(dealId, visit.id), eventBody(visit, { ...(doc as never as { title?: unknown; contact?: never }), id: dealId }, config.baseUrl));
    return c.json({ ok: true });
  } catch (e) { return calFailure(c as never, e); }
});
app.post("/api/calendar/visit/remove", async (c) => {
  const body = await readJson(c), dealId = String(body?.dealId ?? ""), visitId = String(body?.visitId ?? "");
  if (!DEAL_ID.test(dealId) || !VISIT_ID.test(visitId)) return c.json({ error: "visite invalide" }, 400);
  const cal = await calSetting();
  if (!cal) return c.json({ error: "Google Agenda n'est pas connecté" }, 409);
  try {
    await deleteEvent(await accessToken(cal.refresh, config.googleId, config.googleSecret), eventId(dealId, visitId));
    return c.json({ ok: true });
  } catch (e) { return calFailure(c as never, e); }
});
app.delete("/api/calendar", async (c) => {
  if (!adminOnly(c.get("user"))) return c.json({ error: "réservé aux administrateurs" }, 403);
  const cal = await calSetting();
  if (cal) await release("agenda", cal);
  await sql`delete from settings where key = 'agenda'`; forgetToken();
  await notify(c, { kind: "setting", key: "agenda" });
  return c.json({ ok: true });
});

/* ---------- Synchronisation: every hour, the deals are brought in line with Drive, Gmail and the agenda ---------- */
// One pass, three subjects, each on its own: a connection that fails does not stop the others. A deal is
// changed through patchDeal, which gives way if someone saved it in the meantime (the next pass will
// take it again). Nothing is deleted on either side: what has gone is marked, for a person to decide.
type Part = { state: "off" | "ok" | "err"; note: string };
const off = (note: string): Part => ({ state: "off", note }), plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
async function patchDeal(id: string, change: (doc: Doc) => Doc | null, tries = 3): Promise<boolean> {
  // Someone saving the deal at the same moment makes the write miss: it is tried again on what they saved.
  for (let n = 0; n < tries; n++) {
    const [row] = await sql`select doc, version from deals where id = ${id}`;
    const next = row ? change(row.doc as Doc) : null;
    if (!row || !next) return false;
    const done = await sql`update deals set doc = ${sql.json(next as never)}, version = version + 1 where id = ${id} and version = ${row.version} returning version`;
    if (!done.length) continue;
    await sql.notify(CHANNEL, JSON.stringify({ kind: "deal", id, version: done[0].version, client: "" }));
    return true;
  }
  return false;
}
type Loose = Record<string, unknown>;
async function syncDrive(ids: string[]): Promise<Part> {
  const drive = await driveSetting();
  if (!drive) return off("Non connecté");
  if (!drive.full) return off("Connecté avant la synchronisation : reconnectez Google Drive pour autoriser la lecture des dossiers");
  let token = "";
  try { token = await accessToken(drive.refresh, config.googleId, config.googleSecret); } catch { return { state: "err", note: "Google Drive n'est plus connecté : reconnectez-le" }; }
  let read = 0, added = 0, renamed = 0, pushed = 0, lost = 0;
  for (const id of ids) {
    const doc = (await dealDoc(id)) as (Doc & Loose) | null, folder = doc ? (DRIVE_ID.test(String(doc.driveFolder ?? "")) ? String(doc.driveFolder) : driveIdOf(doc.folderUrl)) : "";
    if (!doc || !folder) continue;
    try {
      const files = await listTree(token, folder); read++;
      // Files dropped in the app go to the folder too, once: one already there under the same name is taken
      // as the copy. Those reserved to administrators stay in the app.
      const copies = new Map<string, string>();
      for (const x of (Array.isArray(doc.docs) ? doc.docs : []) as DocLine[]) {
        if (typeof x.fileId !== "string" || x.gid || x.admin === true || !/^[0-9a-f-]{36}$/.test(x.fileId)) continue;
        const [row] = await sql`select name, mime from files where id = ${x.fileId} and deal_id = ${id}`, twin = row ? files.find((f) => f.name === String(row.name)) : undefined;
        if (twin) { copies.set(x.fileId, twin.id); continue; }
        const bytes = row ? await readFile(join(config.dataDir, "files", x.fileId)).catch(() => null) : null;
        if (row && bytes) { copies.set(x.fileId, await uploadTo(token, String(row.name), String(row.mime), bytes, folder)); pushed++; }
      }
      let seen = { added: 0, renamed: 0 };
      await patchDeal(id, (cur) => {
        const mine = ((Array.isArray(cur.docs) ? cur.docs : []) as DocLine[]).map((x) => (typeof x.fileId === "string" && copies.has(x.fileId) && !x.gid ? { ...x, gid: copies.get(x.fileId) } : x));
        const plan = planDocs(mine, files), adopt = !DRIVE_ID.test(String((cur as Loose).driveFolder ?? ""));
        seen = { added: plan.added, renamed: plan.renamed };
        return plan.changed || copies.size || adopt ? ({ ...cur, docs: plan.docs, ...(adopt ? { driveFolder: folder, drivePlace: "ext" } : {}) } as Doc) : null;
      });
      added += seen.added; renamed += seen.renamed;
    } catch (e) {
      if (e instanceof DriveError && e.status === 401) { forgetToken(); return { state: "err", note: "Google Drive n'est plus connecté : reconnectez-le" }; }
      if (!(e instanceof DriveError)) console.error("drive sync failed for a deal", e);
      lost++;
    }
  }
  return { state: lost && !read ? "err" : "ok", note: `${plural(read, "dossier lu", "dossiers lus")}, ${plural(added, "document ajouté", "documents ajoutés")}, ${plural(renamed, "renommé", "renommés")}, ${plural(pushed, "fichier envoyé vers Drive", "fichiers envoyés vers Drive")}${lost ? `, ${plural(lost, "dossier inaccessible", "dossiers inaccessibles")} avec ce compte` : ""}` };
}
async function syncMail(ids: string[]): Promise<Part> {
  const box = await mailSetting();
  if (!box) return off("Non connectée");
  let token = "";
  try { token = await accessToken(box.refresh, config.googleId, config.googleSecret); } catch { return { state: "err", note: "La boîte Gmail n'est plus connectée : reconnectez-la" }; }
  // Stays ended more than four months ago keep what was last read: their mail no longer moves.
  const since = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
  let read = 0, waiting = 0;
  for (const id of ids) {
    const doc = (await dealDoc(id)) as (Doc & Loose) | null, addresses = doc ? addressesOf(doc as never) : [];
    if (!doc || !addresses.length || doc.status === "Perdu" || (typeof doc.end === "string" && doc.end && doc.end < since)) continue;
    try {
      const sum = mailSummary(await threadsMeta(token, addresses, box.email)); read++; if (sum.waiting) waiting++;
      await patchDeal(id, (cur) => { const { asOf: _asOf, ...before } = ((cur as Loose).mails ?? {}) as Loose; return JSON.stringify(before) === JSON.stringify(sum) ? null : ({ ...cur, mails: { ...sum, asOf: new Date().toISOString() } } as Doc); });
    } catch (e) {
      if ((e instanceof MailError || e instanceof DriveError) && e.status === 401) { forgetToken(); return { state: "err", note: "La boîte Gmail n'est plus connectée : reconnectez-la" }; }
      if (e instanceof MailError && e.status === 403) return { state: "err", note: "Gmail refuse l'accès : vérifiez que « Gmail API » est activée" };
      console.error("mail sync failed for a deal", e);
    }
  }
  return { state: "ok", note: `${plural(read, "affaire relue", "affaires relues")}, ${waiting ? plural(waiting, "client attend une réponse", "clients attendent une réponse") : "aucun client en attente de réponse"}` };
}
async function syncVisits(ids: string[]): Promise<Part> {
  const cal = await calSetting();
  if (!cal) return off("Non connecté");
  let token = "";
  try { token = await accessToken(cal.refresh, config.googleId, config.googleSecret); } catch { return { state: "err", note: "Google Agenda n'est plus connecté : reconnectez-le" }; }
  const today = new Date().toISOString().slice(0, 10);
  let read = 0, moved = 0, gone = 0;
  for (const id of ids) {
    const doc = (await dealDoc(id)) as (Doc & Loose) | null, visits = (doc && Array.isArray(doc.visits) ? doc.visits : []) as Array<Loose>;
    // Only visits to come that the app did write in the agenda: one never sent has no event to compare with.
    const due = visits.filter((v) => typeof v.id === "string" && typeof v.sent === "string" && v.sent && !v.gone && String(v.date ?? "") >= today);
    if (!doc || !due.length) continue;
    try {
      const changes = new Map<string, ReturnType<typeof visitFromEvent>>();
      for (const v of due) { const known = visitOf(doc as never, String(v.id)); if (!known) continue; read++; const now = visitFromEvent(known, await readEvent(token, eventId(id, known.id))); if (now) changes.set(known.id, now); }
      if (!changes.size) continue;
      for (const c of changes.values()) if (c && "gone" in c) gone++; else moved++;
      await patchDeal(id, (cur) => ({ ...cur, visits: ((Array.isArray((cur as Loose).visits) ? (cur as Loose).visits : []) as Loose[]).map((v) => { const c = changes.get(String(v.id)); return c ? { ...v, ...c } : v; }) } as Doc));
    } catch (e) {
      if ((e instanceof CalError || e instanceof DriveError) && e.status === 401) { forgetToken(); return { state: "err", note: "Google Agenda n'est plus connecté : reconnectez-le" }; }
      if (e instanceof CalError && e.status === 403) return { state: "err", note: "Google Agenda refuse l'accès : vérifiez que « Google Calendar API » est activée" };
      console.error("agenda sync failed for a deal", e);
    }
  }
  return { state: "ok", note: `${plural(read, "visite vérifiée", "visites vérifiées")}, ${plural(moved, "déplacée dans l'agenda", "déplacées dans l'agenda")}, ${plural(gone, "retirée de l'agenda", "retirées de l'agenda")}` };
}
let syncing = false;
async function syncAll(): Promise<void> {
  if (syncing) return; syncing = true;
  try {
    const ids = (await sql`select id from deals order by updated_at desc`).map((r) => String(r.id));
    const report = { at: new Date().toISOString(), drive: await syncDrive(ids), gmail: await syncMail(ids), agenda: await syncVisits(ids) };
    await sql`insert into settings (key, value) values ('sync', ${sql.json(report)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
    await sql.notify(CHANNEL, JSON.stringify({ kind: "setting", key: "sync", client: "" }));
  } finally { syncing = false; }
}
// A person asks for a pass now. It runs behind: the page is told when it is done, like any other change.
app.post("/api/sync", (c) => {
  if (!adminOnly(c.get("user"))) return c.json({ error: "réservé aux administrateurs" }, 403);
  const already = syncing;
  if (!already) syncAll().catch((e) => console.error("synchronisation failed", e));
  return c.json({ ok: true, running: true, already });
});

/* ---------- Backup: everything the app holds, as one file ---------- */
// Uploaded files are listed, not embedded: they live on their own volume.
async function snapshot(): Promise<string> {
  const [users, deals, settings, files] = await Promise.all([sql`select email, name, role, created_at from users`, sql`select id, doc, version, updated_at from deals`, sql`select key, value from settings where key not in ('drive', 'gmail', 'agenda', 'ai_usage', 'sync')`, sql`select id, deal_id, name, mime, size, created_at from files`]);
  return JSON.stringify({ format: "domaine-backup-1", at: new Date().toISOString(), users, deals, settings, files });
}
const backupDir = join(config.dataDir, "backups");
async function lastBackup(): Promise<string> { const names = (await readdir(backupDir).catch(() => [])).filter((n) => n.endsWith(".json.gz")).sort(); return names.length ? names[names.length - 1].slice(8, 18) : ""; }
// One file per day, the last 30 kept. Run at start and every six hours, so a day is never missed.
async function dailyBackup(): Promise<void> {
  await mkdir(backupDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  if ((await lastBackup()) !== today) await writeFile(join(backupDir, `domaine-${today}.json.gz`), gzipSync(await snapshot()));
  const names = (await readdir(backupDir)).filter((n) => n.endsWith(".json.gz")).sort();
  for (const old of names.slice(0, Math.max(0, names.length - 30))) await unlink(join(backupDir, old));
}
app.get("/api/backup", async (c) => {
  if (!adminOnly(c.get("user"))) return c.json({ error: "réservé aux administrateurs" }, 403);
  return c.body(await snapshot(), 200, { "content-type": "application/json", "content-disposition": `attachment; filename="domaine-${new Date().toISOString().slice(0, 10)}.json"`, "cache-control": "no-store" });
});

/* ---------- Live updates: one listener on the database, fanned out to every open page ---------- */
const pages = new Set<(data: string) => void>();
app.get("/api/events", (c) => streamSSE(c, async (stream) => {
  const send = (data: string) => { stream.writeSSE({ data }).catch(() => pages.delete(send)); };
  pages.add(send);
  stream.onAbort(() => { pages.delete(send); });
  while (!stream.aborted && !stream.closed) { await stream.sleep(25_000); await stream.writeSSE({ event: "ping", data: "" }).catch(() => {}); }
  pages.delete(send);
}));

// Pages are revalidated at each visit and re-sent only when they changed; fonts never change.
app.use("/fonts/*", async (c, next) => { await next(); c.header("Cache-Control", "public, max-age=31536000, immutable"); });
app.use("/*", etag(), serveStatic({ root: "./web", onFound: (path, c) => { if (!path.includes("/fonts/")) c.header("Cache-Control", "no-cache"); } }));

await migrate();
await mkdir(join(config.dataDir, "files"), { recursive: true });
await sql.listen(CHANNEL, (payload) => { for (const send of pages) send(payload); });
setInterval(() => { syncFeeds().catch((e) => console.error("calendar sync failed", e)); }, 30 * 60 * 1000).unref();
const backup = () => { dailyBackup().catch((e) => console.error("backup failed", e)); };
backup(); setInterval(backup, 6 * 60 * 60 * 1000).unref();
setInterval(() => { sendDue().catch((e) => console.error("scheduled e-mails failed", e)); }, 30 * 1000).unref();
const hourly = () => { syncAll().catch((e) => console.error("synchronisation failed", e)); };
setTimeout(hourly, 90 * 1000).unref(); setInterval(hourly, 60 * 60 * 1000).unref();
serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" }, (info) => console.warn(`domaine listening on :${info.port} (${config.baseUrl})`));
