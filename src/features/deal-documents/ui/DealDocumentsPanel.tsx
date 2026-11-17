"use client";
import { STRINGS } from "@/constants/strings";
import { PieceRow } from "@/features/deal-pieces/ui/PieceRow";
import { trpc } from "@/lib/trpc-client";

// The booking's document checklist, shown inside the deal's Documents tab.
export function DealDocumentsPanel({ dealId }: { dealId: string }): React.ReactNode {
  const utils = trpc.useUtils();
  const query = trpc.dealDocuments.pieces.useQuery({ dealId });
  if (query.isPending)
    return <p className="text-sm text-muted-foreground">{STRINGS.dealRecords.loading}</p>;
  if (query.isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {STRINGS.dealRecords.loadError}
      </p>
    );
  return (
    <ul className="divide-y rounded-lg border bg-card px-4">
      {query.data.map((p) => (
        <PieceRow
          key={p.kind}
          dealId={dealId}
          kind={p.kind}
          status={p.status}
          reference={p.reference}
          expiresOn={p.expiresOn}
          onSaved={() => void utils.dealDocuments.pieces.invalidate({ dealId })}
        />
      ))}
    </ul>
  );
}
