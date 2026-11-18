import { ERROR_IDS } from "@/constants/errorIds";
import { STRINGS } from "@/constants/strings";

const S = STRINGS.stay;

// The save route sends the id of the rule that refused the change: say which one in plain words.
export function stayErrorMessage(id: string): string {
  if (id === ERROR_IDS.RESERVATION_CONFLICT) return S.errors.conflict;
  if (id === ERROR_IDS.RESERVATION_INVALID) return S.errors.dates;
  if (id === ERROR_IDS.PERM_DENIED) return S.errors.denied;
  return S.errors.other;
}
