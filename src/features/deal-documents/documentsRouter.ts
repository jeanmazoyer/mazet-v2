// Procedures behind the Documents tab: the deal's documents and the template library. A failure
// becomes a tRPC error that carries the app's error id, so the panel can show the right message.
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type AppError, ERROR_IDS } from "@/constants/errorIds";
import {
  createDealDocument,
  listDealDocuments,
  listTemplates,
} from "@/features/document-templates/documentsRepo";
import { notConnectedDrive } from "@/features/document-templates/driveConnection";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import type { Result } from "@/types/result";

const READ_TIMEOUT_MS = 10_000;
const dealInput = z.object({ dealId: z.string().uuid() });
const createInput = z.object({
  dealId: z.string().uuid(),
  title: z.string().min(1).max(200),
  templateId: z.string().uuid().optional(),
});

function unwrap<T>(result: Result<T, AppError>): T {
  if (result.ok) return result.value;
  const code =
    result.error.id === ERROR_IDS.PERM_DENIED
      ? "FORBIDDEN"
      : result.error.id === ERROR_IDS.DEAL_NOT_FOUND ||
          result.error.id === ERROR_IDS.DOCUMENT_NOT_FOUND
        ? "NOT_FOUND"
        : result.error.id === ERROR_IDS.DRIVE_NOT_CONNECTED
          ? "PRECONDITION_FAILED"
          : "BAD_REQUEST";
  throw new TRPCError({ code, message: result.error.id });
}

export const documentsRouter = router({
  documents: router({
    list: protectedProcedure
      .input(dealInput)
      .query(async ({ ctx, input }) =>
        unwrap(
          await listDealDocuments(
            ctx.db,
            ctx.actor,
            input.dealId,
            AbortSignal.timeout(READ_TIMEOUT_MS),
          ),
        ),
      ),
    create: protectedProcedure.input(createInput).mutation(async ({ ctx, input }) => {
      const { dealId, title, templateId } = input;
      return unwrap(
        await createDealDocument(
          ctx.db,
          ctx.actor,
          notConnectedDrive,
          dealId,
          templateId === undefined ? { title } : { title, templateId },
          AbortSignal.timeout(READ_TIMEOUT_MS),
        ),
      );
    }),
  }),
  templates: router({
    list: protectedProcedure.query(async ({ ctx }) =>
      unwrap(await listTemplates(ctx.db, AbortSignal.timeout(READ_TIMEOUT_MS))),
    ),
  }),
});
