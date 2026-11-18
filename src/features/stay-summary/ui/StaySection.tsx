"use client";
import type React from "react";
import { STRINGS } from "@/constants/strings";
import { trpc } from "@/lib/trpc-client";
import type { StaySummary } from "../staySummary";
import { StayEditor } from "./StayEditor";
import { StayFields } from "./StayFields";

const S = STRINGS.stay;

// The booking at a glance, in the deal's sidebar: each fact is read here and edited in place
// (see StayFields), or all at once from the header pencil (StayEditor). The money side has its
// own block (FinanceSection).
export function StaySection({
  dealId,
  editing = false,
  onExitEdit,
  initialStay,
  onEditAll,
}: {
  dealId: string;
  editing?: boolean;
  onExitEdit?: () => void;
  // Read on the server with the page: the section is painted with it, then kept fresh by the query.
  initialStay?: StaySummary;
  // Opens the whole section's editor (the header pencil does the same).
  onEditAll?: () => void;
}): React.ReactNode {
  const query = trpc.dealDocuments.stay.useQuery({ dealId }, { initialData: initialStay });
  const stay = query.data;
  if (stay === undefined) {
    return (
      <p className="py-1.5 text-sm text-muted-foreground">{query.isError ? S.error : S.loading}</p>
    );
  }
  if (editing) {
    return <StayEditor dealId={dealId} stay={stay} onExit={onExitEdit ?? (() => {})} />;
  }
  const { dates, terms } = stay;
  const empty =
    dates === null && terms === null && stay.tenants.length === 0 && stay.payments.length === 0;
  if (empty) return <p className="py-1.5 text-sm text-muted-foreground">{S.empty}</p>;

  return <StayFields dealId={dealId} stay={stay} onEditAll={onEditAll ?? (() => {})} />;
}
