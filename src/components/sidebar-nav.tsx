"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSignature,
  KanbanSquare,
  Paperclip,
  ScrollText,
  Users,
  Wallet,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type NavItem = {
  key: string;
  label: string;
  href: string | null; // null : rubrique pas encore construite
  section: "work" | "admin";
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dossiers: KanbanSquare,
  contacts: Users,
  calendrier: CalendarDays,
  devis: FileSignature,
  echeancier: Wallet,
  pieces: Paperclip,
  fiche: ClipboardList,
  journal: ScrollText,
};

// Navigation sombre, repliable sur ordinateur. Sur téléphone, elle devient une bande
// en haut de page dont les entrées passent à la ligne (jamais de défilement horizontal).
export function SidebarNav({ items, soonLabel }: { items: NavItem[]; soonLabel: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("common");

  return (
    <aside
      className={cn(
        "z-10 flex w-full shrink-0 flex-col bg-sidebar text-sidebar-foreground md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)] md:transition-[width] md:duration-200",
        collapsed ? "md:w-14" : "md:w-56",
      )}
    >
      <nav aria-label={t("mainNav")} className="flex-1 p-2 md:overflow-y-auto">
        <ul className="flex flex-wrap gap-1 md:flex-col md:gap-0.5">
          {items.map((item) => {
            const Icon = ICONS[item.key] ?? KanbanSquare;
            const active =
              item.href !== null && (pathname === item.href || pathname.startsWith(`${item.href}/`));
            const base = cn(
              "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
              collapsed && "md:justify-center md:px-0",
            );
            const label = <span className={cn("truncate", collapsed && "md:hidden")}>{item.label}</span>;

            return (
              <li key={item.key} className={cn(item.section === "admin" && "md:mt-4")}>
                {item.href === null ? (
                  <span
                    aria-disabled="true"
                    title={`${item.label} (${soonLabel})`}
                    className={cn(base, "cursor-default text-sidebar-muted")}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                    <span
                      className={cn(
                        "ml-auto hidden rounded border border-sidebar-border px-1.5 py-px text-[10px] md:inline",
                        collapsed && "md:hidden",
                      )}
                    >
                      {soonLabel}
                    </span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      base,
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? t("expand") : undefined}
        className={cn(
          "hidden items-center gap-3 border-t border-sidebar-border px-4 py-3 text-sm text-sidebar-muted hover:text-sidebar-foreground md:flex",
          collapsed && "justify-center px-0",
        )}
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        {!collapsed && t("collapse")}
      </button>
    </aside>
  );
}
