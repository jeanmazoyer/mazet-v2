// Which calendar addresses the server may fetch. A feed URL is an outgoing request made by the
// server, so the policy is strict: https only, and only the Airbnb domains the estate uses.
const ALLOWED_HOST = /(^|\.)airbnb\.(com|fr|co\.uk|de|es|it)$/i;

export function isAllowedFeedUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return url.protocol === "https:" && ALLOWED_HOST.test(url.hostname);
}
