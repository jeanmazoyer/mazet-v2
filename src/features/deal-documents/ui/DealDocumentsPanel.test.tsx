// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { STRINGS } from "@/constants/strings";

const pieces = [
  {
    kind: "quote_sent",
    status: "missing",
    reference: null,
    expiresOn: null,
    updatedAt: new Date(),
  },
  {
    kind: "deposit_received",
    status: "verified",
    reference: "VIR-1",
    expiresOn: null,
    updatedAt: new Date(),
  },
];

vi.mock("@/lib/trpc-client", () => ({
  trpc: {
    useUtils: () => ({ dealDocuments: { pieces: { invalidate: () => undefined } } }),
    dealDocuments: {
      pieces: { useQuery: () => ({ data: pieces, isPending: false, isError: false }) },
    },
  },
}));

import { DealDocumentsPanel } from "./DealDocumentsPanel";

afterEach(cleanup);

it("lists the booking's documents inside the deal, one row per document, with their labels", () => {
  render(<DealDocumentsPanel dealId="deal-1" />);
  expect(screen.getByText(STRINGS.pieces.kinds.quote_sent)).toBeTruthy();
  expect(screen.getByText(STRINGS.pieces.kinds.deposit_received)).toBeTruthy();
});
