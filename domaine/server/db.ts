import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";
import { config } from "./config.ts";

// Everything lives in its own schema, so the app can share a database server (and even a
// database) with something else without their tables meeting.
export const sql = postgres(config.databaseUrl, { max: 10, connection: { search_path: config.schema }, onnotice: () => {} });

export async function migrate(): Promise<void> {
  await sql.unsafe(`create schema if not exists "${config.schema}"`);
  await sql`create table if not exists migrations (name text primary key, applied_at timestamptz not null default now())`;
  const dir = new URL("./migrations/", import.meta.url);
  for (const name of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    const [done] = await sql`select 1 from migrations where name = ${name}`;
    if (done) continue;
    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(new URL(name, dir), "utf8"));
      await tx`insert into migrations (name) values (${name})`;
    });
    console.warn(`migration applied: ${name}`);
  }
}
