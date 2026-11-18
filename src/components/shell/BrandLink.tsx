import Link from "next/link";
import type React from "react";
import { STRINGS } from "@/constants/strings";

// The app name, linking home. It is never allowed to wrap: from sm up it takes the room its text
// needs, and on a phone it is the one item of the bar that gives way, cut with an ellipsis. From
// lg up it has a fixed width matching the right-hand block of TopBar, which keeps search centered.
export function BrandLink(): React.ReactNode {
  return (
    <Link
      href="/pipeline"
      aria-label={`${STRINGS.app.name} home`}
      className="min-w-0 truncate text-base font-semibold tracking-tight transition-opacity hover:opacity-80 sm:shrink-0 lg:w-72"
    >
      {STRINGS.app.name}
    </Link>
  );
}
