// Stores the lines of a bank statement. The source is a statement export today and the bank's
// API later: either way the lines arrive here in the same shape, and a line already stored is
// recognised, so importing an overlapping statement never doubles the money.
import { createHash } from "node:crypto";
import { z } from "zod";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { bankTransactions } from "@/db/schema/bankTransactions";
import type { PermSetUser } from "@/features/permissions/effective";
import { isIsoDay } from "@/features/reservations/reservationRules";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";

const MAX_LABEL_LENGTH = 500;
// Statements are inserted in slices so one large import stays under the driver's parameter cap.
const INSERT_CHUNK = 500;

const bankRowSchema = z.object({
  bookedOn: z.string().refine(isIsoDay, "must be a real day written YYYY-MM-DD"),
  label: z.string().trim().min(1).max(MAX_LABEL_LENGTH),
  // Integer cents; positive is money coming in, negative money going out.
  amountCents: z.number().int(),
  account: z.string().trim().max(200).nullable().default(null),
});
export const bankStatementSchema = z.array(bankRowSchema).max(50_000);
export type BankRow = z.infer<typeof bankRowSchema>;

export interface BankImportResult {
  added: number;
  alreadyKnown: number;
}

// A statement has no line ids, so a line is identified by what it says. Two identical lines on
// the same day are two real payments: the position among its twins is part of the identity.
function externalKeys(rows: readonly BankRow[]): string[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const base = `${row.bookedOn}|${row.amountCents}|${row.label}`;
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    return createHash("sha256").update(`${base}|${occurrence}`).digest("hex");
  });
}

export async function importBankTransactions(
  db: DbOrTx,
  actor: PermSetUser,
  raw: unknown,
  signal: AbortSignal,
): Promise<Result<BankImportResult, AppError>> {
  if (actor.type !== "admin") {
    return err(
      new AppError(ERROR_IDS.PERM_DENIED, "Only an administrator can import a bank statement", {
        userId: actor.id,
      }),
    );
  }
  const parsed = bankStatementSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      new AppError(ERROR_IDS.BANK_IMPORT_INVALID, "The bank statement is malformed", {
        issues: parsed.error.issues
          .slice(0, 10)
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      }),
    );
  }
  const rows = parsed.data;
  const keys = externalKeys(rows);
  let added = 0;
  for (let start = 0; start < rows.length; start += INSERT_CHUNK) {
    const slice = rows.slice(start, start + INSERT_CHUNK).map((row, index) => ({
      ...row,
      externalKey: keys[start + index] ?? "",
    }));
    const inserted = await db
      .insert(bankTransactions)
      .values(slice)
      .onConflictDoNothing({ target: bankTransactions.externalKey })
      .returning({ id: bankTransactions.id });
    signal.throwIfAborted();
    added += inserted.length;
  }
  return ok({ added, alreadyKnown: rows.length - added });
}
