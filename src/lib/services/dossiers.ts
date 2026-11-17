import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { clients, dossierNotes, dossiers, journal, organisations } from "@/db/schema";
import type { CurrentUser } from "@/lib/current-user";
import {
  CLIENT_LANGUAGES,
  DOSSIER_STATUSES,
  DOSSIER_TYPES,
  isOneOf,
  type ClientLanguage,
  type DossierStatus,
  type DossierType,
} from "@/lib/dossiers";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { recordEvent } from "@/lib/journal";
import { assertCan } from "@/lib/permissions";
import { optionalCount, optionalDate, optionalText, requiredText } from "@/lib/validation";

export type DossierInput = {
  clientName: unknown;
  clientEmail?: unknown;
  clientPhone?: unknown;
  clientLanguage?: unknown;
  clientCountry?: unknown;
  type: unknown;
  targetDate?: unknown;
  guests?: unknown;
  source?: unknown;
};

export type DossierListItem = {
  id: string;
  number: number;
  clientName: string;
  type: DossierType;
  status: DossierStatus;
  targetDate: string | null;
  guests: number | null;
  source: string | null;
};

function parseInput(input: DossierInput) {
  if (!isOneOf(DOSSIER_TYPES, input.type)) throw new ValidationError("invalid_type");
  const language: ClientLanguage = isOneOf(CLIENT_LANGUAGES, input.clientLanguage)
    ? input.clientLanguage
    : "fr";
  return {
    client: {
      name: requiredText(input.clientName, "client_required"),
      email: optionalText(input.clientEmail),
      phone: optionalText(input.clientPhone, 50),
      language,
      country: optionalText(input.clientCountry, 80),
    },
    dossier: {
      type: input.type,
      targetDate: optionalDate(input.targetDate),
      guests: optionalCount(input.guests),
      source: optionalText(input.source, 120),
    },
  };
}

const actorOf = (actor: CurrentUser) => ({ id: actor.id, name: actor.name });

