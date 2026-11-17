// Who may link a Gmail mailbox to warpdrive. Same policy as sign-in (Workspace domain, or a
// consumer address on the allowlist), plus two rules specific to mailboxes: the address must
// be verified by Google, and it must be the very account the user is signed in with, so one
// person cannot attach someone else's inbox.
import { isLoginAllowed, type LoginPolicy } from "@/features/auth/loginPolicy";

export function mailboxIdentityAllowed(
  identity: { email: string; emailVerified: boolean; hd: string | null | undefined },
  sessionEmail: string,
  policy: LoginPolicy,
): boolean {
  if (!identity.emailVerified) return false;
  if (identity.email.trim().toLowerCase() !== sessionEmail.trim().toLowerCase()) return false;
  return isLoginAllowed({ email: identity.email, hd: identity.hd ?? undefined }, policy);
}
