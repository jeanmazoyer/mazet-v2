// The consent link for the Drive connection. The full Drive scope lets the app read the templates
// the team already has; access_type=offline gives a refresh token, so the connection lasts.
import { GOOGLE_AUTH_URL } from "@/constants/googleDrive";

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

export function buildDriveAuthUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
  loginHint?: string;
}): string {
  const params = new URLSearchParams({
    client_id: args.clientId,
    redirect_uri: args.redirectUri,
    response_type: "code",
    scope: DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: args.state,
  });
  if (args.loginHint !== undefined) params.set("login_hint", args.loginHint);
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}
