// Reads the bank's statement export (CSV with Date, Description and Amount columns, days written
// DD/MM/YYYY) into the rows importBankTransactions takes. All or nothing: one unreadable line
// refuses the whole file, since a statement imported in part would silently miss payments.
import { parseCsv } from "@/features/import/csvParse";
import { err, ok, type Result } from "@/types/result";

export interface StatementRow {
  bookedOn: string;
  label: string;
  amountCents: number;
  account: string | null;
}

const COLUMNS = { day: "Date", label: "Description", amount: "Amount", account: "Bank Account" };
const DAY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const AMOUNT = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;

// Cents are assembled from the digits, never by multiplying a float: 1234.56 * 100 is not 123456.
function toCents(text: string): number | null {
  const match = AMOUNT.exec(text.trim());
  if (match === null) return null;
  const [, sign, units, decimals = ""] = match;
  const cents = Number(units) * 100 + Number(decimals.padEnd(2, "0"));
  return sign === "-" ? -cents : cents;
}

export function parseStatementCsv(text: string): Result<StatementRow[], string> {
  const { headers, rows } = parseCsv(text);
  for (const column of [COLUMNS.day, COLUMNS.label, COLUMNS.amount]) {
    if (!headers.includes(column)) return err(`missing column "${column}"`);
  }
  const out: StatementRow[] = [];
  for (const [index, row] of rows.entries()) {
    // The header is line 1, so the first data row is line 2.
    const line = index + 2;
    const day = DAY.exec(row[COLUMNS.day] ?? "");
    const amountCents = toCents(row[COLUMNS.amount] ?? "");
    const label = (row[COLUMNS.label] ?? "").trim();
    if (day === null) return err(`line ${line}: the date is not written DD/MM/YYYY`);
    if (amountCents === null) return err(`line ${line}: the amount is not a number`);
    if (label === "") return err(`line ${line}: the description is empty`);
    const account = (row[COLUMNS.account] ?? "").trim();
    out.push({
      bookedOn: `${day[3]}-${day[2]}-${day[1]}`,
      label,
      amountCents,
      account: account === "" ? null : account,
    });
  }
  return ok(out);
}
