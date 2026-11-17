import { STRINGS } from "@/constants/strings";
import { cn } from "@/lib/utils";

export type PaymentMessageState = { tone: "ok" | "error"; text: string } | null;

export function paymentErrorText(id: string): string {
  const messages: Record<string, string> = STRINGS.payments.errors;
  return messages[id] ?? STRINGS.payments.errors.generic;
}

export function PaymentMessage({ message }: { message: PaymentMessageState }): React.ReactNode {
  if (message === null) return null;
  return (
    <p
      role={message.tone === "error" ? "alert" : "status"}
      className={cn(
        "text-xs",
        message.tone === "error" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {message.text}
    </p>
  );
}
