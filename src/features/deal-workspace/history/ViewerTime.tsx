"use client";
import type React from "react";
import { useSyncExternalStore } from "react";
import { formatTimelineEmailDate } from "@/features/email/inboxDate";

const subscribe = (): (() => void) => () => {};

// A time of day written in the reader's own language and time zone. The server knows neither, so
// it writes nothing, and the browser fills the text in once the page is live. Writing the server's
// guess instead makes its HTML differ from the browser's, and React then throws the whole page
// away and rebuilds it, during which nothing on it answers a click.
export function ViewerTime({ iso }: { iso: string }): React.ReactNode {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return <time dateTime={iso}>{inBrowser ? formatTimelineEmailDate(iso) : ""}</time>;
}
