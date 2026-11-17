import Link from "next/link";
import { redirect } from "next/navigation";
import { STRINGS } from "@/constants/strings";
import { listPaymentLines } from "@/features/payments/paymentRepo";
import { isOverdue } from "@/features/payments/paymentRules";
import { AddPaymentLineForm } from "@/features/payments/ui/AddPaymentLineForm";
import { PaymentLineRow } from "@/features/payments/ui/PaymentLineRow";
import { createContext } from "@/server/trpc/context";

export const metadata = { title: STRINGS.payments.title };

export default async function DealPaymentsPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}): Promise<React.ReactNode> {
  const ctx = await createContext();
  if (ctx.actor === null) redirect("/login");

  const { dealId } = await params;
  const result = await listPaymentLines(ctx.db, ctx.actor, dealId, AbortSignal.timeout(10_000));
  if (!result.ok) redirect(`/deals/${dealId}`);

  // Overdue is judged on the day the page is served, in UTC, the same day the schedule stores.
  const today = new Date().toISOString().slice(0, 10);
  const lines = result.value;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 md:p-6">
      <Link
        href={`/deals/${dealId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {STRINGS.payments.back}
      </Link>
      <Link href={`/deals/${dealId}/pieces`} className="text-sm underline underline-offset-4">
        {STRINGS.pieces.title}
      </Link>
      <header>
        <h1 className="text-display font-[450] leading-tight tracking-tight">
          {STRINGS.payments.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{STRINGS.payments.subtitle}</p>
      </header>

      <AddPaymentLineForm dealId={dealId} />

      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{STRINGS.payments.empty}</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card px-4">
          {lines.map((line) => (
            <PaymentLineRow
              key={line.id}
              dealId={dealId}
              line={line}
              today={today}
              overdue={isOverdue(line, today)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
