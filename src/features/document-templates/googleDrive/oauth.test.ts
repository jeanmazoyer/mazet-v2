import { describe, expect, it } from "vitest";
import { buildDriveAuthUrl, DRIVE_SCOPE } from "./oauth";

describe("Google Drive consent link", () => {
  const url = new URL(
    buildDriveAuthUrl({
      clientId: "client-1",
      redirectUri: "http://localhost:3200/api/drive/oauth/callback",
      state: "state-abc",
    }),
  );

  it("asks for the full Drive scope, so the templates the team already has can be read", () => {
    expect(DRIVE_SCOPE).toBe("https://www.googleapis.com/auth/drive");
    expect(url.searchParams.get("scope")).toBe(DRIVE_SCOPE);
  });

  it("asks for a refresh token, so the connection survives the hour an access token lasts", () => {
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
  });

  it("carries the client, the callback address and the anti-forgery state", () => {
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-1");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3200/api/drive/oauth/callback",
    );
    expect(url.searchParams.get("state")).toBe("state-abc");
    expect(url.searchParams.get("response_type")).toBe("code");
  });
});
