import { describe, expect, it } from "vitest";
import { parseStatementCsv } from "./statementCsv";

// Données entièrement fictives, au format de l'export bancaire.
const CSV = [
  "Date,Description,Type,Amount,Category,Bank Account,Notes,Document",
  '"17/11/2026","SEPA PRELEVEMENT OUTIL","Prélèvement","-15.95","Outils SaaS","COMPTE COURANT","",""',
  '"30/03/2026","VIR INST MARTIN-DURAND A + B, MARIAGE","","6300","Solde clients","COMPTE COURANT","",""',
  '"16/11/2026","CARTE 138,00EUR","Carte","-138","Fournitures","COMPTE COURANT","",""',
].join("\n");

describe("bank statement export: reading the file", () => {
  it("turns each line into a day, a label and an amount in cents", () => {
    const parsed = parseStatementCsv(CSV);
    expect(parsed.ok && parsed.value).toEqual([
      {
        bookedOn: "2026-11-17",
        label: "SEPA PRELEVEMENT OUTIL",
        amountCents: -1595,
        account: "COMPTE COURANT",
      },
      {
        bookedOn: "2026-03-30",
        label: "VIR INST MARTIN-DURAND A + B, MARIAGE",
        amountCents: 630_000,
        account: "COMPTE COURANT",
      },
      {
        bookedOn: "2026-11-16",
        label: "CARTE 138,00EUR",
        amountCents: -13_800,
        account: "COMPTE COURANT",
      },
    ]);
  });

  it("does not lose a cent to floating point", () => {
    const one = 'Date,Description,Amount\n"01/02/2026","X","1234.56"\n"01/02/2026","Y","0.07"';
    const parsed = parseStatementCsv(one);
    expect(parsed.ok && parsed.value.map((row) => row.amountCents)).toEqual([123_456, 7]);
  });

  it("says which line is wrong instead of importing half a statement", () => {
    const bad = 'Date,Description,Amount\n"01/02/2026","X","12"\n"2026-02-01","Y","abc"';
    const parsed = parseStatementCsv(bad);
    expect(!parsed.ok && parsed.error).toMatch(/line 3/);
  });

  it("refuses a file without the expected columns", () => {
    const parsed = parseStatementCsv("Jour,Libellé\n1,2");
    expect(parsed.ok).toBe(false);
  });
});
