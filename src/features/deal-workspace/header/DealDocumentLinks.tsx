import Link from "next/link";
import type React from "react";
import { STRINGS } from "@/constants/strings";

// The booking's paperwork lives on its own pages (documents checklist, quotes, payment schedule).
// These links sit in the deal header so they are reachable from the deal itself.
export function DealDocumentLinks({ dealId }: { dealId: string }): React.ReactNode {
  const links = [
    { href: `/deals/${dealId}/pieces`, label: STRINGS.pieces.title },
    { href: `/deals/${dealId}/quotes`, label: STRINGS.quotes.title },
    { href: `/deals/${dealId}/payments`, label: STRINGS.payments.title },
  ];
  return (
    <nav aria-label={STRINGS.pieces.title} className="mt-3 flex flex-wrap gap-4 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="underline underline-offset-4 hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
