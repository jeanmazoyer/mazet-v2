// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { STRINGS } from "@/constants/strings";
import { BrandLink } from "./BrandLink";

afterEach(cleanup);

// The estate's name is long. In a fixed-width slot it broke onto two lines and overflowed the
// 56px bar, so the name must stay on one line, and cut with an ellipsis where a phone is too
// narrow for it rather than push the search off screen.
it("keeps the app name on a single line", () => {
  render(<BrandLink />);
  const link = screen.getByRole("link", { name: `${STRINGS.app.name} home` });
  expect(link).toHaveTextContent(STRINGS.app.name);
  expect(link).toHaveClass("truncate");
  expect(link).not.toHaveClass("md:w-44");
});
