// Starts the Google Drive connection: a state value guards against forged returns, and the page
// to come back to is kept in a short-lived cookie.
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { safeLoginReturnPath } from "@/features/auth/loginReturn";
import {
  DRIVE_CALLBACK_PATH,
  DRIVE_OAUTH_RETURN_COOKIE,
  DRIVE_OAUTH_STATE_COOKIE,
} from "@/features/document-templates/driveRoutes";
import { buildDriveAuthUrl } from "@/features/document-templates/googleDrive/oauth";
import { createContext } from "@/server/trpc/context";

const COOKIE_MAX_AGE_SECONDS = 600;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = await createContext();
  if (ctx.session === null) return NextResponse.redirect(new URL("/login", env.BASE_URL));

  const state = randomBytes(24).toString("base64url");
  const returnTo = safeLoginReturnPath(req.nextUrl.searchParams.get("return"));
  const jar = await cookies();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.BASE_URL.startsWith("https://"),
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
  jar.set(DRIVE_OAUTH_STATE_COOKIE, state, cookieOptions);
  jar.set(DRIVE_OAUTH_RETURN_COOKIE, returnTo, cookieOptions);

  return NextResponse.redirect(
    buildDriveAuthUrl({
      clientId: env.GOOGLE_OAUTH_CLIENT_ID,
      redirectUri: `${env.BASE_URL}${DRIVE_CALLBACK_PATH}`,
      state,
    }),
  );
}
