"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDays,
  ClipboardList,
  FileSignature,
  FolderOpen,
  Languages,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  ScrollText,
  Wallet,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NavItem = {
  key: string;
  label: string;
  href: string | null; // null : rubrique pas encore construite
  section: "work" | "admin";
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dossiers: FolderOpen,
  calendrier: CalendarDays,
  devis: FileSignature,
  echeancier: Wallet,
  pieces: Paperclip,
  fiche: ClipboardList,
  journal: ScrollText,
};

export function SidebarNav({
  items,
  sections,
  userName,
  roleLabel,
  signOutAction,
  soonLabel,
}: {
  items: NavItem[];
  sections: { work: string; admin: string };
  userName: string;
  roleLabel: string;
  signOutAction: (formData: FormData) => Promise<void>;
  soonLabel: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common");

  const otherLocale = locale === "fr" ? "en" : "fr";

  function renderItem(item: NavItem) {
    const Icon = ICONS[item.key] ?? FolderOpen;
    const active = item.href !== null && (pathname === item.href || pathname.startsWith(`${item.href}/`));
    const base = cn(
      "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
      collapsed && "justify-center px-2",
    );

    if (item.href === null) {
      return (
        <li key={item.key}>
          <span
            aria-disabled="true"
            title={collapsed ? `${item.label} (${soonLabel})` : undefined}
            className={cn(base, "cursor-default text-muted-foreground/70")}
          >
            <Icon className="size-4" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                <Badge tone="muted" className="hidden md:inline-flex">{soonLabel}</Badge>
              </>
            )}
          </span>
        </li>
      );
    }

    return (
      <li key={item.key}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          title={collapsed ? item.label : undefined}
          className={cn(
            base,
            active
              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Icon className="size-4" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      </li>
    );
  }

  const work = items.filter((i) => i.section === "work");
  const admin = items.filter((i) => i.section === "admin");

  return (
    <aside
      className={cn(
        "sticky top-0 z-10 flex w-full shrink-0 flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:h-dvh md:border-b-0 md:border-r md:transition-[width] md:duration-200",
        collapsed ? "md:w-16" : "md:w-60",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3 md:py-4">
        {!collapsed && <span className="px-1 text-sm font-semibold tracking-tight">{t("appName")}</span>}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? t("expand") : t("collapse")}
          aria-expanded={!collapsed}
          className="hidden size-8 items-center justify-center rounded-md hover:bg-sidebar-accent md:inline-flex"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav aria-label="Principal" className="flex flex-1 gap-2 overflow-x-auto px-2 pb-2 md:block md:overflow-y-auto md:overflow-x-visible md:pb-0">
        {work.length > 0 && (
          <div className="md:mb-4">
            {!collapsed && (
              <p className="hidden px-2.5 pb-1 text-xs font-medium text-muted-foreground md:block">{sections.work}</p>
            )}
            <ul className="flex gap-1 md:flex-col md:gap-0.5">{work.map(renderItem)}</ul>
          </div>
        )}
        {admin.length > 0 && (
          <div className="md:mb-4">
            {!collapsed && (
              <p className="hidden px-2.5 pb-1 text-xs font-medium text-muted-foreground md:block">{sections.admin}</p>
            )}
            <ul className="flex gap-1 md:flex-col md:gap-0.5">{admin.map(renderItem)}</ul>
          </div>
        )}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="hidden px-1 md:block">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        )}
        <div className={cn("flex items-center gap-1", collapsed ? "flex-col" : "justify-between")}>
          <Link
            href={pathname}
            locale={otherLocale}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs hover:bg-sidebar-accent"
            hrefLang={otherLocale}
          >
            <Languages className="size-3.5" />
            {!collapsed && t("switchLanguage")}
          </Link>
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs hover:bg-sidebar-accent"
            >
              <LogOut className="size-3.5" />
              {!collapsed && t("signOut")}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}


