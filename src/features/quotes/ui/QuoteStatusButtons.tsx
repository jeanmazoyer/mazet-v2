"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { STRINGS } from "@/constants/strings";
import { acceptQuoteAction, markQuoteSentAction } from "@/features/quotes/quoteActions";
import type { QuoteStatus } from "@/features/quotes/quoteRepo";
import { readCsrfToken } from "@/utils/csrfCookie";
import { quoteErrorText } from "./quoteErrors";

export function QuoteStatusButtons({
  dealId,
  quoteId,
  status,
}: {
  dealId: string;
  quoteId: string;
  status: QuoteStatus;
}): React.ReactNode {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next =
    status === "draft"
      ? { label: STRINGS.quotes.markSent, run: markQuoteSentAction }
      : status === "sent"
        ? { label: STRINGS.quotes.accept, run: acceptQuoteAction }
        : null;
  if (next === null) return null;

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await next.run({ dealId, quoteId }, readCsrfToken());
            if (result.ok) router.refresh();
            else setError(quoteErrorText(result.error.id));
          });
        }}
      >
        {next.label}
      </Button>
      {error !== null ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
