// Reads behind the deal's Documents, Quotes and Payments tabs. Each procedure runs the same repo
// the old pages used, so visibility and rules stay in one place; a failed read becomes a NOT_FOUND
// carrying the error id, which the panels turn into the same message everywhere.
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { AppError } from "@/constants/errorIds";
import { listDealPieces } from "@/features/deal-pieces/pieceRepo";
import { listPaymentLines } from "@/features/payments/paymentRepo";
import { listPriceItems, listQuotes } from "@/features/quotes/quoteRepo";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import type { Result } from "@/types/result";
import { documentsRouter } from "./documentsRouter";

const dealInput = z.object({ dealId: z.string().uuid() });
const READ_TIMEOUT_MS = 10_000;

function unwrap<T>(result: Result<T, AppError>): T {
  if (!result.ok) throw new TRPCError({ code: "NOT_FOUND", message: result.error.id });
  return result.value;
}

export const dealDocumentsRouter = router({
  pieces: protectedProcedure
    .input(dealInput)
    .query(async ({ ctx, input }) =>
      unwrap(
        await listDealPieces(ctx.db, ctx.actor, input.dealId, AbortSignal.timeout(READ_TIMEOUT_MS)),
      ),
    ),

  payments: protectedProcedure
    .input(dealInput)
    .query(async ({ ctx, input }) =>
      unwrap(
        await listPaymentLines(
          ctx.db,
          ctx.actor,
          input.dealId,
          AbortSignal.timeout(READ_TIMEOUT_MS),
        ),
      ),
    ),

  quotes: protectedProcedure.input(dealInput).query(async ({ ctx, input }) => {
    const signal = AbortSignal.timeout(READ_TIMEOUT_MS);
    const quotes = unwrap(await listQuotes(ctx.db, ctx.actor, input.dealId, signal));
    // The price grid is needed to build a new quote, so it travels with the list.
    const items = await listPriceItems(ctx.db, ctx.actor, signal);
    return { quotes, items };
  }),
  documents: documentsRouter.documents,
  templates: documentsRouter.templates,
});
