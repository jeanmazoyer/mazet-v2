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

const noop = () => undefined;
vi.mock("@/lib/trpc-client", () => ({
  trpc: {
    useUtils: () => ({
      dealDocuments: { pieces: { invalidate: noop }, documents: { list: { invalidate: noop } } },
    }),
    dealDocuments: {
      pieces: { useQuery: () => ({ data: pieces, isPending: false, isError: false }) },
      documents: {
        driveStatus: {
          useQuery: () => ({
            data: { connected: false, accountEmail: null },
            isPending: false,
            isError: false,
          }),
        },
        list: { useQuery: () => ({ data: [], isPending: false, isError: false }) },
        create: { useMutation: () => ({ mutate: noop, isPending: false }) },
      },
      templates: {
        list: { useQuery: () => ({ data: [], isPending: false, isError: false }) },
      },
      contract: {
        get: {
          useQuery: () => ({
            data: { terms: null, parties: [], viewerIsAdmin: false },
            isPending: false,
            isError: false,
          }),
        },
        saveTerms: { useMutation: () => ({ mutate: noop, isPending: false }) },
        saveParty: { useMutation: () => ({ mutate: noop, isPending: false }) },
      },
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

it("offers Create new, a Documents list and a Templates library, like Pipedrive's Documents tab", () => {
  render(<DealDocumentsPanel dealId="deal-1" />);
  expect(screen.getByRole("button", { name: STRINGS.documentsTab.createNew })).toBeTruthy();
  expect(screen.getByText(STRINGS.documentsTab.documentsCreated)).toBeTruthy();
  expect(screen.getByRole("tab", { name: STRINGS.documentsTab.tabTemplates })).toBeTruthy();
});

it("offers to connect Google Drive, returning to this deal, while no account is connected", () => {
  render(<DealDocumentsPanel dealId="deal-1" />);
  const link = screen.getByRole("link", { name: STRINGS.documentsTab.connectDrive });
  expect(link.getAttribute("href")).toBe("/api/drive/oauth/start?return=%2Fdeals%2Fdeal-1");
});
