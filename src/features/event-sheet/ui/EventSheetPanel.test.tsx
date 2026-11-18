// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { STRINGS } from "@/constants/strings";

const noop = () => undefined;
const sheet = {
  headcount: 120,
  notes: null,
  providers: [
    { id: "p1", name: "Traiteur Lumière", role: "Traiteur", contact: null, arrivalTime: "09:30" },
  ],
  accommodations: [],
};

vi.mock("@/lib/trpc-client", () => ({
  trpc: {
    useUtils: () => ({ dealDocuments: { event: { get: { invalidate: noop } } } }),
    dealDocuments: {
      event: {
        get: { useQuery: () => ({ data: sheet, isPending: false, isError: false }) },
        saveSheet: { useMutation: () => ({ mutate: noop, isPending: false }) },
        addProvider: { useMutation: () => ({ mutate: noop, isPending: false }) },
        removeProvider: { useMutation: () => ({ mutate: noop, isPending: false }) },
        addAccommodation: { useMutation: () => ({ mutate: noop, isPending: false }) },
        removeAccommodation: { useMutation: () => ({ mutate: noop, isPending: false }) },
      },
    },
  },
}));

import { EventSheetPanel } from "./EventSheetPanel";

afterEach(cleanup);

it("shows the headcount, the providers already on the booking, and a link to the printable sheet", () => {
  render(<EventSheetPanel dealId="deal-1" />);
  expect(screen.getByDisplayValue("120")).toBeTruthy();
  expect(screen.getByText("Traiteur Lumière")).toBeTruthy();
  expect(screen.getByRole("link", { name: STRINGS.eventSheet.print }).getAttribute("href")).toBe(
    "/deals/deal-1/event-sheet",
  );
});
