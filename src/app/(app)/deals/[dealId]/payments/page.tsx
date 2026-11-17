import Link from "next/link";
import { redirect } from "next/navigation";
import { STRINGS } from "@/constants/strings";
import { DealPaymentsPanel } from "@/features/deal-documents/ui/DealPaymentsPanel";
import { createContext } from "@/server/trpc/context";

export const metadata = { title: STRINGS.payments.title };

// The same panel as the deal's Payments tab; this page keeps the direct link working.
export default async function DealPaymentsPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}): Promise<React.ReactNode> {
  const ctx = await createContext();
  if (ctx.actor === null) redirect("/login");
  const { dealId } = await params;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 md:p-6">
      <Link
        href={`/deals/${dealId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {STRINGS.payments.back}
      </Link>
      <header>
        <h1 className="text-display font-[450] leading-tight tracking-tight">
          {STRINGS.payments.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{STRINGS.payments.subtitle}</p>
      </header>
      <DealPaymentsPanel dealId={dealId} />
    </div>
  );
}
