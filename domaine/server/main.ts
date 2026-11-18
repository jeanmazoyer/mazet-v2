import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { cookie, decideAccess, readCookie, readIdToken, signIn, signOut, userFromCookie, type Role, type User } from "./auth.ts";
import { config } from "./config.ts";
import { migrate, sql } from "./db.ts";
import { DEAL_ID, forRole, mergeForSave, stored, type Doc } from "./deals.ts";
import { fetchIcal, type Source, type Stay } from "./ical.ts";

const app = new Hono<{ Variables: { user: User } }>();
const CHANNEL = "domaine_changes";
// Settings anyone signed in may write, and those only an administrator may.
const SHARED_KEYS = ["library", "bank", "feeds", "agents"], ADMIN_KEYS = ["prefs"];
const UPLOAD_MIME = ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
const MAX_UPLOAD = 25 * 1024 * 1024, MAX_JSON = 3 * 1024 * 1024;

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "same-origin");
  // Scripts only from this site and no inline script: text that slipped through unescaped
  // somewhere in a page still cannot run.
  if (!c.res.headers.has("Content-Security-Policy")) c.header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; frame-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
});

app.get("/healthz", async (c) => { await sql`select 1`; return c.text("ok"); });

/* ---------- Sign-in ---------- */
const deny = (reason: string) => new Response(null, { status: 302, headers: { location: `/#connexion?refus=${encodeURIComponent(reason)}` } });
app.get("/auth/google", (c) => {
  if (!config.googleId) return deny("connexion Google non configurée");
  const state = randomBytes(16).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: config.googleId, redirect_uri: `${config.baseUrl}/auth/callback`, response_type: "code", scope: "openid email profile", state, prompt: "select_account" }).toString();
  c.header("Set-Cookie", cookie("oauth_state", state, 600));
  return c.redirect(url.toString());
});
app.get("/auth/callback", async (c) => {
  const state = c.req.query("state") ?? "", code = c.req.query("code") ?? "";
  if (!state || !code || state !== readCookie(c.req.header("cookie"), "oauth_state")) return deny("connexion interrompue, recommencez");
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", signal: AbortSignal.timeout(10_000),
    body: new URLSearchParams({ code, client_id: config.googleId, client_secret: config.googleSecret, redirect_uri: `${config.baseUrl}/auth/callback`, grant_type: "authorization_code" }) });
  const who = res.ok ? readIdToken(((await res.json()) as { id_token?: string }).id_token ?? "", config.googleId, Date.now()) : null;
  if (!who) return deny("Google n'a pas confirmé votre identité");
  const [invited] = await sql`select role from users where email = ${who.email}`;
  const access = decideAccess(who.email, who.verified, config.allowed, invited ? (invited.role as Role) : null);
  if (!access.ok) { console.warn(`sign-in refused: ${access.reason}`); return deny(access.reason); }
  return new Response(null, { status: 302, headers: [["location", "/"], ["set-cookie", await signIn(who.email, who.name, access.role)], ["set-cookie", cookie("oauth_state", "", 0)]] });
});
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
const notify = (c: { req: { header: (k: string) => string | undefined } }, event: Record<string, unknown>) =>
  sql.notify(CHANNEL, JSON.stringify({ ...event, client: c.req.header("x-client") ?? "" }));
const readJson = async (c: { req: { text: () => Promise<string> } }): Promise<Record<string, unknown> | null> => {
  const text = await c.req.text();
  if (text.length > MAX_JSON) return null;
  try { const v = JSON.parse(text); return v && typeof v === "object" ? v : null; } catch { return null; }
};
const dealOut = (row: { id: string; doc: Doc; version: number }, role: Role) => ({ ...forRole(row.doc, role), id: row.id, _v: row.version });

app.get("/api/state", async (c) => {
  const u = c.get("user");
  const deals = await sql`select id, doc, version from deals order by updated_at desc`;
  const settings = Object.fromEntries((await sql`select key, value from settings`).map((r) => [r.key, r.value]));
  const users = adminOnly(u) ? await sql`select email, name, role, last_login is null as pending from users order by created_at` : [];
  return c.json({ user: { email: u.email, name: u.name, role: u.role }, deals: deals.map((r) => dealOut(r as never, u.role)), settings, users });
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

/* ---------- Live updates: one listener on the database, fanned out to every open page ---------- */
const pages = new Set<(data: string) => void>();
app.get("/api/events", (c) => streamSSE(c, async (stream) => {
  const send = (data: string) => { stream.writeSSE({ data }).catch(() => pages.delete(send)); };
  pages.add(send);
  stream.onAbort(() => { pages.delete(send); });
  while (!stream.aborted && !stream.closed) { await stream.sleep(25_000); await stream.writeSSE({ event: "ping", data: "" }).catch(() => {}); }
  pages.delete(send);
}));

app.use("/*", serveStatic({ root: "./web", onFound: (_path, c) => { c.header("Cache-Control", "no-cache"); } }));

await migrate();
await mkdir(join(config.dataDir, "files"), { recursive: true });
await sql.listen(CHANNEL, (payload) => { for (const send of pages) send(payload); });
setInterval(() => { syncFeeds().catch((e) => console.error("calendar sync failed", e)); }, 30 * 60 * 1000).unref();
serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" }, (info) => console.warn(`domaine listening on :${info.port} (${config.baseUrl})`));
