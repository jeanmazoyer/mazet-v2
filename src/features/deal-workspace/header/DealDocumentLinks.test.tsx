// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { DealDocumentLinks } from "./DealDocumentLinks";

afterEach(cleanup);

it("links the deal to its documents, quotes and payments, so the booking's paperwork is one click away", () => {
  render(<DealDocumentLinks dealId="deal-1" />);
  expect(screen.getByRole("link", { name: "Documents" }).getAttribute("href")).toBe(
    "/deals/deal-1/pieces",
  );
  expect(screen.getByRole("link", { name: "Quotes" }).getAttribute("href")).toBe(
    "/deals/deal-1/quotes",
  );
  expect(screen.getByRole("link", { name: "Payments" }).getAttribute("href")).toBe(
    "/deals/deal-1/payments",
  );
});
