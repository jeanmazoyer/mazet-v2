"use client";
import { useRouter } from "next/navigation";
import type React from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { TimePicker } from "@/components/ui/TimePicker";
import { STRINGS } from "@/constants/strings";
import { CONTRACT_NATURES, PARTY_ROLES } from "@/features/contract-data/contractRules";
import { formatShortDate } from "@/features/document-templates/fieldValues";
import { trpc } from "@/lib/trpc-client";
import type { StayInput } from "../saveStay";
import type { StaySummary } from "../staySummary";
import { EditableStayRow } from "./EditableStayRow";
import { stayErrorMessage } from "./stayErrors";

const S = STRINGS.stay;
const NATURE_OPTIONS = CONTRACT_NATURES.map((value) => ({ value, label: S.natures[value] }));
const INPUT =
  "h-8 w-full rounded border border-field-border bg-card px-2 text-left text-foreground text-sm";
const PICKER =
  "flex h-8 w-full items-center rounded border border-field-border bg-card px-2 text-left text-sm";

type Patch = Partial<Omit<StayInput, "dealId">>;

function isWholeNumber(text: string): boolean {
  return /^\d+$/.test(text.trim());
}

// The booking's facts, each one editable in place with the editor suited to its kind. A change is
// sent as the whole booking with that one fact replaced, so the server applies its usual rules
// (a real time, dates that are free) to every edit, however small.
export function StayFields({
  dealId,
  stay,
  onEditAll,
}: {
  dealId: string;
  stay: StaySummary;
  // Opens every field at once: the way in when the stay terms do not exist yet, since they can
  // only be saved together (type, times and people sleeping on site).
  onEditAll: () => void;
}): React.ReactNode {
  const router = useRouter();
  const utils = trpc.useUtils();
  const mutation = trpc.dealDocuments.saveStay.useMutation();
  const { dates, terms } = stay;
  const tenants = PARTY_ROLES.map((_, index) => stay.tenants[index] ?? "");
  const termsMissing = terms === null ? onEditAll : undefined;

  async function save(patch: Patch): Promise<string | null> {
    if (terms === null) return S.errors.termsFirst;
    try {
      await mutation.mutateAsync({
        dealId,
        startDate: dates?.startDate ?? "",
        endDate: dates?.endDate ?? "",
        nature: terms.nature,
        occupants: terms.occupants,
        arrivalTime: terms.arrivalTime,
        departureTime: terms.departureTime,
        headcount: stay.headcount,
        tenants,
        ...patch,
      });
    } catch (error) {
      return stayErrorMessage(error instanceof Error ? error.message : "");
    }
    await utils.dealDocuments.invalidate();
    router.refresh();
    return null;
  }

  return (
    <>
      <EditableStayRow
        label={S.dates}
        emptyPrompt={S.add}
        display={
          dates === null ? null : (
            <>
              {formatShortDate(dates.startDate)} {S.to} {formatShortDate(dates.endDate)}
              <span className="block text-muted-foreground text-xs">
                {S.nights(dates.nights)}, {S.bookingKinds[dates.kind]}
              </span>
            </>
          )
        }
        initial={{ start: dates?.startDate ?? null, end: dates?.endDate ?? null }}
        isDirty={(d) =>
          d.start !== null &&
          d.end !== null &&
          (d.start !== dates?.startDate || d.end !== dates.endDate)
        }
        onStartEditInstead={termsMissing}
        renderEditor={(d, set) => (
          <div className="grid grid-cols-2 gap-2">
            <DatePicker
              ariaLabel={S.startDate}
              value={d.start}
              placeholder={S.startDate}
              triggerClassName={PICKER}
              formatLabel={formatShortDate}
              onChange={(start) => set({ ...d, start })}
            />
            <DatePicker
              ariaLabel={S.endDate}
              value={d.end}
              placeholder={S.endDate}
              triggerClassName={PICKER}
              formatLabel={formatShortDate}
              onChange={(end) => set({ ...d, end })}
            />
          </div>
        )}
        onSave={(d) => save({ startDate: d.start ?? "", endDate: d.end ?? "" })}
      />
      <EditableStayRow
        label={S.type}
        emptyPrompt={S.add}
        display={terms === null ? null : S.natures[terms.nature]}
        initial={terms?.nature ?? "stay"}
        isDirty={(d) => d !== terms?.nature}
        onStartEditInstead={termsMissing}
        renderEditor={(d, set) => (
          <Select
            ariaLabel={S.type}
            value={d}
            onChange={(v) => set(v === "event" ? "event" : "stay")}
            options={NATURE_OPTIONS}
          />
        )}
        onSave={(nature) => save({ nature })}
      />
      <EditableStayRow
        label={S.checkIn}
        emptyPrompt={S.add}
        display={terms === null ? null : <span className="tabular-nums">{terms.arrivalTime}</span>}
        initial={terms?.arrivalTime ?? ""}
        isDirty={(d) => d !== "" && d !== terms?.arrivalTime}
        onStartEditInstead={termsMissing}
        renderEditor={(d, set) => <TimePicker ariaLabel={S.checkIn} value={d} onChange={set} />}
        onSave={(arrivalTime) => save({ arrivalTime })}
      />
      <EditableStayRow
        label={S.checkOut}
        emptyPrompt={S.add}
        display={
          terms === null ? null : <span className="tabular-nums">{terms.departureTime}</span>
        }
        initial={terms?.departureTime ?? ""}
        isDirty={(d) => d !== "" && d !== terms?.departureTime}
        onStartEditInstead={termsMissing}
        renderEditor={(d, set) => <TimePicker ariaLabel={S.checkOut} value={d} onChange={set} />}
        onSave={(departureTime) => save({ departureTime })}
      />
      <EditableStayRow
        label={S.guests}
        emptyPrompt={S.add}
        display={
          stay.headcount === null ? null : <span className="tabular-nums">{stay.headcount}</span>
        }
        initial={String(stay.headcount ?? "")}
        isDirty={(d) =>
          d.trim() === ""
            ? stay.headcount !== null
            : isWholeNumber(d) && Number(d) !== stay.headcount
        }
        onStartEditInstead={termsMissing}
        renderEditor={(d, set) => (
          <input
            aria-label={S.guests}
            inputMode="numeric"
            value={d}
            onChange={(e) => set(e.target.value)}
            className={INPUT}
          />
        )}
        onSave={(d) => save({ headcount: d.trim() === "" ? null : Number(d) })}
      />
      <EditableStayRow
        label={S.sleeping}
        emptyPrompt={S.add}
        display={terms === null ? null : <span className="tabular-nums">{terms.occupants}</span>}
        initial={String(terms?.occupants ?? "")}
        isDirty={(d) => isWholeNumber(d) && Number(d) !== terms?.occupants}
        onStartEditInstead={termsMissing}
        renderEditor={(d, set) => (
          <input
            aria-label={S.sleeping}
            inputMode="numeric"
            value={d}
            onChange={(e) => set(e.target.value)}
            className={INPUT}
          />
        )}
        onSave={(d) => save({ occupants: Number(d) })}
      />
      <EditableStayRow
        label={S.tenants}
        emptyPrompt={S.add}
        display={
          stay.tenants.length === 0
            ? null
            : stay.tenants.map((name) => (
                <span key={name} className="block">
                  {name}
                </span>
              ))
        }
        initial={tenants}
        isDirty={(d) =>
          d.some((name, index) => name.trim() !== "" && name.trim() !== tenants[index])
        }
        onStartEditInstead={termsMissing}
        renderEditor={(d, set) => (
          <div className="flex flex-col gap-1">
            {d.map((name, index) => (
              <input
                // One input per contract role, in a fixed order: the position is the identity.
                key={PARTY_ROLES[index]}
                aria-label={S.tenant(index + 1)}
                placeholder={S.tenant(index + 1)}
                value={name}
                onChange={(e) => set(d.map((n, i) => (i === index ? e.target.value : n)))}
                className={INPUT}
              />
            ))}
          </div>
        )}
        onSave={(d) => save({ tenants: d })}
      />
    </>
  );
}
