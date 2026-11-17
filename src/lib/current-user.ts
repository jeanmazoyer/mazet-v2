import { and, eq, sql } from "drizzle-orm";
import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { Role } from "@/lib/permissions";

export type CurrentUser = {
  id: string;
  organisationId: string;
  email: string;
  name: string;
  role: Role;
};

// Le rôle est relu en base à chaque requête : une désactivation ou un
// changement de rôle prend effet immédiatement, sans attendre la fin de session.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  const [row] = await db
    .select({
      id: users.id,
      organisationId: users.organisationId,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(and(sql`lower(${users.email}) = ${email}`, eq(users.active, true)))
    .limit(1);

  return row ?? null;
});
