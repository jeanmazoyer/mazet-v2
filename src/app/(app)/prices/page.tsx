import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { STRINGS } from "@/constants/strings";
import { formatCents } from "@/features/quotes/documentFormat";
import { listAllPriceItems } from "@/features/quotes/quoteRepo";
import { PriceGridForm } from "@/features/quotes/ui/PriceGridForm";
import { createContext } from "@/server/trpc/context";

export const metadata = { title: STRINGS.quotes.priceTitle };

export default async function PricesPage(): Promise<React.ReactNode> {
  const ctx = await createContext();
  if (ctx.actor === null) redirect("/login");
  if (ctx.actor.type !== "admin") notFound();

  const items = await listAllPriceItems(ctx.db, ctx.actor, AbortSignal.timeout(10_000));
  const t = STRINGS.quotes;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 md:p-6">
      <Link href="/pipeline" className="text-sm text-muted-foreground hover:text-foreground">
        ← {t.backToDeal}
      </Link>
      <header>
        <h1 className="text-display font-[450] leading-tight tracking-tight">{t.priceTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.priceSubtitle}</p>
      </header>

      <ul className="divide-y rounded-lg border bg-card">
        {items.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span className="font-medium">{i.labelEn}</span>
            <span className="text-muted-foreground">
              {formatCents(i.unitPriceCents, "en")} · {t.units[i.unit]} · VAT {i.vatRateBp / 100}% ·{" "}
              {i.active ? t.active : t.inactive}
            </span>
          </li>
        ))}
      </ul>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t.priceAdd}</h2>
        <PriceGridForm />
      </section>
    </div>
  );
}
