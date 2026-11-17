import { describe, expect, test } from "vitest";
import { isLoginAllowed, parseAllowedEmails } from "./loginPolicy";

const policy = {
  workspaceDomain: "example.com",
  allowedEmails: parseAllowedEmails(" Owner@Gmail.com , partner@outlook.example ,, "),
};

describe("login policy", () => {
  test("parseAllowedEmails trims, lowercases, and drops empty entries", () => {
    expect([...parseAllowedEmails(" Owner@Gmail.com , partner@outlook.example ,, ")]).toEqual([
      "owner@gmail.com",
      "partner@outlook.example",
    ]);
    expect(parseAllowedEmails("").size).toBe(0);
  });

  test("a Workspace account of the configured domain is allowed (hd claim, exact)", () => {
    expect(isLoginAllowed({ email: "user@example.com", hd: "example.com" }, policy)).toBe(true);
    expect(isLoginAllowed({ email: "user@example.com", hd: "EXAMPLE.com" }, policy)).toBe(true);
  });

  test("an allowlisted address is allowed without any hd claim (consumer Google account)", () => {
    expect(isLoginAllowed({ email: "owner@gmail.com", hd: undefined }, policy)).toBe(true);
    expect(isLoginAllowed({ email: "OWNER@gmail.com", hd: undefined }, policy)).toBe(true);
  });

  test("an address that is neither in the domain nor allowlisted is rejected", () => {
    expect(isLoginAllowed({ email: "stranger@gmail.com", hd: undefined }, policy)).toBe(false);
    expect(isLoginAllowed({ email: "user@evil-example.com", hd: "evil-example.com" }, policy)).toBe(
      false,
    );
  });

  test("the domain is never matched on the email suffix, only on hd", () => {
    expect(isLoginAllowed({ email: "user@example.com", hd: undefined }, policy)).toBe(false);
  });

  test("with an empty allowlist the policy is the Workspace domain alone", () => {
    const domainOnly = { workspaceDomain: "example.com", allowedEmails: parseAllowedEmails("") };
    expect(isLoginAllowed({ email: "owner@gmail.com", hd: undefined }, domainOnly)).toBe(false);
    expect(isLoginAllowed({ email: "user@example.com", hd: "example.com" }, domainOnly)).toBe(true);
  });
});
