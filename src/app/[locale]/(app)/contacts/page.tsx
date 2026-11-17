import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { formatRef } from "@/lib/dossiers";
import { can } from "@/lib/permissions";
import { listContacts } from "@/lib/services/dossiers";

export default async function ContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || !can(user.role, "dossier.read")) notFound();

  const contacts = await listContacts(user);
  const t = await getTranslations("contacts");
  const td = await getTranslations("dossiers");

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {contacts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.name")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("columns.email")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.phone")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("columns.country")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("columns.language")}</TableHead>
                <TableHead>{t("columns.dossier")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.clientId}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="break-all text-status-blue underline-offset-4 hover:underline">
                        {c.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="text-status-blue underline-offset-4 hover:underline">
                        {c.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{c.country ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{td(`languages.${c.language}`)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/dossiers/${c.dossierId}`}
                      className="font-mono text-xs whitespace-nowrap underline-offset-4 hover:underline"
                    >
                      {formatRef(c.dossierNumber)}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge>{td(`statuses.${c.dossierStatus}`)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
