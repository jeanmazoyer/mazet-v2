// Read gate shared by the deal's side pages (documents, payments, contract). A deal the actor
// cannot see, or one that is archived or deleted, answers not-found: the same as a missing deal.
import { and, eq, isNull } from "drizzle-orm";
import { AppError, ERROR_IDS } from "@/constants/errorIds";
import { deals } from "@/db/schema/deals";
import { pipelines } from "@/db/schema/pipelines";
import { canSee } from "@/features/permissions/canSee";
import type { PermSetUser } from "@/features/permissions/effective";
import type { DbOrTx } from "@/server/realtime/channelVersions";
import { err, ok, type Result } from "@/types/result";
import { toVisibleDeal } from "./dealAuth";

export async function assertDealVisible(
  db: DbOrTx,
  actor: PermSetUser,
  dealId: string,
  signal: AbortSignal,
): Promise<Result<true, AppError>> {
  const [deal] = await db
    .select({
      id: deals.id,
      ownerId: deals.ownerId,
      visibilityLevel: deals.visibilityLevel,
      visibilityGroupId: deals.visibilityGroupId,
      visibleToUserIds: deals.visibleToUserIds,
      pipelineVisibilityGroupId: pipelines.visibilityGroupId,
    })
    .from(deals)
    .innerJoin(pipelines, eq(pipelines.id, deals.pipelineId))
    .where(and(eq(deals.id, dealId), isNull(deals.deletedAt), eq(pipelines.isArchived, false)))
    .limit(1);
  if (deal === undefined || !canSee(actor, toVisibleDeal(deal, deal.pipelineVisibilityGroupId))) {
    return err(new AppError(ERROR_IDS.DEAL_NOT_FOUND, "Deal not found or not visible", { dealId }));
  }
  signal.throwIfAborted();
  return ok(true);
}
