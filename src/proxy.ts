import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Toutes les pages, sauf l'API Auth.js, les fichiers Next et les ressources statiques.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
