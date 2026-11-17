import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { recordEvent } from "@/lib/journal";
import type { CurrentUser } from "@/lib/current-user";
import { assertCan, type Role } from "@/lib/permissions";
import { NotFoundError } from "@/lib/errors";

// Toute modification de compte passe par ici : droit vérifié, puis
// modification et entrée de journal dans la même transaction.
export async function changeUserRole(actor: CurrentUser, targetUserId: string, newRole: Role) {
  assertCan(actor.role, "accounts.manage");

  return db.transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1)
      .for("update");
    if (!target || target.organisationId !== actor.organisationId) {
      throw new NotFoundError("compte");
    }
    if (target.role === newRole) return target;

    const [updated] = await tx
      .update(users)
      .set({ role: newRole })
      .where(eq(users.id, targetUserId))
      .returning();

    await recordEvent(tx, {
      organisationId: actor.organisationId,
      actor: { id: actor.id, name: actor.name },
      action: "user.role_changed",
      objectType: "user",
      objectId: target.id,
      detail: { from: target.role, to: newRole },
    });

    return updated;
  });
}
