// Decides which line of the bank statement settles a payment. Pure and deliberately cautious:
// money is matched only when the amount is exact AND the label names one of the tenants, and
// only when a single line fits. Anything less certain is left for a person to settle by hand.

export interface BankCandidate {
  id: string;
  label: string;
  amountCents: number;
  bookedOn: string;
}

// A shorter word ("le", "du", an initial) is in too many labels to identify anyone.
const MIN_TOKEN_LENGTH = 4;

function plain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// The words of the tenants' names worth looking for in a label, in the order given.
export function nameTokens(names: readonly string[]): string[] {
  const tokens = names
    .flatMap((name) => plain(name).split(/[^a-z]+/))
    .filter((word) => word.length >= MIN_TOKEN_LENGTH);
  return [...new Set(tokens)];
}

export function pickTransaction<T extends BankCandidate>(
  amountCents: number,
  candidates: readonly T[],
  tokens: readonly string[],
): T | null {
  const fitting = candidates.filter((candidate) => {
    if (candidate.amountCents !== amountCents) return false;
    const label = plain(candidate.label);
    return tokens.some((token) => label.includes(token));
  });
  const [only] = fitting;
  return fitting.length === 1 && only !== undefined ? only : null;
}
