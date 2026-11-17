// Money, dates and rates as each language writes them. Figures are fixed in euros: the business
// invoices in France, and the client's language only changes how the amount reads.
export type DocLanguage = "fr" | "en";

const LOCALE: Record<DocLanguage, string> = { fr: "fr-FR", en: "en-GB" };

// Intl separates thousands with narrow no-break spaces, which the PDF's standard fonts cannot
// draw. They are folded to plain spaces here, once, for every figure.
const PDF_SPACES = /[  ]/g;

export function formatCents(cents: number, lang: DocLanguage): string {
  return new Intl.NumberFormat(LOCALE[lang], { style: "currency", currency: "EUR" })
    .format(cents / 100)
    .replace(PDF_SPACES, " ");
}

// An ISO day (YYYY-MM-DD) read as a calendar date, never shifted by the viewer's time zone.
// French writes the month out in full; English uses the short form, as in "30 Jun 2027".
export function formatDate(iso: string, lang: DocLanguage): string {
  const options: Intl.DateTimeFormatOptions =
    lang === "fr"
      ? { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
      : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat(LOCALE[lang], options).format(new Date(`${iso}T00:00:00Z`));
}

// 550 basis points -> "5,5 %" (fr) or "5.5%" (en).
export function formatRate(bp: number, lang: DocLanguage): string {
  const value = new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 2 }).format(bp / 100);
  return lang === "fr" ? `${value} %` : `${value}%`;
}
