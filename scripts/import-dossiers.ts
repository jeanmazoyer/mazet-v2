/**
 * scripts/import-dossiers.ts
 *
 * Imports signed files (a contract and what goes with it) as complete deals. Reads a JSON array
 * of files on standard input, in the shape of src/features/dossier-import/dossierSchema.ts, so
 * the client data never has to live in the repository:
 *
 *   pnpm tsx scripts/import-dossiers.ts < dossiers.json
 *   pnpm tsx scripts/import-dossiers.ts --as admin@example.com < dossiers.json
 *
 * The files are written in the name of an administrator: the one given with --as, otherwise the
 * oldest active one. Re-runnable: a file already imported is skipped. One failing file does not
 * stop the others, and the exit code is non-zero when any failed.
 */

import { and, asc, eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { importDossier } from "../src/features/dossier-import/importDossier";
import { hydrateActor } from "../src/server/hydrateActor";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function adminId(email: string | undefined, signal: AbortSignal): Promise<string | null> {
  const isAdmin = and(eq(users.isAdmin, true), eq(users.isActive, true));
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(email === undefined ? isAdmin : and(isAdmin, eq(users.email, email)))
    .orderBy(asc(users.createdAt))
    .limit(1);
  signal.throwIfAborted();
  return row?.id ?? null;
}

async function main(): Promise<number> {
  const signal = new AbortController().signal;
  const asIndex = process.argv.indexOf("--as");
  const email = asIndex === -1 ? undefined : process.argv[asIndex + 1];

  const parsed: unknown = JSON.parse(await readStdin());
  const dossiers: unknown[] = Array.isArray(parsed) ? parsed : [parsed];

  const userId = await adminId(email, signal);
  const actor = userId === null ? null : await hydrateActor(db, userId, signal);
  if (actor === null) {
    console.error("no active administrator found: sign in once first, or check --as");
    return 1;
  }

  let failed = 0;
  for (const [index, dossier] of dossiers.entries()) {
    // The position only: a title or an id could carry a client's name into a log.
    const label = `file ${index + 1}/${dossiers.length}`;
    const result = await importDossier(db, actor, dossier, signal);
    if (!result.ok) {
      failed += 1;
      console.error(`${label}: FAILED ${result.error.id} ${result.error.message}`);
      console.error(JSON.stringify(result.error.context ?? {}));
    } else if (result.value.created) {
      console.warn(`${label}: imported, deal ${result.value.dealId}`);
    } else {
      console.warn(`${label}: already imported, deal ${result.value.dealId}`);
    }
  }
  return failed === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
