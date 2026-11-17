// The download link's parameters, checked before anything is read or rendered.
import { z } from "zod";
import { isIsoDay } from "@/features/reservations/reservationRules";

const querySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("quote"),
    lang: z.enum(["fr", "en"]).default("fr"),
  }),
  z.object({
    kind: z.literal("contract"),
    lang: z.enum(["fr", "en"]).default("fr"),
    depositPercent: z.coerce.number().int().min(0).max(100),
    balanceDueOn: z.string().refine(isIsoDay, "not a real day"),
  }),
]);

export type DocumentQuery =
  | { kind: "quote"; lang: "fr" | "en"; depositPercent: null; balanceDueOn: null }
  | { kind: "contract"; lang: "fr" | "en"; depositPercent: number; balanceDueOn: string };

export function parseDocumentQuery(
  params: URLSearchParams,
): { ok: true; value: DocumentQuery } | { ok: false } {
  const raw = Object.fromEntries(params.entries());
  const parsed = querySchema.safeParse(
    raw.kind === "quote" ? { kind: "quote", lang: raw.lang } : raw,
  );
  if (!parsed.success) return { ok: false };
  const q = parsed.data;
  if (q.kind === "quote")
    return {
      ok: true,
      value: { kind: "quote", lang: q.lang, depositPercent: null, balanceDueOn: null },
    };
  return {
    ok: true,
    value: {
      kind: "contract",
      lang: q.lang,
      depositPercent: q.depositPercent,
      balanceDueOn: q.balanceDueOn,
    },
  };
}
