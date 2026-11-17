"use client";
import { PILL_TAB, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STRINGS } from "@/constants/strings";
import { PieceRow } from "@/features/deal-pieces/ui/PieceRow";
import { trpc } from "@/lib/trpc-client";
import { CreateDocumentMenu } from "./CreateDocumentMenu";
import { DocumentsList } from "./DocumentsList";
import { TemplatesList } from "./TemplatesList";

// The Documents tab, laid out like Pipedrive's Smart Docs: "Create new", then the documents made
// for the deal, a Templates library, and the booking's required-documents checklist.
export function DealDocumentsPanel({ dealId }: { dealId: string }): React.ReactNode {
  const utils = trpc.useUtils();
  const pieces = trpc.dealDocuments.pieces.useQuery({ dealId });
  const t = STRINGS.documentsTab;
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="documents">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="flex-wrap gap-1">
            <TabsTrigger value="documents" className={PILL_TAB}>
              {t.tabDocuments}
            </TabsTrigger>
            <TabsTrigger value="templates" className={PILL_TAB}>
              {t.tabTemplates}
            </TabsTrigger>
          </TabsList>
          <CreateDocumentMenu dealId={dealId} />
        </div>
        <TabsContent value="documents" className="mt-3 flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            {t.documentsCreated}
          </h3>
          <DocumentsList dealId={dealId} />
        </TabsContent>
        <TabsContent value="templates" className="mt-3">
          <TemplatesList />
        </TabsContent>
      </Tabs>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">
          {t.requiredDocuments}
        </h3>
        {pieces.isPending ? (
          <p className="text-sm text-muted-foreground">{STRINGS.dealRecords.loading}</p>
        ) : pieces.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {STRINGS.dealRecords.loadError}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card px-4">
            {pieces.data.map((p) => (
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
        )}
      </section>
    </div>
  );
}
