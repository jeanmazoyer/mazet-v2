import Link from "next/link";
import { redirect } from "next/navigation";
import { STRINGS } from "@/constants/strings";
import { listDealPieces } from "@/features/deal-pieces/pieceRepo";
import { PieceRow } from "@/features/deal-pieces/ui/PieceRow";
import { createContext } from "@/server/trpc/context";

export const metadata = { title: STRINGS.pieces.title };

export default async function DealPiecesPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}): Promise<React.ReactNode> {
  const ctx = await createContext();
  if (ctx.actor === null) redirect("/login");

  const { dealId } = await params;
  const result = await listDealPieces(ctx.db, ctx.actor, dealId, AbortSignal.timeout(10_000));
  if (!result.ok) redirect(`/deals/${dealId}`);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 md:p-6">
      <Link
        href={`/deals/${dealId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {STRINGS.pieces.back}
      </Link>
      <Link href={`/deals/${dealId}/quotes`} className="text-sm underline underline-offset-4">
        {STRINGS.quotes.title}
      </Link>
      <Link href={`/deals/${dealId}/payments`} className="text-sm underline underline-offset-4">
        {STRINGS.payments.title}
      </Link>
      <header>
        <h1 className="text-display font-[450] leading-tight tracking-tight">
          {STRINGS.pieces.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{STRINGS.pieces.subtitle}</p>
      </header>
      <ul className="divide-y rounded-lg border bg-card px-4">
        {result.value.map((p) => (
          <PieceRow
            key={p.kind}
            dealId={dealId}
            kind={p.kind}
            status={p.status}
            reference={p.reference}
            expiresOn={p.expiresOn}
          />
        ))}
      </ul>
    </div>
  );
}
