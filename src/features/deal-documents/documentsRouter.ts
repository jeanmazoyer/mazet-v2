// Procedures behind the Documents tab: the deal's documents and the template library. A failure
// becomes a tRPC error that carries the app's error id, so the panel can show the right message.
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/config/env";
import { type AppError, ERROR_IDS } from "@/constants/errorIds";
import {
  createDealDocument,
  createTemplateFromFile,
  listDealDocuments,
  listTemplates,
} from "@/features/document-templates/documentsRepo";
import { type DriveConfig, driveForUser } from "@/features/document-templates/driveAccess";
import { getDriveConnection } from "@/features/document-templates/driveConnectionRepo";
import type { DriveProvider } from "@/features/document-templates/driveProvider";
import { TEMPLATE_CATEGORIES } from "@/features/document-templates/templateRules";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import type { Result } from "@/types/result";

const READ_TIMEOUT_MS = 10_000;

function driveConfig(): Omit<DriveConfig, "redirectUri"> {
  return {
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    fetchFn: fetch,
  };
}

// The Drive of the person asking: their own connected account, or the "not connected" answer.
async function driveOf(
  db: Parameters<typeof driveForUser>[0],
  userId: string,
  signal: AbortSignal,
): Promise<DriveProvider> {
  return unwrap(await driveForUser(db, userId, driveConfig(), signal));
}
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
    driveStatus: protectedProcedure.query(async ({ ctx }) => {
      const connection = unwrap(
        await getDriveConnection(ctx.db, ctx.actor.id, AbortSignal.timeout(READ_TIMEOUT_MS)),
      );
      return connection === null
        ? { connected: false as const, accountEmail: null }
        : { connected: true as const, accountEmail: connection.accountEmail };
    }),
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
      const signal = AbortSignal.timeout(READ_TIMEOUT_MS);
      const drive = await driveOf(ctx.db, ctx.actor.id, signal);
      return unwrap(
        await createDealDocument(
          ctx.db,
          ctx.actor,
          drive,
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
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(120),
          category: z.enum(TEMPLATE_CATEGORIES),
          driveFileId: z.string().min(10).max(200),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const signal = AbortSignal.timeout(READ_TIMEOUT_MS);
        const drive = await driveOf(ctx.db, ctx.actor.id, signal);
        return unwrap(await createTemplateFromFile(ctx.db, ctx.actor, drive, input, signal));
      }),
  }),
});
