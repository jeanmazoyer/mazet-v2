// The deal's contact for an imported file: the first tenant, reused when the address book
// already knows their email so a returning client does not become two people.
import { and, eq, isNull } from "drizzle-orm";
import type { AppError } from "@/constants/errorIds";
import type { Db } from "@/db/client";
import { persons } from "@/db/schema/persons";
import { loadContactActor } from "@/features/contacts/actorAdapters";
import { createPerson } from "@/features/contacts/personsRepo";
import { personCreateInput } from "@/features/contacts/schemas";
import type { PermSetUser } from "@/features/permissions/effective";
import { err, ok, type Result } from "@/types/result";
import type { DossierTenant } from "./dossierSchema";

const CONTACT_LABEL = "work";

export async function findOrCreateContact(
  db: Db,
  actor: PermSetUser,
  tenant: DossierTenant,
  signal: AbortSignal,
): Promise<Result<string, AppError>> {
  const email = tenant.email?.trim() ?? "";
  if (email !== "") {
    const [known] = await db
      .select({ id: persons.id })
      .from(persons)
      .where(and(eq(persons.primaryEmail, email), isNull(persons.deletedAt)))
      .limit(1);
    signal.throwIfAborted();
    if (known !== undefined) return ok(known.id);
  }
  const phone = tenant.phone?.trim() ?? "";
  const input = personCreateInput.parse({
    name: tenant.fullName,
    emails: email === "" ? [] : [{ label: CONTACT_LABEL, value: email, primary: true }],
    phones: phone === "" ? [] : [{ label: CONTACT_LABEL, value: phone, primary: true }],
  });
  const created = await createPerson(db, await loadContactActor(db, actor, signal), input, signal);
  if (!created.ok) return err(created.error);
  return ok(created.value.id);
}
