// Puts a backup file back into an EMPTY database (same schema). Run by hand, never by the app:
//   node server/restore.ts domaine-2027-01-31.json        (a .json.gz from the backups folder works too)
// It refuses to run when deals already exist, unless --replace is given, which wipes them first.
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { migrate, sql } from "./db.ts";

const [file, flag] = process.argv.slice(2);
if (!file) { console.error("usage: node server/restore.ts <backup file> [--replace]"); process.exit(2); }
const raw = readFileSync(file), data = JSON.parse((file.endsWith(".gz") ? gunzipSync(raw) : raw).toString("utf8"));
if (data.format !== "domaine-backup-1") { console.error("not a backup of this app"); process.exit(2); }
await migrate();
const [{ n }] = await sql`select count(*)::int as n from deals`;
if (n > 0 && flag !== "--replace") { console.error(`the database already holds ${n} deals: add --replace to wipe them and restore`); process.exit(1); }
await sql.begin(async (tx) => {
  await tx`delete from deals`; await tx`delete from settings`; await tx`delete from files`;
  for (const u of data.users) await tx`insert into users (email, name, role) values (${u.email}, ${u.name}, ${u.role}) on conflict (email) do update set role = excluded.role, name = excluded.name`;
  for (const d of data.deals) await tx`insert into deals (id, doc, version) values (${d.id}, ${tx.json(d.doc)}, ${d.version})`;
  for (const s of data.settings) await tx`insert into settings (key, value) values (${s.key}, ${tx.json(s.value)})`;
  for (const f of data.files) await tx`insert into files (id, deal_id, name, mime, size) values (${f.id}, ${f.deal_id}, ${f.name}, ${f.mime}, ${f.size})`;
});
console.warn(`restored: ${data.deals.length} deals, ${data.settings.length} settings, ${data.users.length} people, ${data.files.length} file records (from ${data.at})`);
await sql.end();
