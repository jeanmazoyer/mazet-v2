import { describe, expect, it } from "vitest";
import { ERROR_IDS } from "@/constants/errorIds";
import { GOOGLE_TOKEN_URL, GOOGLE_USERINFO_URL } from "@/constants/googleDrive";
import { scriptedFetch } from "../testing/scriptedFetch";
import { exchangeDriveCode, refreshAccessToken } from "./connection";

const CLIENT = { clientId: "client-1", clientSecret: "secret-1" };
const REDIRECT = "http://localhost:3200/api/drive/oauth/callback";
const signal = () => AbortSignal.timeout(5000);

describe("Drive connection: exchanging the consent code", () => {
  it("trades the code for a refresh token and reads the account's email", async () => {
    const { fetchFn, calls } = scriptedFetch([
      {
        match: (u) => u === GOOGLE_TOKEN_URL,
        json: { access_token: "at-1", refresh_token: "rt-1", expires_in: 3599 },
      },
      { match: (u) => u === GOOGLE_USERINFO_URL, json: { email: "jeanmazoyer@gmail.com" } },
    ]);
    const r = await exchangeDriveCode({
      ...CLIENT,
      code: "code-1",
      redirectUri: REDIRECT,
      fetchFn,
      signal: signal(),
    });
    expect(r).toEqual({
      ok: true,
      value: { refreshToken: "rt-1", accountEmail: "jeanmazoyer@gmail.com" },
    });
    const form = calls[0]?.form;
    expect(form?.get("grant_type")).toBe("authorization_code");
    expect(form?.get("code")).toBe("code-1");
    expect(form?.get("redirect_uri")).toBe(REDIRECT);
    expect(calls[1]?.auth).toBe("Bearer at-1");
  });

  it("refuses to connect when Google sends no refresh token, since the connection would expire within the hour", async () => {
    const { fetchFn } = scriptedFetch([
      { match: (u) => u === GOOGLE_TOKEN_URL, json: { access_token: "at-1", expires_in: 3599 } },
    ]);
    const r = await exchangeDriveCode({
      ...CLIENT,
      code: "code-1",
      redirectUri: REDIRECT,
      fetchFn,
      signal: signal(),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.id).toBe(ERROR_IDS.DRIVE_REQUEST_FAILED);
  });
});

describe("Drive connection: a fresh access token from the stored refresh token", () => {
  it("asks Google for a new access token and returns it", async () => {
    const { fetchFn, calls } = scriptedFetch([
      {
        match: (u) => u === GOOGLE_TOKEN_URL,
        json: { access_token: "at-fresh", expires_in: 3599 },
      },
    ]);
    const r = await refreshAccessToken({
      ...CLIENT,
      refreshToken: "rt-1",
      fetchFn,
      signal: signal(),
    });
    expect(r).toEqual({ ok: true, value: "at-fresh" });
    expect(calls[0]?.form?.get("grant_type")).toBe("refresh_token");
    expect(calls[0]?.form?.get("refresh_token")).toBe("rt-1");
  });
});
