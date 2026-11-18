// Looks at the bank statement for a deal's payments. A payment still owed is settled when the
// statement shows it; a payment a person had already marked received is confirmed by the
// statement line that proves it. The matching rule lives in bankMatch.ts and never guesses.
import { and, count, eq, gt, inArray, isNull, ne, notInArray, sql } from "drizzle-orm";
import { AppError } from "@/constants/errorIds";
import type { Db } from "@/db/client";
import { bankTransactions } from "@/db/schema/bankTransactions";
import { contractParties } from "@/db/schema/contractData";
import { paymentLines } from "@/db/schema/paymentLines";
import { persons } from "@/db/schema/persons";
import { recordChange } from "@/features/collaboration/changeLog";
import { loadEditableDeal } from "@/features/deals/dealAuth";
import { recordPayment } from "@/features/payments/paymentRepo";
import { MAX_PAYMENT_REFERENCE_LENGTH } from "@/features/payments/paymentRules";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import { nameTokens, pickTransaction } from "./bankMatch";

export interface BankSyncResult {
  // Payments that were owed and are now settled by a statement line.
  matched: number;
  // Payments already marked received, now backed by a statement line.
  confirmed: number;
  // Income payments still owed after the run.
  stillOwed: number;
  // How many statement lines the app holds at all: zero means nothing was imported yet.
  transactionsOnFile: number;
}

type Line = typeof paymentLines.$inferSelect;
type Transaction = typeof bankTransactions.$inferSelect;

async function tenantNames(tx: DbOrTx, dealId: string, personId: string | null): Promise<string[]> {
  const parties = await tx
    .select({ name: contractParties.fullName })
    .from(contractParties)
    .where(eq(contractParties.dealId, dealId));
  const contact =
    personId === null
      ? []
      : await tx.select({ name: persons.name }).from(persons).where(eq(persons.id, personId));
  return [...parties, ...contact].map((row) => row.name);
}

// Statement lines of the right amounts that no payment, on any deal, has claimed yet.
async function freeTransactions(tx: DbOrTx, amounts: number[]): Promise<Transaction[]> {
  if (amounts.length === 0) return [];
  const claimed = tx
    .select({ id: paymentLines.bankTransactionId })
    .from(paymentLines)
    .where(sql`${paymentLines.bankTransactionId} IS NOT NULL`);
  return tx
    .select()
    .from(bankTransactions)
    .where(
      and(
        inArray(bankTransactions.amountCents, amounts),
        gt(bankTransactions.amountCents, 0),
        notInArray(bankTransactions.id, claimed),
      ),
    );
}

async function link(
  tx: DbOrTx,
  actor: PermSetUser,
  line: Line,
  transaction: Transaction,
  signal: AbortSignal,
): Promise<Result<true, AppError>> {
  const reference = transaction.label.slice(0, MAX_PAYMENT_REFERENCE_LENGTH);
  if (line.status === "due") {
    const settlement = { paidOn: transaction.bookedOn, reference };
    const paid = await recordPayment(tx, actor, line.dealId, line.id, settlement, signal);
    if (!paid.ok) return err(paid.error);
  }
  await tx
    .update(paymentLines)
    // A payment marked received by hand keeps the day the person gave; the statement's wording
    // is added as its proof only when it had none.
    .set({ bankTransactionId: transaction.id, reference: line.reference ?? reference })
    .where(eq(paymentLines.id, line.id));
  await recordChange(
    tx,
    {
      entityType: "deal",
      entityId: line.dealId,
      field: `payment:${line.id}:bank`,
      oldValue: null,
      newValue: { bookedOn: transaction.bookedOn, label: reference },
      actorId: actor.id,
    },
    signal,
  );
  return ok(true);
}

export async function syncDealWithBank(
  db: Db,
  actor: PermSetUser,
  dealId: string,
  signal: AbortSignal,
): Promise<Result<BankSyncResult, AppError>> {
  const editable = await loadEditableDeal(db, actor, dealId, signal);
  if (!editable.ok) return err(editable.error);
  const personId = editable.value.deal.personId;

  try {
    return ok(
      await db.transaction(async (tx) => {
        const lines = await tx
          .select()
          .from(paymentLines)
          .where(
            and(
              eq(paymentLines.dealId, dealId),
              // A caution is a card imprint: there is no statement line to look for.
              ne(paymentLines.kind, "hold"),
              isNull(paymentLines.bankTransactionId),
              inArray(paymentLines.status, ["due", "paid"]),
            ),
          )
          .orderBy(paymentLines.dueOn, paymentLines.createdAt)
          .for("update");
        const tokens = nameTokens(await tenantNames(tx, dealId, personId));
        let free = await freeTransactions(tx, [...new Set(lines.map((l) => l.amountCents))]);
        signal.throwIfAborted();

        let matched = 0;
        let confirmed = 0;
        for (const line of lines) {
          const found = pickTransaction(line.amountCents, free, tokens);
          if (found === null) continue;
          const linked = await link(tx, actor, line, found, signal);
          if (!linked.ok) throw linked.error;
          free = free.filter((transaction) => transaction.id !== found.id);
          if (line.status === "due") matched += 1;
          else confirmed += 1;
        }

        const owed = lines.filter((line) => line.status === "due").length - matched;
        const [onFile] = await tx.select({ total: count() }).from(bankTransactions);
        return { matched, confirmed, stillOwed: owed, transactionsOnFile: onFile?.total ?? 0 };
      }),
    );
  } catch (error) {
    if (error instanceof AppError) return err(error);
    throw error;
  }
}
