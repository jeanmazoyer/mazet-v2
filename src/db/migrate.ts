import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// Applique les migrations sur la base pointée par DATABASE_URL.
export async function runMigrations(connectionString: string) {
  const pool = new Pool({ connectionString, max: 1 });
  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "src/db/migrations") });
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.endsWith("migrate.ts")) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant");
  runMigrations(url).then(() => console.log("Migrations appliquées."));
}
