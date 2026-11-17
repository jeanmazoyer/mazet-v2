"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages, LogOut } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function UserMenu({
  name,
  roleLabel,
  signOutAction,
}: {
  name: string;
  roleLabel: string;
  signOutAction: (formData: FormData) => Promise<void>;
}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const otherLocale = locale === "fr" ? "en" : "fr";

  return (
    <details className="relative">
      <summary
        aria-label={`${t("account")} : ${name}`}
        className="flex size-8 cursor-pointer list-none items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden"
      >
        {initials(name)}
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-border bg-card p-1 shadow-lg">
        <div className="border-b border-border px-3 py-2">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <Link
          href={pathname}
          locale={otherLocale}
          hrefLang={otherLocale}
          className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
        >
          <Languages className="size-4" />
          {t("switchLanguage")}
        </Link>
        <form action={signOutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent">
            <LogOut className="size-4" />
            {t("signOut")}
          </button>
        </form>
      </div>
    </details>
  );
}
