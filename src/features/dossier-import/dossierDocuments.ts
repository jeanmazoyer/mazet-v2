// The files of an imported dossier that already live in Drive (the signed contract, an invoice):
// they are attached to the deal by reference, not copied. A Drive file is attached once: the
// table's unique Drive id makes a second import of the same dossier add nothing.
import { dealDocuments } from "@/db/schema/dealDocuments";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import type { Dossier } from "./dossierSchema";

export async function attachDossierDocuments(
  db: DbOrTx,
  dealId: string,
  documents: Dossier["documents"],
  actorId: string,
  signal: AbortSignal,
): Promise<void> {
  if (documents.length === 0) return;
  await db
    .insert(dealDocuments)
    .values(
      documents.map((document) => ({
        dealId,
        title: document.title,
        driveFileId: document.driveFileId,
        mimeType: document.mimeType,
        // A signed contract carries identity numbers: the listing keeps it for administrators.
        carriesAdminData: document.adminOnly,
        // Already signed or issued, so past the draft stage a generated document starts in.
        status: "shared" as const,
        createdBy: actorId,
      })),
    )
    .onConflictDoNothing({ target: dealDocuments.driveFileId });
  signal.throwIfAborted();
}
