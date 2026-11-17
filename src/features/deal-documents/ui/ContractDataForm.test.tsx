// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { STRINGS } from "@/constants/strings";

const noop = () => undefined;
const contract = { terms: null, parties: [] as unknown[], viewerIsAdmin: false };
let viewer = { ...contract };

vi.mock("@/lib/trpc-client", () => ({
  trpc: {
    useUtils: () => ({ dealDocuments: { contract: { get: { invalidate: noop } } } }),
    dealDocuments: {
      contract: {
        get: { useQuery: () => ({ data: viewer, isPending: false, isError: false }) },
        saveTerms: { useMutation: () => ({ mutate: noop, isPending: false }) },
        saveParty: { useMutation: () => ({ mutate: noop, isPending: false }) },
      },
    },
  },
}));

import { ContractDataForm } from "./ContractDataForm";

afterEach(() => {
  cleanup();
  viewer = { ...contract };
});

it("asks for the stay: nature, occupants, arrival and departure times", () => {
  render(<ContractDataForm dealId="deal-1" />);
  expect(screen.getByLabelText(STRINGS.contractForm.occupants)).toBeTruthy();
  expect(screen.getByLabelText(STRINGS.contractForm.arrivalTime)).toBeTruthy();
  expect(screen.getByLabelText(STRINGS.contractForm.departureTime)).toBeTruthy();
});

it("hides the ID number field from someone who is not an administrator, and says when one is on file", () => {
  viewer = {
    ...contract,
    parties: [
      {
        role: "tenant_1",
        fullName: "Johanna Hung",
        email: null,
        phone: null,
        address: null,
        idNumber: null,
        idNumberOnFile: true,
      },
    ],
  };
  render(<ContractDataForm dealId="deal-1" />);
  expect(
    screen.queryByLabelText(`${STRINGS.contractForm.tenant1}: ${STRINGS.contractForm.idNumber}`),
  ).toBeNull();
  expect(screen.getByText(STRINGS.contractForm.idNumberOnFile)).toBeTruthy();
});

it("lets an administrator see and edit the ID number", () => {
  viewer = {
    ...contract,
    viewerIsAdmin: true,
    parties: [
      {
        role: "tenant_1",
        fullName: "Johanna Hung",
        email: null,
        phone: null,
        address: null,
        idNumber: "ABC123456",
        idNumberOnFile: true,
      },
    ],
  };
  render(<ContractDataForm dealId="deal-1" />);
  expect(
    screen.getByLabelText(`${STRINGS.contractForm.tenant1}: ${STRINGS.contractForm.idNumber}`),
  ).toBeTruthy();
});
