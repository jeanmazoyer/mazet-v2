import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { STRINGS } from "@/constants/strings";
import { formatCents } from "@/features/quotes/documentFormat";
import { listPriceItems, listQuotes } from "@/features/quotes/quoteRepo";
import { NewQuoteForm } from "@/features/quotes/ui/NewQuoteForm";
import { QuoteStatusButtons } from "@/features/quotes/ui/QuoteStatusButtons";
import { cn } from "@/lib/utils";
import { createContext } from "@/server/trpc/context";

export const metadata = { title: STRINGS.titles.dealFallback };

export default async function DealQuotesPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}): Promise<React.ReactNode> {
  const ctx = await createContext();
  if (ctx.actor === null) redirect("/login");
  const { dealId } = await params;

  const signal = AbortSignal.timeout(10_000);
  const quotes = await listQuotes(ctx.db, ctx.actor, dealId, signal);
  if (!quotes.ok) redirect(`/deals/${dealId}`);
  const items = await listPriceItems(ctx.db, ctx.actor, signal);

  const t = STRINGS.quotes;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-6">
      <Link
        href={`/deals/${dealId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t.backToDeal}
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display font-[450] leading-tight tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        {ctx.actor.type === "admin" ? (
          <Link href="/prices" className="text-sm underline underline-offset-4">
            {t.priceGridLink}
          </Link>
        ) : null}
      </header>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t.newQuote}</h2>
        <NewQuoteForm dealId={dealId} items={items} />
      </section>

      {quotes.value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {quotes.value.map((q) => (
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
              <QuoteStatusButtons dealId={dealId} quoteId={q.id} status={q.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
