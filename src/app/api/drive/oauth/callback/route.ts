// Google sends the user back here after consent. The state must match the cookie set at start,
// then the code is traded for the refresh token, and the user returns to the page they came from.
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { db } from "@/db/client";
import { safeLoginReturnPath } from "@/features/auth/loginReturn";
import { completeDriveConnection } from "@/features/document-templates/driveAccess";
import {
  DRIVE_CALLBACK_PATH,
  DRIVE_OAUTH_RETURN_COOKIE,
  DRIVE_OAUTH_STATE_COOKIE,
} from "@/features/document-templates/driveRoutes";
import { stateMatches } from "@/features/email/oauth";
import { createContext } from "@/server/trpc/context";

function backTo(returnTo: string, outcome: "connected" | "error"): NextResponse {
  const target = new URL(returnTo, env.BASE_URL);
  target.searchParams.set("drive", outcome);
  return NextResponse.redirect(target);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = await createContext();
  if (ctx.session === null) return NextResponse.redirect(new URL("/login", env.BASE_URL));

  const jar = await cookies();
  const storedState = jar.get(DRIVE_OAUTH_STATE_COOKIE)?.value;
  const returnTo = safeLoginReturnPath(jar.get(DRIVE_OAUTH_RETURN_COOKIE)?.value);
  jar.delete(DRIVE_OAUTH_STATE_COOKIE);
  jar.delete(DRIVE_OAUTH_RETURN_COOKIE);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state") ?? "";
  if (code === null || !stateMatches(state, storedState)) return backTo(returnTo, "error");

  const result = await completeDriveConnection({
    db,
    userId: ctx.session.userId,
    code,
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri: `${env.BASE_URL}${DRIVE_CALLBACK_PATH}`,
    fetchFn: fetch,
    signal: AbortSignal.timeout(15_000),
  });
  return backTo(returnTo, result.ok ? "connected" : "error");
}
