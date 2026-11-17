"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { STRINGS } from "@/constants/strings";
import type { PartyRole } from "@/features/contract-data/contractRules";
import {
  PaymentMessage,
  type PaymentMessageState,
  paymentErrorText,
} from "@/features/payments/ui/paymentMessage";
import { trpc } from "@/lib/trpc-client";

export interface TenantInitial {
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  idNumber: string | null;
  idNumberOnFile: boolean;
}

// One tenant of the contract. The ID number field exists only for administrators; anyone else
// sees whether a number is on file, never the number.
export function TenantFields({
  dealId,
  role,
  label,
  initial,
  viewerIsAdmin,
}: {
  dealId: string;
  role: PartyRole;
  label: string;
  initial: TenantInitial | null;
  viewerIsAdmin: boolean;
}): React.ReactNode {
  const utils = trpc.useUtils();
  const save = trpc.dealDocuments.contract.saveParty.useMutation({
    onSuccess: () => void utils.dealDocuments.contract.get.invalidate({ dealId }),
  });
  const t = STRINGS.contractForm;
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [idNumber, setIdNumber] = useState(initial?.idNumber ?? "");
  const [message, setMessage] = useState<PaymentMessageState>(null);

  const submit = (): void => {
    setMessage(null);
    save.mutate(
      {
        dealId,
        role,
        fullName: fullName.trim(),
        email: email.trim() === "" ? null : email.trim(),
        phone: phone.trim() === "" ? null : phone.trim(),
        address: address.trim() === "" ? null : address.trim(),
        ...(viewerIsAdmin ? { idNumber: idNumber.trim() === "" ? null : idNumber.trim() } : {}),
      },
      {
        onSuccess: () => setMessage({ tone: "ok", text: t.saved }),
        onError: (e) => setMessage({ tone: "error", text: paymentErrorText(e.message) }),
      },
    );
  };

  return (
    <fieldset className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <div className="grid gap-1 text-sm">
        <span className="text-muted-foreground">{t.name}</span>
        <Input
          aria-label={`${label}: ${t.name}`}
          value={fullName}
          maxLength={120}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="grid gap-1 text-sm">
        <span className="text-muted-foreground">{t.email}</span>
        <Input
          aria-label={`${label}: ${t.email}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-1 text-sm">
        <span className="text-muted-foreground">{t.phone}</span>
        <Input
          aria-label={`${label}: ${t.phone}`}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="grid gap-1 text-sm">
        <span className="text-muted-foreground">{t.address}</span>
        <Input
          aria-label={`${label}: ${t.address}`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      {viewerIsAdmin ? (
        <div className="grid gap-1 text-sm md:col-span-2">
          <span className="text-muted-foreground">{t.idNumber}</span>
          <Input
            aria-label={`${label}: ${t.idNumber}`}
            value={idNumber}
            maxLength={40}
            onChange={(e) => setIdNumber(e.target.value)}
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground md:col-span-2">
          {initial?.idNumberOnFile === true ? t.idNumberOnFile : t.noIdNumber}
        </p>
      )}
      <div className="flex flex-col items-start gap-1 md:col-span-2">
        <Button size="sm" disabled={save.isPending} onClick={submit}>
          {t.save}
        </Button>
        <PaymentMessage message={message} />
      </div>
    </fieldset>
  );
}
