// The only place the environment is read. A missing value stops the start, with its name.
const need = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing environment variable ${key}`);
  return v;
};
const baseUrl = need("BASE_URL").replace(/\/$/, "");
const schema = process.env.DB_SCHEMA ?? "domaine";
if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("DB_SCHEMA must be a plain lowercase name");

export const config = {
  port: Number(process.env.PORT ?? 3000),
  baseUrl,
  secure: baseUrl.startsWith("https://"),
  databaseUrl: need("DATABASE_URL"),
  schema,
  googleId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
  googleSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
  // Administrators, by Google address. Anyone else has to be invited from the settings page.
  allowed: (process.env.ALLOWED_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
  // SHA-256 of a one-time code that lets the very first administrator in when ALLOWED_EMAILS
  // cannot be set on the box. Only the hash is ever written down; see mayBootstrap.
  setupHash: (process.env.SETUP_CODE_SHA256 ?? "").trim().toLowerCase(),
  dataDir: process.env.DATA_DIR ?? "./data",
  // Sign-in without Google, for a laptop only: both the flag and a localhost address are needed.
  devLogin: process.env.DEV_LOGIN === "true" && new URL(baseUrl).hostname === "localhost",
};
