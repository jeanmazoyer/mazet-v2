"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { STRINGS } from "@/constants/strings";
import { updateDealPieceAction } from "@/features/deal-pieces/pieceActions";
import type { PieceKind, PieceStatus } from "@/features/deal-pieces/pieceRules";
import { cn } from "@/lib/utils";
import { readCsrfToken } from "@/utils/csrfCookie";

export interface PieceRowProps {
  dealId: string;
  kind: PieceKind;
  status: PieceStatus;
  reference: string | null;
  expiresOn: string | null;
}

// The insurance certificate is the only document with a validity end date, so only its row
// shows the date field.
export function PieceRow(props: PieceRowProps): React.ReactNode {
  const { dealId, kind } = props;
  const [status, setStatus] = useState<PieceStatus>(props.status);
  const [reference, setReference] = useState(props.reference ?? "");
  const [expiresOn, setExpiresOn] = useState(props.expiresOn ?? "");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const hasExpiry = kind === "insurance_certificate";

  return (
    <li className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)_auto] md:items-end">
      <p className="text-sm font-medium md:self-center">{STRINGS.pieces.kinds[kind]}</p>

      <div className="grid gap-1 text-sm">
        <span className="text-muted-foreground">{STRINGS.pieces.statusLabel}</span>
        <Select
          ariaLabel={`${STRINGS.pieces.kinds[kind]}: ${STRINGS.pieces.statusLabel}`}
          value={status}
          onChange={(v) => setStatus(v === "received" || v === "verified" ? v : "missing")}
          options={PIECE_STATUS_OPTIONS}
        />
      </div>

      <div className="grid gap-1 text-sm">
        <span className="text-muted-foreground">{STRINGS.pieces.referenceLabel}</span>
        <Input
          aria-label={`${STRINGS.pieces.kinds[kind]}: ${STRINGS.pieces.referenceLabel}`}
          value={reference}
          maxLength={200}
          onChange={(e) => setReference(e.target.value)}
        />
        {hasExpiry ? (
          <Input
            aria-label={`${STRINGS.pieces.kinds[kind]}: ${STRINGS.pieces.expiresLabel}`}
            type="date"
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
            className="mt-1"
          />
        ) : null}
      </div>

      <div className="flex flex-col items-start gap-1">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const result = await updateDealPieceAction(
                {
                  dealId,
                  kind,
                  status,
                  reference: reference.trim() === "" ? null : reference,
                  expiresOn: hasExpiry && expiresOn !== "" ? expiresOn : null,
                },
                readCsrfToken(),
              );
              setMessage(
                result.ok
                  ? { tone: "ok", text: STRINGS.pieces.saved }
                  : { tone: "error", text: pieceErrorText(result.error.id) },
              );
            });
          }}
        >
          {STRINGS.pieces.save}
        </Button>
        {message !== null ? (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={cn(
              "text-xs",
              message.tone === "error" ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </li>
  );
}

const PIECE_STATUS_OPTIONS = [
  { value: "missing", label: STRINGS.pieces.statuses.missing },
  { value: "received", label: STRINGS.pieces.statuses.received },
  { value: "verified", label: STRINGS.pieces.statuses.verified },
];

function pieceErrorText(id: string): string {
  const messages: Record<string, string> = STRINGS.pieces.errors;
  return messages[id] ?? STRINGS.pieces.errors.generic;
}
