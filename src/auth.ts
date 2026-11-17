import { and, eq, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema";

// Connexion Google. Seules les adresses présentes et actives dans la table
// `users` peuvent entrer : la liste autorisée est la base, pas le code.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/fr/login",
    error: "/fr/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      if (!email || profile?.email_verified !== true) return false;

      const [row] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(sql`lower(${users.email}) = ${email}`, eq(users.active, true)))
        .limit(1);

      return Boolean(row);
    },
  },
});