// Recherche sur le nom du client ou le numéro de dossier (« 12 », « D-0012 »).
function searchFilter(q: string | undefined): SQL | undefined {
  const text = q?.trim().slice(0, 100);
  if (!text) return undefined;
  const pattern = `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const digits = /^(?:d-?)?0*(\d{1,9})$/i.exec(text)?.[1];
  return digits ? or(ilike(clients.name, pattern), eq(dossiers.number, Number(digits))) : ilike(clients.name, pattern);
}

export async function listDossiers(
  actor: CurrentUser,
  filter: { q?: string; status?: DossierStatus } = {},
): Promise<DossierListItem[]> {
  assertCan(actor.role, "dossier.read");
  return db
    .select({
      id: dossiers.id,
      number: dossiers.number,
      clientName: clients.name,
      type: dossiers.type,
      status: dossiers.status,
      targetDate: dossiers.targetDate,
      guests: dossiers.guests,
      source: dossiers.source,
    })
    .from(dossiers)
    .innerJoin(clients, eq(clients.id, dossiers.clientId))
    .where(
      and(
        eq(dossiers.organisationId, actor.organisationId),
        filter.status ? eq(dossiers.status, filter.status) : undefined,
        searchFilter(filter.q),
      ),
    )
    .orderBy(asc(sql`${dossiers.targetDate} IS NULL`), asc(dossiers.targetDate), asc(dossiers.number));
}

export type ContactListItem = {
  clientId: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  language: string;
  dossierId: string;
  dossierNumber: number;
  dossierStatus: DossierStatus;
};

export async function listContacts(actor: CurrentUser): Promise<ContactListItem[]> {
  assertCan(actor.role, "dossier.read");
  return db
    .select({
      clientId: clients.id,
      name: clients.name,
      email: clients.email,
      phone: clients.phone,
      country: clients.country,
      language: clients.language,
      dossierId: dossiers.id,
      dossierNumber: dossiers.number,
      dossierStatus: dossiers.status,
    })
    .from(clients)
    .innerJoin(dossiers, eq(dossiers.clientId, clients.id))
    .where(eq(clients.organisationId, actor.organisationId))
    .orderBy(asc(clients.name), asc(dossiers.number));
}

export type DossierHistoryEntry = {
  id: string;
  action: string;
  actorName: string;
  at: Date;
  detail: Record<string, unknown> | null;
};

// Historique d'un dossier : les entrées du journal qui le concernent, y compris
// celles de ses réservations. Lisible avec le droit de lire le dossier,
// alors que le journal complet reste réservé à l'administrateur.
export async function getDossierHistory(actor: CurrentUser, dossierId: string): Promise<DossierHistoryEntry[]> {
  assertCan(actor.role, "dossier.read");
  const [owned] = await db
    .select({ id: dossiers.id })
    .from(dossiers)
    .where(and(eq(dossiers.id, dossierId), eq(dossiers.organisationId, actor.organisationId)))
    .limit(1);
  if (!owned) throw new NotFoundError("dossier");

  return db
    .select({
      id: journal.id,
      action: journal.action,
      actorName: journal.actorName,
      at: journal.at,
      detail: journal.detail,
    })
    .from(journal)
    .where(
      and(
        eq(journal.organisationId, actor.organisationId),
        or(eq(journal.objectId, dossierId), sql`${journal.detail} ->> 'dossierId' = ${dossierId}`),
      ),
    )
    .orderBy(desc(journal.at))
    .limit(200);
}

export async function getDossier(actor: CurrentUser, dossierId: string) {
  assertCan(actor.role, "dossier.read");
  const [row] = await db
    .select({ dossier: dossiers, client: clients })
    .from(dossiers)
    .innerJoin(clients, eq(clients.id, dossiers.clientId))
    .where(and(eq(dossiers.id, dossierId), eq(dossiers.organisationId, actor.organisationId)))
    .limit(1);
  if (!row) throw new NotFoundError("dossier");

  const notes = await db
    .select()
    .from(dossierNotes)
    .where(eq(dossierNotes.dossierId, dossierId))
    .orderBy(desc(dossierNotes.createdAt));

  return { ...row, notes };
}

export async function createDossier(actor: CurrentUser, input: DossierInput) {
  assertCan(actor.role, "dossier.write");
  const parsed = parseInput(input);

  return db.transaction(async (tx) => {
    // Verrou sur l'organisation : deux créations simultanées ne prennent pas le même numéro.
    await tx
      .select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.id, actor.organisationId))
      .for("update");

    const [{ next }] = await tx
      .select({ next: sql<number>`coalesce(max(${dossiers.number}), 0) + 1` })
      .from(dossiers)
      .where(eq(dossiers.organisationId, actor.organisationId));

    const [client] = await tx
      .insert(clients)
      .values({ ...parsed.client, organisationId: actor.organisationId })
      .returning();

    const [dossier] = await tx
      .insert(dossiers)
      .values({
        ...parsed.dossier,
        organisationId: actor.organisationId,
        clientId: client.id,
        number: Number(next),
      })
      .returning();

    await recordEvent(tx, {
      organisationId: actor.organisationId,
      actor: actorOf(actor),
      action: "dossier.created",
      objectType: "dossier",
      objectId: dossier.id,
      detail: { number: dossier.number, type: dossier.type },
    });

    return dossier;
  });
}

export async function updateDossier(actor: CurrentUser, dossierId: string, input: DossierInput) {
  assertCan(actor.role, "dossier.write");
  const parsed = parseInput(input);

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(dossiers)
      .where(and(eq(dossiers.id, dossierId), eq(dossiers.organisationId, actor.organisationId)))
      .limit(1)
      .for("update");
    if (!current) throw new NotFoundError("dossier");

    await tx.update(clients).set(parsed.client).where(eq(clients.id, current.clientId));
    const [updated] = await tx
      .update(dossiers)
      .set({ ...parsed.dossier, updatedAt: new Date() })
      .where(eq(dossiers.id, dossierId))
      .returning();

    await recordEvent(tx, {
      organisationId: actor.organisationId,
      actor: actorOf(actor),
      action: "dossier.updated",
      objectType: "dossier",
      objectId: dossierId,
    });

    return updated;
  });
}

export async function changeDossierStatus(actor: CurrentUser, dossierId: string, status: unknown) {
  assertCan(actor.role, "dossier.write");
  if (!isOneOf(DOSSIER_STATUSES, status)) throw new ValidationError("invalid_status");

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(dossiers)
      .where(and(eq(dossiers.id, dossierId), eq(dossiers.organisationId, actor.organisationId)))
      .limit(1)
      .for("update");
    if (!current) throw new NotFoundError("dossier");
    if (current.status === status) return current;

    const [updated] = await tx
      .update(dossiers)
      .set({ status, updatedAt: new Date() })
      .where(eq(dossiers.id, dossierId))
      .returning();

    await recordEvent(tx, {
      organisationId: actor.organisationId,
      actor: actorOf(actor),
      action: "dossier.status_changed",
      objectType: "dossier",
      objectId: dossierId,
      detail: { from: current.status, to: status },
    });

    return updated;
  });
}

export async function addDossierNote(actor: CurrentUser, dossierId: string, body: unknown) {
  assertCan(actor.role, "dossier.write");
  const text = requiredText(body, "note_required", 5000);

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ id: dossiers.id })
      .from(dossiers)
      .where(and(eq(dossiers.id, dossierId), eq(dossiers.organisationId, actor.organisationId)))
      .limit(1);
    if (!current) throw new NotFoundError("dossier");

    const [note] = await tx
      .insert(dossierNotes)
      .values({
        organisationId: actor.organisationId,
        dossierId,
        authorId: actor.id,
        authorName: actor.name,
        body: text,
      })
      .returning();

    await recordEvent(tx, {
      organisationId: actor.organisationId,
      actor: actorOf(actor),
      action: "dossier.note_added",
      objectType: "dossier",
      objectId: dossierId,
    });

    return note;
  });
}
