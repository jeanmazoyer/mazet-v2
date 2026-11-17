import { journal } from "@/db/schema";
import type { Tx, Db } from "@/db";

export type JournalActor = { id: string; name: string };

export type JournalEntry = {
  organisationId: string;
  actor: JournalActor;
  action: string;
  objectType: string;
  objectId?: string | null;
  detail?: Record<string, unknown>;
};

// À appeler dans la même transaction que la modification qu'elle décrit :
// si la modification échoue, aucune ligne de journal n'est écrite.
export async function recordEvent(executor: Db | Tx, entry: JournalEntry): Promise<void> {
  await executor.insert(journal).values({
    organisationId: entry.organisationId,
    actorId: entry.actor.id,
    actorName: entry.actor.name,
    action: entry.action,
    objectType: entry.objectType,
    objectId: entry.objectId ?? null,
    detail: entry.detail ?? null,
  });
}
