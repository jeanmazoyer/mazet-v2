import { getTranslations } from "next-intl/server";
import { signOutAction } from "@/app/[locale]/(app)/actions";
import { SidebarNav, type NavItem } from "@/components/sidebar-nav";
import type { CurrentUser } from "@/lib/current-user";
import { can, type Permission } from "@/lib/permissions";

type Entry = Omit<NavItem, "label"> & { permission: Permission; labelKey: string };

// Les entrées visibles dépendent du rôle, calculé côté serveur.
// Une entrée masquée n'est pas seulement cachée : sa page refuse aussi l'accès.
const ENTRIES: Entry[] = [
  { key: "dossiers", href: "/dossiers", section: "work", permission: "dossier.read", labelKey: "nav.dossiers" },
  { key: "calendrier", href: "/calendrier", section: "work", permission: "calendar.read", labelKey: "nav.calendrier" },
  { key: "devis", href: null, section: "work", permission: "quote.write", labelKey: "nav.devis" },
  { key: "echeancier", href: null, section: "work", permission: "payment.manage", labelKey: "nav.echeancier" },
  { key: "pieces", href: null, section: "work", permission: "document.manage", labelKey: "nav.pieces" },
  { key: "fiche", href: null, section: "work", permission: "event_sheet.read", labelKey: "nav.fiche" },
  { key: "journal", href: "/journal", section: "admin", permission: "journal.read", labelKey: "nav.journal" },
];

export async function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const t = await getTranslations();

  const items: NavItem[] = ENTRIES.filter((e) => can(user.role, e.permission)).map((e) => ({
    key: e.key,
    href: e.href,
    section: e.section,
    label: t(e.labelKey),
  }));

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <SidebarNav
        items={items}
        sections={{ work: t("nav.sectionWork"), admin: t("nav.sectionAdmin") }}
        userName={user.name}
        roleLabel={t(`roles.${user.role}`)}
        signOutAction={signOutAction}
        soonLabel={t("common.soon")}
      />
      <main className="min-w-0 flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
