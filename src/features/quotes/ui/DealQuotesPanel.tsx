"use client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { STRINGS } from "@/constants/strings";
import { formatCents } from "@/features/quotes/documentFormat";
import { NewQuoteForm } from "@/features/quotes/ui/NewQuoteForm";
import { QuoteStatusButtons } from "@/features/quotes/ui/QuoteStatusButtons";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";

// The deal's quotes, shown inside the Quotes tab: a new quote from the price grid, then each
// version with its PDFs, its status and, once accepted, the contract form.
export function DealQuotesPanel({ dealId }: { dealId: string }): React.ReactNode {
  const utils = trpc.useUtils();
  const query = trpc.dealDocuments.quotes.useQuery({ dealId });
  const refresh = () => void utils.dealDocuments.quotes.invalidate({ dealId });
  if (query.isPending)
    return <p className="text-sm text-muted-foreground">{STRINGS.dealRecords.loading}</p>;
  if (query.isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {STRINGS.dealRecords.loadError}
      </p>
    );

  const t = STRINGS.quotes;
  const { quotes, items } = query.data;
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t.newQuote}</h2>
        <NewQuoteForm dealId={dealId} items={items} onChanged={refresh} />
      </section>

      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {quotes.map((q) => (
            <li
              key={q.id}
              className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {t.version} {q.version} ·{" "}
                  <span className={cn(q.status === "accepted" && "text-status-green")}>
                    {t.statuses[q.status]}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  {t.total}: {formatCents(q.totalCents, "en")}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <a
                    className="underline underline-offset-4"
                    href={`/api/deals/${dealId}/quotes/${q.id}/document?kind=quote&lang=fr`}
                  >
                    {t.quotePdf} (FR)
                  </a>
                  <a
                    className="underline underline-offset-4"
                    href={`/api/deals/${dealId}/quotes/${q.id}/document?kind=quote&lang=en`}
                  >
                    {t.quotePdf} (EN)
                  </a>
                </div>
                {q.status === "accepted" ? (
                  <form
                    action={`/api/deals/${dealId}/quotes/${q.id}/document`}
                    method="get"
                    className="mt-3 grid gap-2 sm:grid-cols-3"
                  >
                    <input type="hidden" name="kind" value="contract" />
                    <div className="grid gap-1 text-xs">
                      <span>{t.depositPercent}</span>
                      <Input
                        aria-label={t.depositPercent}
                        name="depositPercent"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={30}
                        required
                      />
                    </div>
                    <div className="grid gap-1 text-xs">
                      <span>{t.balanceDueOn}</span>
                      <Input aria-label={t.balanceDueOn} name="balanceDueOn" type="date" required />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button name="lang" value="fr" type="submit" variant="outline" size="sm">
                        {t.contractFr}
                      </Button>
                      <Button name="lang" value="en" type="submit" variant="outline" size="sm">
                        {t.contractEn}
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
              <QuoteStatusButtons
                dealId={dealId}
                quoteId={q.id}
                status={q.status}
                onChanged={refresh}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
