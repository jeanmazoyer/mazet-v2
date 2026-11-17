// Who may sign in. Two independent doors, both keyed on what Google itself vouches for:
//   1. a Google Workspace account whose hd claim is exactly the configured domain;
//   2. a verified address listed in ALLOWED_LOGIN_EMAILS, for teams on consumer Google
//      accounts (gmail.com has no hd claim at all, so door 1 can never admit them).
// The domain is matched on hd only, never on the email suffix, so a look-alike address
// cannot pass (ops spec E6). Email verification is checked by the caller before this runs.

export interface LoginPolicy {
  workspaceDomain: string;
  allowedEmails: ReadonlySet<string>;
}

export function parseAllowedEmails(raw: string): ReadonlySet<string> {
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  );
}

export function isLoginAllowed(
  identity: { email: string; hd: string | undefined },
  policy: LoginPolicy,
): boolean {
  if (
    identity.hd !== undefined &&
    identity.hd.toLowerCase() === policy.workspaceDomain.toLowerCase()
  ) {
    return true;
  }
  return policy.allowedEmails.has(identity.email.trim().toLowerCase());
}
