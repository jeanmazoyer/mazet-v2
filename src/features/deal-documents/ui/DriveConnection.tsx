"use client";
import Link from "next/link";
import { STRINGS } from "@/constants/strings";
import { trpc } from "@/lib/trpc-client";

// Shows whether the person's Google Drive is connected, and offers the connection when it is not.
// After consent the callback returns here with ?drive=connected or ?drive=error.
export function DriveConnection({ dealId }: { dealId: string }): React.ReactNode {
  const status = trpc.dealDocuments.documents.driveStatus.useQuery();
  const t = STRINGS.documentsTab;
  if (status.isPending) return null;
  if (status.isError) return null;
  if (status.data.connected) {
    return (
      <p className="text-xs text-muted-foreground">
        {t.driveConnectedAs} <span className="font-medium">{status.data.accountEmail}</span>
      </p>
    );
  }
  const returnTo = encodeURIComponent(`/deals/${dealId}`);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 text-sm">
      <Link
        href={`/api/drive/oauth/start?return=${returnTo}`}
        className="font-medium underline underline-offset-4"
      >
        {t.connectDrive}
      </Link>
    </div>
  );
}
