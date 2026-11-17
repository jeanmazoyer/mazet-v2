// The real download of a feed. Bounded in time and size, and it never follows a redirect: a
// redirect could send the request to an address the policy would refuse.

import type { FeedFetch } from "./feedSync";
import { isAllowedFeedUrl } from "./feedUrl";

const MAX_BYTES = 2_000_000;

export const fetchFeedText: FeedFetch = async (url, signal) => {
  if (!isAllowedFeedUrl(url)) return { ok: false };
  try {
    const res = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    });
    if (!res.ok) return { ok: false };
    const length = Number(res.headers.get("content-length") ?? "0");
    if (length > MAX_BYTES) return { ok: false };
    const text = await res.text();
    return text.length > MAX_BYTES ? { ok: false } : { ok: true, text };
  } catch {
    return { ok: false };
  }
};
