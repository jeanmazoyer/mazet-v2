"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  addCalendarFeedAction,
  syncCalendarFeedAction,
} from "@/features/calendar-feeds/feedActions";
import type { FeedSummary } from "@/features/calendar-feeds/feedRepo";
import { readCsrfToken } from "@/utils/csrfCookie";

const ERRORS: Record<string, string> = {
  E_FEED_001: "Only https calendar links from Airbnb can be added.",
  E_FEED_002: "The calendar could not be downloaded. Try again later.",
  E_FEED_003: "This calendar no longer exists.",
  E_PERM_001: "Only an administrator manages calendars.",
  E_AUTH_002: "Your page is out of date. Reload and try again.",
  E_AUTH_003: "Your session has ended. Sign in again.",
};

export function FeedsPanel({
  feeds,
  isAdmin,
}: {
  feeds: FeedSummary[];
  isAdmin: boolean;
}): React.ReactNode {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fail = (id: string) => setError(ERRORS[id] ?? "Something went wrong. Try again.");

  return (
    <section aria-labelledby="feeds-title" className="rounded-lg border bg-card p-4">
      <h2 id="feeds-title" className="text-sm font-semibold">
        External calendars
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Dates booked on Airbnb are copied here, so the estate never double-books. Synchronisation
        runs when you press Sync.
      </p>

      {feeds.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No external calendar connected.</p>
      ) : (
        <ul className="mt-3 divide-y">
          {feeds.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{f.label}</p>
                <p className="text-xs text-muted-foreground">
                  {f.lastSyncedAt === null
                    ? "Never synced"
                    : `Synced ${f.lastSyncedAt.toLocaleString("en-GB", { timeZone: "UTC" })} UTC`}
                  {f.lastError !== null ? ` · ${f.lastError}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const r = await syncCalendarFeedAction({ feedId: f.id }, readCsrfToken());
                    if (r.ok) router.refresh();
                    else fail(r.error.id);
                  });
                }}
              >
                Sync now
              </Button>
            </li>
          ))}
        </ul>
      )}

      {isAdmin ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
          <div className="grid gap-1 text-xs">
            <span>Name</span>
            <Input
              aria-label="Calendar name"
              value={label}
              maxLength={80}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Airbnb - Main house"
            />
          </div>
          <div className="grid gap-1 text-xs">
            <span>Airbnb calendar link (.ics)</span>
            <Input
              aria-label="Airbnb calendar link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.airbnb.com/calendar/ical/…"
            />
          </div>
          <Button
            disabled={pending || label.trim() === "" || url.trim() === ""}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const r = await addCalendarFeedAction({ label, url: url.trim() }, readCsrfToken());
                if (r.ok) {
                  setLabel("");
                  setUrl("");
                  router.refresh();
                } else {
                  fail(r.error.id);
                }
              });
            }}
          >
            Connect calendar
          </Button>
        </div>
      ) : null}

      {error !== null ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
