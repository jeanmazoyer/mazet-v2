// Reads behind the deal's Documents, Quotes and Payments tabs. Each procedure runs the same repo
// the old pages used, so visibility and rules stay in one place; a failed read becomes a NOT_FOUND
// carrying the error id, which the panels turn into the same message everywhere.
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { AppError } from "@/constants/errorIds";
import { listDealPieces } from "@/features/deal-pieces/pieceRepo";
import { listPaymentLines } from "@/features/payments/paymentRepo";
import { listPriceItems, listQuotes } from "@/features/quotes/quoteRepo";
import { saveStay, stayInput } from "@/features/stay-summary/saveStay";
import { getStaySummary } from "@/features/stay-summary/staySummary";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import type { Result } from "@/types/result";
import { contractRouter, documentsRouter, eventRouter } from "./documentsRouter";

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
  // Everything the sidebar shows about the booking, in one round trip.
  stay: protectedProcedure
    .input(dealInput)
    .query(async ({ ctx, input }) =>
      unwrap(
        await getStaySummary(ctx.db, ctx.actor, input.dealId, AbortSignal.timeout(READ_TIMEOUT_MS)),
      ),
    ),
  // The sidebar's edit of the booking. The error id travels as the message so the form can say
  // which rule refused the change (dates already booked, invalid time, and so on).
  saveStay: protectedProcedure.input(stayInput).mutation(async ({ ctx, input }) => {
    const saved = await saveStay(ctx.db, ctx.actor, input, AbortSignal.timeout(READ_TIMEOUT_MS));
    if (!saved.ok) throw new TRPCError({ code: "BAD_REQUEST", message: saved.error.id });
    return saved.value;
  }),
  documents: documentsRouter.documents,
  templates: documentsRouter.templates,
  contract: contractRouter,
  event: eventRouter,
});
