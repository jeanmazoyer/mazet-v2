// Procedures behind the Documents tab: the deal's documents and the template library. A failure
// becomes a tRPC error that carries the app's error id, so the panel can show the right message.
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/config/env";
import { type AppError, ERROR_IDS } from "@/constants/errorIds";
import {
  getContractData,
  saveContractParty,
  saveContractTerms,
} from "@/features/contract-data/contractRepo";
import { CONTRACT_NATURES, PARTY_ROLES } from "@/features/contract-data/contractRules";
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
import {
  addAccommodation,
  addProvider,
  getEventSheet,
  removeAccommodation,
  removeProvider,
  saveEventSheet,
} from "@/features/event-sheet/eventSheetRepo";
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

const partyInput = z.object({
  dealId: z.string().uuid(),
  role: z.enum(PARTY_ROLES),
  fullName: z.string().max(120),
  email: z.string().max(200).nullable(),
  phone: z.string().max(40).nullable(),
  address: z.string().max(300).nullable(),
  // Omitted to leave the stored ID number as it is; only an administrator can send it.
  idNumber: z.string().max(40).nullable().optional(),
});

const termsInput = z.object({
  dealId: z.string().uuid(),
  nature: z.enum(CONTRACT_NATURES),
  occupants: z.number().int(),
  arrivalTime: z.string().max(5),
  departureTime: z.string().max(5),
});

export const contractRouter = router({
  get: protectedProcedure.input(dealInput).query(async ({ ctx, input }) => ({
    ...unwrap(
      await getContractData(ctx.db, ctx.actor, input.dealId, AbortSignal.timeout(READ_TIMEOUT_MS)),
    ),
    viewerIsAdmin: ctx.actor.type === "admin",
  })),
  saveTerms: protectedProcedure
    .input(termsInput)
    .mutation(async ({ ctx, input }) =>
      unwrap(
        await saveContractTerms(
          ctx.db,
          ctx.actor,
          input.dealId,
          input,
          AbortSignal.timeout(READ_TIMEOUT_MS),
        ),
      ),
    ),
  saveParty: protectedProcedure.input(partyInput).mutation(async ({ ctx, input }) => {
    const { dealId, role, idNumber, ...rest } = input;
    const party = idNumber === undefined ? rest : { ...rest, idNumber };
    return unwrap(
      await saveContractParty(
        ctx.db,
        ctx.actor,
        dealId,
        role,
        party,
        AbortSignal.timeout(READ_TIMEOUT_MS),
      ),
    );
  }),
});

export const eventRouter = router({
  get: protectedProcedure
    .input(dealInput)
    .query(async ({ ctx, input }) =>
      unwrap(
        await getEventSheet(ctx.db, ctx.actor, input.dealId, AbortSignal.timeout(READ_TIMEOUT_MS)),
      ),
    ),
  saveSheet: protectedProcedure
    .input(
      z.object({
        dealId: z.string().uuid(),
        headcount: z.number().int().nullable(),
        notes: z.string().max(2000).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      unwrap(
        await saveEventSheet(
          ctx.db,
          ctx.actor,
          input.dealId,
          { headcount: input.headcount, notes: input.notes },
          AbortSignal.timeout(READ_TIMEOUT_MS),
        ),
      ),
    ),
  addProvider: protectedProcedure
    .input(
      z.object({
        dealId: z.string().uuid(),
        name: z.string().max(120),
        role: z.string().max(80),
        contact: z.string().max(200).nullable(),
        arrivalTime: z.string().max(5).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { dealId, ...provider } = input;
      return unwrap(
        await addProvider(
          ctx.db,
          ctx.actor,
          dealId,
          provider,
          AbortSignal.timeout(READ_TIMEOUT_MS),
        ),
      );
    }),
  removeProvider: protectedProcedure
    .input(z.object({ dealId: z.string().uuid(), providerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) =>
      unwrap(
        await removeProvider(
          ctx.db,
          ctx.actor,
          input.dealId,
          input.providerId,
          AbortSignal.timeout(READ_TIMEOUT_MS),
        ),
      ),
    ),
  addAccommodation: protectedProcedure
    .input(
      z.object({
        dealId: z.string().uuid(),
        name: z.string().max(120),
        beds: z.number().int().nullable(),
        notes: z.string().max(500).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { dealId, ...accommodation } = input;
      return unwrap(
        await addAccommodation(
          ctx.db,
          ctx.actor,
          dealId,
          accommodation,
          AbortSignal.timeout(READ_TIMEOUT_MS),
        ),
      );
    }),
  removeAccommodation: protectedProcedure
    .input(z.object({ dealId: z.string().uuid(), accommodationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) =>
      unwrap(
        await removeAccommodation(
          ctx.db,
          ctx.actor,
          input.dealId,
          input.accommodationId,
          AbortSignal.timeout(READ_TIMEOUT_MS),
        ),
      ),
    ),
});

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
