import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "./actions";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { error } = await searchParams;
  const t = await getTranslations("login");
  const tc = await getTranslations("common");

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8">
        <p className="text-sm font-medium text-muted-foreground">{tc("appName")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

        {error ? (
          <p role="alert" className="mt-4 rounded-md bg-accent p-3 text-sm text-accent-foreground">
            {t("accessDenied")}
          </p>
        ) : null}

        <form action={signInWithGoogle} className="mt-6">
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" className="w-full">
            {t("google")}
          </Button>
        </form>
      </Card>
    </main>
  );
}
