"use client";
import type React from "react";
import { wsChannel } from "@/constants/wsChannels";
import { DealCloseActions } from "@/features/deal-workspace/DealCloseActions";
import type { DealWorkspace } from "@/features/deal-workspace/summaryRepo";
import { PresenceBar } from "@/features/presence/ui/PresenceBar";
import { DealActionsMenu } from "./DealActionsMenu";
import { EditableTitle } from "./EditableTitle";
import { StageSelector } from "./StageSelector";

interface DealHeaderProps {
  workspace: DealWorkspace;
  selfActorId: string;
  // Whether the actor holds deal.delete (own/any) for this deal; gates the overflow Delete item.
  canDelete: boolean;
  // Personal preference (user_preferences.ui.scheduleFollowUpAfterWon), passed through to
  // DealCloseActions so a successful Won can prompt to schedule a follow-up activity.
  scheduleFollowUpAfterWon: boolean;
}

// Two-row deal-detail header. Row 1: editable title + a right cluster of presence, close actions
// and the overflow menu. Row 2: the interactive stage selector. Layout only; each control owns
// its own logic. The owner, the followers, the block-visibility eye and the pipeline breadcrumb
// of the stock CRM are left out: a family-run estate has one pipeline and no team to assign to.
export function DealHeader({
  workspace,
  selfActorId,
  canDelete,
  scheduleFollowUpAfterWon,
}: DealHeaderProps): React.ReactNode {
  const { deal, stageProgress, lostReasonOptions, lostReasonName } = workspace;
  // Deal.updatedAt may arrive as a Date (RSC) or string; normalize to the ISO CAS precondition.
  const expectedUpdatedAt = new Date(deal.updatedAt).toISOString();

  return (
    <div className="mb-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <EditableTitle
            dealId={deal.id}
            title={deal.title}
            expectedUpdatedAt={expectedUpdatedAt}
          />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <PresenceBar channel={wsChannel.deal(deal.id)} selfId={selfActorId} />
          <DealCloseActions
            dealId={deal.id}
            status={deal.status}
            lostReasonOptions={lostReasonOptions}
            lostReasonName={lostReasonName}
            lostReasonText={deal.lostReason}
            scheduleFollowUpAfterWon={scheduleFollowUpAfterWon}
          />
          <DealActionsMenu
            dealId={deal.id}
            pipelineId={deal.pipelineId}
            expectedUpdatedAt={expectedUpdatedAt}
            canDelete={canDelete}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <StageSelector
            dealId={deal.id}
            expectedUpdatedAt={expectedUpdatedAt}
            chips={stageProgress.chips}
          />
        </div>
      </div>
    </div>
  );
}
