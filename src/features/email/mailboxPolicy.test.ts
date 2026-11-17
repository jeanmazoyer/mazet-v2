import { describe, expect, it } from "vitest";
import { parseAllowedEmails } from "@/features/auth/loginPolicy";
import { mailboxIdentityAllowed } from "./mailboxPolicy";

const policy = {
  workspaceDomain: "example.com",
  allowedEmails: parseAllowedEmails("owner@gmail.com"),
};

describe("mailboxIdentityAllowed", () => {
  it("a Workspace account may link its own mailbox", () => {
    expect(
      mailboxIdentityAllowed(
        { email: "user@example.com", emailVerified: true, hd: "example.com" },
        "user@example.com",
        policy,
      ),
    ).toBe(true);
  });

  it("an allowlisted consumer account may link its own mailbox", () => {
    expect(
      mailboxIdentityAllowed(
        { email: "owner@gmail.com", emailVerified: true, hd: undefined },
        "Owner@Gmail.com",
        policy,
      ),
    ).toBe(true);
  });

  it("a consumer account that is not allowlisted is refused", () => {
    expect(
      mailboxIdentityAllowed(
        { email: "stranger@gmail.com", emailVerified: true, hd: undefined },
        "stranger@gmail.com",
        policy,
      ),
    ).toBe(false);
  });

  it("the account must be the one signed in to warpdrive", () => {
    expect(
      mailboxIdentityAllowed(
        { email: "owner@gmail.com", emailVerified: true, hd: undefined },
        "user@example.com",
        policy,
      ),
    ).toBe(false);
  });

  it("an unverified address is refused even if allowlisted", () => {
    expect(
      mailboxIdentityAllowed(
        { email: "owner@gmail.com", emailVerified: false, hd: undefined },
        "owner@gmail.com",
        policy,
      ),
    ).toBe(false);
  });

  it("a look-alike domain is refused: the hd claim must match exactly", () => {
    expect(
      mailboxIdentityAllowed(
        { email: "user@example.com", emailVerified: true, hd: "evil-example.com" },
        "user@example.com",
        policy,
      ),
    ).toBe(false);
  });
});
