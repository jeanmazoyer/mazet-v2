import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import type { TestProject } from "vitest/node";

// One Postgres container for the ENTIRE test run. We migrate a single template database
// once here; each test then clones it via CREATE DATABASE ... TEMPLATE (~15ms) instead of
// starting its own container and re-running every migration (~1.5s). Real Postgres, real
// migrations, real per-test isolation are all preserved (see CLAUDE.md: never mock the DB).
//
// The connection parts are handed to worker processes via Vitest's provide/inject channel;
// makeTestDb() (src/test/db.ts) reads them to clone and drop per-test databases.

const MIGRATIONS_FOLDER = fileURLToPath(new URL("./drizzle", import.meta.url));
const MIGRATIONS_JOURNAL = fileURLToPath(new URL("./drizzle/meta/_journal.json", import.meta.url));

export const TEMPLATE_DB = "wd_template";

export interface TestPgConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  // The container's default database, used for admin DDL (CREATE/DROP DATABASE) since those
  // cannot run while connected to the database being created/dropped.
  adminDatabase: string;
  template: string;
}

// Typed provide/inject channel.
declare module "vitest" {
  interface ProvidedContext {
    testPg: TestPgConnection;
  }
}

let container: StartedPostgreSqlContainer | undefined;

// Optional escape hatch for machines without a container runtime: point TEST_PG_URL at an
// existing Postgres (a role that may CREATE DATABASE) and the integration lane uses it instead
// of starting a Testcontainers instance. Same real Postgres, same migrations, same per-test
// clones; only the server's lifecycle differs. Lower --maxWorkers if the server's
// max_connections is small (the container is started with 300).
async function setupOnExistingServer(
  project: TestProject,
  url: string,
): Promise<() => Promise<void>> {
  const parsed = new URL(url);
  const adminDatabase = parsed.pathname.replace(/^\//, "") || "postgres";
  const base = {
    host: parsed.hostname,
    port: Number(parsed.port || "5432"),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };

  const adminPool = new Pool({ ...base, database: adminDatabase, max: 2 });
  await adminPool.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB}`);
  await adminPool.query(`CREATE DATABASE ${TEMPLATE_DB}`);

  const templatePool = new Pool({ ...base, database: TEMPLATE_DB, max: 2 });
  const templateDb = drizzle(templatePool);
  await templateDb.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await templateDb.execute(sql`CREATE EXTENSION IF NOT EXISTS citext`);
  if (existsSync(MIGRATIONS_JOURNAL)) {
    await migrate(templateDb, { migrationsFolder: MIGRATIONS_FOLDER });
  }
  await templatePool.end();

  project.provide("testPg", { ...base, adminDatabase, template: TEMPLATE_DB });

  return async () => {
    await adminPool.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB}`);
    await adminPool.end();
  };
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  // eslint-disable-next-line no-restricted-properties -- test harness wiring, outside the app's env boundary
  const existingServer = process.env.TEST_PG_URL;
  if (existingServer !== undefined && existingServer.length > 0) {
    return setupOnExistingServer(project, existingServer);
  }

  // fsync/full_page_writes off is safe for a disposable test DB and meaningfully faster.
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withCommand([
      "postgres",
      "-c",
      "max_connections=300",
      "-c",
      "fsync=off",
      "-c",
      "full_page_writes=off",
    ])
    .start();

  const adminDatabase = container.getDatabase();
  const base = {
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getPassword(),
  };

  // Create the template database from the admin connection.
  const adminPool = new Pool({ ...base, database: adminDatabase, max: 2 });
  await adminPool.query(`CREATE DATABASE ${TEMPLATE_DB}`);
  await adminPool.end();

  // Enable required extensions, then apply real migrations, on the template only.
  const templatePool = new Pool({ ...base, database: TEMPLATE_DB, max: 2 });
  const templateDb = drizzle(templatePool);
  await templateDb.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await templateDb.execute(sql`CREATE EXTENSION IF NOT EXISTS citext`);
  if (existsSync(MIGRATIONS_JOURNAL)) {
    await migrate(templateDb, { migrationsFolder: MIGRATIONS_FOLDER });
  }
  // MUST disconnect: CREATE DATABASE ... TEMPLATE fails if any session is attached to the template.
  await templatePool.end();

  project.provide("testPg", { ...base, adminDatabase, template: TEMPLATE_DB });

  return async () => {
    await container?.stop();
  };
}
