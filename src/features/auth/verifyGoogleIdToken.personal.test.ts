/**
 * A personal Google account (Gmail) carries no `hd` claim. It must be accepted only when its
 * address is on the explicit allow-list, never because the claim is missing.
 */

import { createLocalJWKSet, exportJWK, generateKeyPair, type JWK, SignJWT } from "jose";
import { describe, expect, test } from "vitest";
import { verifyGoogleIdToken } from "./verifyGoogleIdToken";

async function setup(claims: Record<string, unknown>) {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk: JWK = { ...(await exportJWK(publicKey)), alg: "RS256", kid: "key1" };
  const token = await new SignJWT({
    email: "jeanmazoyer@gmail.com",
    email_verified: true,
    sub: "1234567890",
    name: "Jean",
    nonce: "testnonce",
    aud: "test-client-id",
    iss: "https://accounts.google.com",
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256", kid: "key1" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
  return { token, getKey: createLocalJWKSet({ keys: [jwk] }) };
}

describe("verifyGoogleIdToken for a personal Google account", () => {
  test("accepts a Gmail account that is on the allow-list", async () => {
    const { token, getKey } = await setup({});
    const result = await verifyGoogleIdToken(token, {
      getKey,
      clientId: "test-client-id",
      nonce: "testnonce",
      workspaceDomain: "gmail.com",
      allowedEmails: new Set(["jeanmazoyer@gmail.com"]),
      signal: AbortSignal.timeout(5000),
    });
    expect(result.ok && result.value.email).toBe("jeanmazoyer@gmail.com");
  });

  test("refuses a Gmail account that is not on the allow-list", async () => {
    const { token, getKey } = await setup({});
    const result = await verifyGoogleIdToken(token, {
      getKey,
      clientId: "test-client-id",
      nonce: "testnonce",
      workspaceDomain: "gmail.com",
      allowedEmails: new Set(["quelqu.un@gmail.com"]),
      signal: AbortSignal.timeout(5000),
    });
    expect(result.ok).toBe(false);
  });

  test("refuses a Gmail account when no allow-list is given", async () => {
    const { token, getKey } = await setup({});
    const result = await verifyGoogleIdToken(token, {
      getKey,
      clientId: "test-client-id",
      nonce: "testnonce",
      workspaceDomain: "gmail.com",
      signal: AbortSignal.timeout(5000),
    });
    expect(result.ok).toBe(false);
  });

  test("still refuses a token whose hosted domain is another organization, even if listed", async () => {
    const { token, getKey } = await setup({ hd: "autre-entreprise.fr" });
    const result = await verifyGoogleIdToken(token, {
      getKey,
      clientId: "test-client-id",
      nonce: "testnonce",
      workspaceDomain: "gmail.com",
      allowedEmails: new Set(["jeanmazoyer@gmail.com"]),
      signal: AbortSignal.timeout(5000),
    });
    expect(result.ok).toBe(false);
  });
});
