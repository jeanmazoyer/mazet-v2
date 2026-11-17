import { describe, expect, test } from "vitest";
import { buildAuthUrl, generatePkce, verifyIdTokenClaims } from "./google";
import { parseAllowedEmails } from "./loginPolicy";

const allowlistPolicy = {
  workspaceDomain: "example.com",
  allowedEmails: parseAllowedEmails("owner@gmail.com"),
};

const baseClaims = {
  email: "user@example.com",
  email_verified: true,
  hd: "example.com",
  sub: "google-123",
  name: "User",
  picture: "https://pic",
  nonce: "n1",
  aud: "test-client-id",
  iss: "https://accounts.google.com",
};

// A consumer Google account: the ID token carries no hd claim at all.
const noHd = { ...baseClaims, hd: undefined };

describe("google oauth", () => {
  test("buildAuthUrl carries PKCE + state + nonce + hd hint", () => {
    const url = new URL(buildAuthUrl({ state: "s1", nonce: "n1", codeChallenge: "c1" }));
    expect(url.searchParams.get("code_challenge")).toBe("c1");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe("s1");
    expect(url.searchParams.get("nonce")).toBe("n1");
    expect(url.searchParams.get("hd")).toBe("example.com");
  });

  test("generatePkce produces a verifier and S256 challenge", () => {
    const { verifier, challenge } = generatePkce();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(challenge).not.toBe(verifier);
  });

  test("accepts a valid verified-domain claim set", () => {
    const r = verifyIdTokenClaims(baseClaims, { nonce: "n1", signal: AbortSignal.timeout(1000) });
    expect(r.ok).toBe(true);
    if (r.ok === true) expect(r.value.email).toBe("user@example.com");
  });

  test("rejects unverified email", () => {
    const r = verifyIdTokenClaims(
      { ...baseClaims, email_verified: false },
      { nonce: "n1", signal: AbortSignal.timeout(1000) },
    );
    expect(r.ok).toBe(false);
  });
  test("rejects wrong hd domain (no suffix spoof)", () => {
    const r = verifyIdTokenClaims(
      { ...baseClaims, hd: "evil-example.com" },
      { nonce: "n1", signal: AbortSignal.timeout(1000) },
    );
    expect(r.ok).toBe(false);
  });
  test("rejects nonce mismatch", () => {
    const r = verifyIdTokenClaims(baseClaims, {
      nonce: "different",
      signal: AbortSignal.timeout(1000),
    });
    expect(r.ok).toBe(false);
  });
  test("rejects wrong audience", () => {
    const r = verifyIdTokenClaims(
      { ...baseClaims, aud: "someone-else" },
      { nonce: "n1", signal: AbortSignal.timeout(1000) },
    );
    expect(r.ok).toBe(false);
  });
  test("an allowlisted consumer account (no hd claim) is accepted", () => {
    const r = verifyIdTokenClaims(
      { ...noHd, email: "Owner@Gmail.com" },
      { nonce: "n1", signal: AbortSignal.timeout(1000), policy: allowlistPolicy },
    );
    expect(r.ok).toBe(true);
    if (r.ok === true) expect(r.value.email).toBe("owner@gmail.com");
  });
  test("a non-allowlisted consumer account is still rejected", () => {
    const r = verifyIdTokenClaims(
      { ...noHd, email: "stranger@gmail.com" },
      { nonce: "n1", signal: AbortSignal.timeout(1000), policy: allowlistPolicy },
    );
    expect(r.ok).toBe(false);
  });
  test("an allowlisted address must still be verified by Google", () => {
    const r = verifyIdTokenClaims(
      { ...noHd, email: "owner@gmail.com", email_verified: false },
      { nonce: "n1", signal: AbortSignal.timeout(1000), policy: allowlistPolicy },
    );
    expect(r.ok).toBe(false);
  });
  test("buildAuthUrl drops the hd hint when an allowlist is set, so consumer accounts show up", () => {
    const url = new URL(
      buildAuthUrl({ state: "s1", nonce: "n1", codeChallenge: "c1", policy: allowlistPolicy }),
    );
    expect(url.searchParams.get("hd")).toBeNull();
  });
});
