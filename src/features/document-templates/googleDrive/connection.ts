// Turns the consent code into a refresh token and the account's email, and turns the stored
// refresh token into a fresh access token. Every Google answer is checked at this boundary.
import { z } from "zod";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { GOOGLE_TOKEN_URL, GOOGLE_USERINFO_URL } from "@/constants/googleDrive";
import { err, ok, type Result } from "@/types/result";

interface CommonArgs {
  clientId: string;
  clientSecret: string;
  fetchFn: typeof fetch;
  signal: AbortSignal;
}

const tokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
});
const userinfoSchema = z.object({ email: z.string().email() });

function failed(message: string, context: Record<string, unknown> = {}): AppError {
  return new AppError(ERROR_IDS.DRIVE_REQUEST_FAILED, message, context);
}

async function postForm(
  args: CommonArgs,
  form: Record<string, string>,
): Promise<Result<z.infer<typeof tokenSchema>, AppError>> {
  try {
    const res = await args.fetchFn(GOOGLE_TOKEN_URL, {
      method: "POST",
      signal: args.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: args.clientId,
        client_secret: args.clientSecret,
        ...form,
      }).toString(),
    });
    if (!res.ok) return err(failed("Google refused the token request", { status: res.status }));
    const parsed = tokenSchema.safeParse(await res.json());
    return parsed.success
      ? ok(parsed.data)
      : err(failed("Google returned an unexpected token answer"));
  } catch (e) {
    args.signal.throwIfAborted();
    return err(
      failed("Google could not be reached", {
        reason: e instanceof Error ? e.message : "network error",
      }),
    );
  }
}

export async function exchangeDriveCode(
  args: CommonArgs & { code: string; redirectUri: string },
): Promise<Result<{ refreshToken: string; accountEmail: string }, AppError>> {
  const tokens = await postForm(args, {
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: args.redirectUri,
  });
  if (!tokens.ok) return tokens;
  // Without a refresh token the connection would stop working within the hour: refuse it now.
  if (tokens.value.refresh_token === undefined) {
    return err(failed("Google did not return a refresh token; the connection was not made"));
  }
  try {
    const res = await args.fetchFn(GOOGLE_USERINFO_URL, {
      signal: args.signal,
      headers: { Authorization: `Bearer ${tokens.value.access_token}` },
    });
    if (!res.ok) return err(failed("Google refused the account lookup", { status: res.status }));
    const who = userinfoSchema.safeParse(await res.json());
    if (!who.success) return err(failed("Google returned no account email"));
    return ok({ refreshToken: tokens.value.refresh_token, accountEmail: who.data.email });
  } catch (e) {
    args.signal.throwIfAborted();
    return err(
      failed("Google could not be reached", {
        reason: e instanceof Error ? e.message : "network error",
      }),
    );
  }
}

export async function refreshAccessToken(
  args: CommonArgs & { refreshToken: string },
): Promise<Result<string, AppError>> {
  const tokens = await postForm(args, {
    grant_type: "refresh_token",
    refresh_token: args.refreshToken,
  });
  if (!tokens.ok) return tokens;
  return ok(tokens.value.access_token);
}
