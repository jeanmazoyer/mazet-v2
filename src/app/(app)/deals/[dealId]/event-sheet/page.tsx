import { and, asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SITE_RULES } from "@/constants/siteRules";
import { STRINGS } from "@/constants/strings";
import { deals } from "@/db/schema/deals";
import { reservations } from "@/db/schema/reservations";
import { getContractData } from "@/features/contract-data/contractRepo";
import { buildEventSheetModel } from "@/features/event-sheet/eventSheetModel";
import { getEventSheet } from "@/features/event-sheet/eventSheetRepo";
import { PrintButton } from "@/features/event-sheet/ui/PrintButton";
import { createContext } from "@/server/trpc/context";

export const metadata = { title: STRINGS.eventSheet.title };

// The printable event sheet: one page for the people on site, with the stay, the guests, the
// providers, the accommodations and the house rules. Print it from the browser.
export default async function EventSheetPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}): Promise<React.ReactNode> {
  const ctx = await createContext();
  if (ctx.actor === null) redirect("/login");
  const { dealId } = await params;
  const signal = AbortSignal.timeout(10_000);

  const sheet = await getEventSheet(ctx.db, ctx.actor, dealId, signal);
  if (!sheet.ok) redirect(`/deals/${dealId}`);
  const contract = await getContractData(ctx.db, ctx.actor, dealId, signal);
  const [deal] = await ctx.db
    .select({ title: deals.title })
    .from(deals)
    .where(eq(deals.id, dealId))
    .limit(1);
  const [stay] = await ctx.db
    .select({ startDate: reservations.startDate, endDate: reservations.endDate })
    .from(reservations)
    .where(and(eq(reservations.dealId, dealId), eq(reservations.state, "active")))
    .orderBy(asc(reservations.startDate))
    .limit(1);
  const terms = contract.ok ? contract.value.terms : null;

  const model = buildEventSheetModel({
    dealTitle: deal?.title ?? "",
    headcount: sheet.value.headcount,
    notes: sheet.value.notes,
    stay: stay ?? null,
    arrivalTime: terms?.arrivalTime ?? null,
    departureTime: terms?.departureTime ?? null,
    occupants: terms?.occupants ?? null,
    providers: sheet.value.providers,
    accommodations: sheet.value.accommodations,
    siteRules: SITE_RULES,
  });
  const t = STRINGS.eventSheet;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 text-sm print:max-w-none print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <PrintButton label={t.print} />
      </div>
      <header className="border-b pb-3">
        <h1 className="text-2xl font-semibold">{model.title}</h1>
        <p className="text-muted-foreground">{t.title}</p>
      </header>
      <dl className="grid grid-cols-[10rem_minmax(0,1fr)] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">{STRINGS.contractForm.stay}</dt>
        <dd>{model.stay}</dd>
        <dt className="text-muted-foreground">{STRINGS.contractForm.arrivalTime}</dt>
        <dd>{model.arrivalTime}</dd>
        <dt className="text-muted-foreground">{STRINGS.contractForm.departureTime}</dt>
        <dd>{model.departureTime}</dd>
        <dt className="text-muted-foreground">{t.headcount}</dt>
        <dd>{model.headcount}</dd>
        <dt className="text-muted-foreground">{t.notes}</dt>
        <dd>{model.notes}</dd>
      </dl>
      <section>
        <h2 className="mb-2 font-semibold">{t.providers}</h2>
        <table className="w-full border-collapse text-left">
          <tbody>
            {model.providers.map((p) => (
              <tr key={p.name + p.role} className="border-b">
                <td className="py-1 font-medium">{p.name}</td>
                <td className="py-1">{p.role}</td>
                <td className="py-1">{p.contact}</td>
                <td className="py-1">{p.arrivalTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">{t.accommodations}</h2>
        <table className="w-full border-collapse text-left">
          <tbody>
            {model.accommodations.map((a) => (
              <tr key={a.name} className="border-b">
                <td className="py-1 font-medium">{a.name}</td>
                <td className="py-1">{a.beds}</td>
                <td className="py-1">{a.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">{t.houseRules}</h2>
        <ul className="list-disc space-y-1 pl-5">
          {model.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
