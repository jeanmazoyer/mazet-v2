import Link from "next/link";
import { redirect } from "next/navigation";
import { STRINGS } from "@/constants/strings";
import { DealQuotesPanel } from "@/features/quotes/ui/DealQuotesPanel";
import { createContext } from "@/server/trpc/context";

export const metadata = { title: STRINGS.titles.dealFallback };

// The same panel as the deal's Quotes tab; this page keeps the direct link working.
export default async function DealQuotesPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}): Promise<React.ReactNode> {
  const ctx = await createContext();
  if (ctx.actor === null) redirect("/login");
  const { dealId } = await params;

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
      <DealQuotesPanel dealId={dealId} />
    </div>
  );
}
