import type React from "react";
import { NotificationsBell } from "@/features/notifications/ui/NotificationsBell";
import { GlobalAddMenu } from "@/features/quick-add/GlobalAddMenu";
import type { Appearance } from "@/features/theme/appearance";
import { BrandLink } from "./BrandLink";
import { SearchTrigger } from "./SearchTrigger";
import { UserMenu } from "./UserMenu";

export function TopBar({
  userId,
  userName,
  avatarUrl,
  appearance,
}: {
  userId: string;
  userName?: string;
  avatarUrl?: string | null;
  appearance?: Appearance;
}): React.ReactNode {
  // Side blocks are fixed-width from lg up (they keep the search centered) and shrink to their
  // content below it, so the bar never pushes a phone screen sideways. The width is set by the
  // app name, which must fit on one line: see BrandLink.
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-3 md:gap-4 md:px-4">
      <BrandLink />
      <div className="mx-auto flex w-full min-w-0 max-w-lg items-center gap-2">
        <search className="min-w-0 flex-1">
          <SearchTrigger />
        </search>
        {/* Global quick-add: opens Deal/Lead/Person/Organization create modals from any page. */}
        <GlobalAddMenu />
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1 md:gap-3 lg:w-72">
        <NotificationsBell userId={userId} />
        <UserMenu
          userId={userId}
          userName={userName}
          avatarUrl={avatarUrl}
          appearance={appearance}
        />
      </div>
    </header>
  );
}
