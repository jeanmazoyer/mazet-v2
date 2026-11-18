/**
 * scripts/import-bank.ts
 *
 * Imports the bank's statement export (CSV) so the app can match payments with it. Reads the
 * file on standard input: bank data never has to live in the repository.
 *
 *   pnpm tsx scripts/import-bank.ts < transactions.csv
 *   pnpm tsx scripts/import-bank.ts --as admin@example.com < transactions.csv
 *
 * Written in the name of an administrator: the one given with --as, otherwise the oldest active
 * one. Re-runnable: lines already stored are recognised and skipped, so a newer export that
 * overlaps an older one only adds what is new.
 */

import { and, asc, eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { importBankTransactions } from "../src/features/bank/bankImport";
import { parseStatementCsv } from "../src/features/bank/statementCsv";
import { hydrateActor } from "../src/server/hydrateActor";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<number> {
  const signal = new AbortController().signal;
  const asIndex = process.argv.indexOf("--as");
  const email = asIndex === -1 ? undefined : process.argv[asIndex + 1];

  const parsed = parseStatementCsv(await readStdin());
  if (!parsed.ok) {
    console.error(`statement not imported: ${parsed.error}`);
    return 1;
  }

  const isAdmin = and(eq(users.isAdmin, true), eq(users.isActive, true));
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(email === undefined ? isAdmin : and(isAdmin, eq(users.email, email)))
    .orderBy(asc(users.createdAt))
    .limit(1);
  const actor = row === undefined ? null : await hydrateActor(db, row.id, signal);
  if (actor === null) {
    console.error("no active administrator found: sign in once first, or check --as");
    return 1;
  }

  const result = await importBankTransactions(db, actor, parsed.value, signal);
  if (!result.ok) {
    console.error(`statement not imported: ${result.error.id} ${result.error.message}`);
    console.error(JSON.stringify(result.error.context ?? {}));
    return 1;
  }
  // Counts only: a label could carry a client's name into a log.
  console.warn(
    `statement imported: ${result.value.added} new line(s), ${result.value.alreadyKnown} already known`,
  );
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
