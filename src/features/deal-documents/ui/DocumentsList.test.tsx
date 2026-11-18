// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { STRINGS } from "@/constants/strings";

const docs = [
  {
    id: "d1",
    title: "Contrat Bravo",
    status: "draft",
    driveFileId: "file-abc",
    templateTitle: "Contrat",
    createdAt: new Date("2026-11-17T10:00:00Z"),
  },
];

vi.mock("@/lib/trpc-client", () => ({
  trpc: {
    dealDocuments: {
      documents: {
        list: { useQuery: () => ({ data: docs, isPending: false, isError: false }) },
      },
    },
  },
}));

import { DocumentsList } from "./DocumentsList";

afterEach(cleanup);

it("opens a document's preview inside the app, from the list", () => {
  render(<DocumentsList dealId="deal-1" />);
  expect(
    screen.getByRole("link", { name: STRINGS.documentsTab.downloadPdf }).getAttribute("href"),
  ).toBe("/api/deals/deal-1/documents/d1/pdf");
  fireEvent.click(
    screen.getByRole("button", { name: `${STRINGS.documentsTab.preview}: Contrat Bravo` }),
  );
  const frame = screen.getByTitle("Contrat Bravo");
  expect(frame.getAttribute("src")).toBe("https://docs.google.com/document/d/file-abc/preview");
  expect(
    screen.getByRole("link", { name: STRINGS.documentsTab.openInDocs }).getAttribute("href"),
  ).toBe("https://docs.google.com/document/d/file-abc/edit");
});
