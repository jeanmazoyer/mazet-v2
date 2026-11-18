import { createHash, randomBytes } from "node:crypto";
import { config } from "./config.ts";
import { sql } from "./db.ts";

export type Role = "admin" | "team";
export type User = { id: string; email: string; name: string; role: Role };
export type Access = { ok: true; role: Role } | { ok: false; reason: string };

const SESSION_DAYS = 30;
export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

/** Who gets in: a verified Google address that is an administrator's or has been invited. */
export function decideAccess(email: string, verified: boolean, admins: string[], invited: Role | null): Access {
  if (!verified) return { ok: false, reason: "adresse Google non vérifiée" };
  if (admins.includes(email.toLowerCase())) return { ok: true, role: "admin" };
  if (invited) return { ok: true, role: invited };
  return { ok: false, reason: "adresse non invitée" };
}

/** What Google says about the person, read from the ID token its token endpoint returned. */
export function readIdToken(idToken: string, clientId: string, now: number): { email: string; verified: boolean; name: string } | null {
  try {
    const p = JSON.parse(Buffer.from(idToken.split(".")[1] ?? "", "base64url").toString("utf8"));
    const issuerOk = p.iss === "https://accounts.google.com" || p.iss === "accounts.google.com";
    if (!issuerOk || p.aud !== clientId || typeof p.email !== "string" || !(Number(p.exp) * 1000 > now)) return null;
    return { email: p.email.toLowerCase(), verified: p.email_verified === true || p.email_verified === "true", name: typeof p.name === "string" ? p.name : "" };
  } catch {
    return null;
  }
}

export function cookie(name: string, value: string, maxAgeSeconds: number): string {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${config.secure ? "; Secure" : ""}`;
}
export function readCookie(header: string | undefined, name: string): string {
  const hit = (header ?? "").split(";").map((s) => s.trim()).find((s) => s.startsWith(name + "="));
  return hit ? hit.slice(name.length + 1) : "";
}

/** Creates or updates the person, opens a session, and returns the cookie that carries it. */
export async function signIn(email: string, name: string, role: Role): Promise<string> {
  const [user] = await sql`
    insert into users (email, name, role, last_login) values (${email}, ${name}, ${role}, now())
    on conflict (email) do update set last_login = now(), name = case when excluded.name <> '' then excluded.name else users.name end,
      role = case when ${role} = 'admin' then 'admin' else users.role end
    returning id`;
  const token = randomBytes(32).toString("base64url");
  await sql`insert into sessions (token_hash, user_id, expires_at) values (${hashToken(token)}, ${user.id}, now() + ${SESSION_DAYS + " days"}::interval)`;
  await sql`delete from sessions where expires_at < now()`;
  return cookie("sid", token, SESSION_DAYS * 86400);
}

export async function userFromCookie(header: string | undefined): Promise<User | null> {
  const token = readCookie(header, "sid");
  if (!token) return null;
  const [u] = await sql`select u.id, u.email, u.name, u.role from sessions s join users u on u.id = s.user_id where s.token_hash = ${hashToken(token)} and s.expires_at > now()`;
  return u ? { id: u.id, email: u.email, name: u.name, role: u.role } : null;
}

export async function signOut(header: string | undefined): Promise<string> {
  const token = readCookie(header, "sid");
  if (token) await sql`delete from sessions where token_hash = ${hashToken(token)}`;
  return cookie("sid", "", 0);
}
