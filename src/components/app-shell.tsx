import { Plus, Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { signOutAction } from "@/app/[locale]/(app)/actions";
import { SidebarNav, type NavItem } from "@/components/sidebar-nav";
import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { Link } from "@/i18n/navigation";
import type { CurrentUser } from "@/lib/current-user";
import { can, type Permission } from "@/lib/permissions";

type Entry = Omit<NavItem, "label"> & { permission: Permission; labelKey: string };

// Les entrées visibles dépendent du rôle, calculé côté serveur.
// Une entrée masquée n'est pas seulement cachée : sa page refuse aussi l'accès.
const ENTRIES: Entry[] = [
  { key: "dossiers", href: "/dossiers", section: "work", permission: "dossier.read", labelKey: "nav.dossiers" },
  { key: "contacts", href: "/contacts", section: "work", permission: "dossier.read", labelKey: "nav.contacts" },
  { key: "calendrier", href: "/calendrier", section: "work", permission: "calendar.read", labelKey: "nav.calendrier" },
  { key: "devis", href: null, section: "work", permission: "quote.write", labelKey: "nav.devis" },
  { key: "echeancier", href: null, section: "work", permission: "payment.manage", labelKey: "nav.echeancier" },
  { key: "pieces", href: null, section: "work", permission: "document.manage", labelKey: "nav.pieces" },
  { key: "fiche", href: null, section: "work", permission: "event_sheet.read", labelKey: "nav.fiche" },
  { key: "journal", href: "/journal", section: "admin", permission: "journal.read", labelKey: "nav.journal" },
];

export async function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const t = await getTranslations();
  const locale = await getLocale();

  const items: NavItem[] = ENTRIES.filter((e) => can(user.role, e.permission)).map((e) => ({
    key: e.key,
    href: e.href,
    section: e.section,
    label: t(e.labelKey),
  }));
  const canSearch = can(user.role, "dossier.read");
  const canCreate = can(user.role, "dossier.write");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
        <Link href="/" className="shrink-0 text-base font-semibold tracking-tight md:w-52">
          {t("common.appName")}
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          {canSearch ? (
            // Recherche simple : envoie vers la liste des dossiers filtrée.
            <form action={`/${locale}/dossiers`} role="search" className="relative w-full max-w-md min-w-0">
              <input type="hidden" name="vue" value="liste" />
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                aria-label={t("common.searchLabel")}
                placeholder={t("common.search")}
                className="h-9 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
              />
            </form>
          ) : null}
          {canCreate ? (
            <Link
              href="/dossiers/nouveau"
              aria-label={t("common.quickAdd")}
              title={t("common.quickAdd")}
              className={buttonVariants({ size: "icon", className: "shrink-0" })}
            >
              <Plus />
            </Link>
          ) : null}
        </div>

        <UserMenu name={user.name} roleLabel={t(`roles.${user.role}`)} signOutAction={signOutAction} />
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <SidebarNav items={items} soonLabel={t("common.soon")} />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-[1800px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
