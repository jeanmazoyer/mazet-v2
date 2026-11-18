import type { Role } from "./auth.ts";

export type Doc = Record<string, unknown> & { docs?: Array<Record<string, unknown>> };
export const DEAL_ID = /^[A-Za-z0-9_-]{1,48}$/;

/** The stored form of a deal: without the fields the page adds for its own use. */
export function stored(doc: Doc): Doc {
  const { _v, _hidden, ...rest } = doc;
  return rest;
}

/** What a person may read: the team never receives the documents reserved to administrators. */
export function forRole(doc: Doc, role: Role): Doc {
  if (role === "admin" || !Array.isArray(doc.docs)) return doc;
  const docs = doc.docs.filter((x) => x.admin !== true);
  return { ...doc, docs, _hidden: doc.docs.length - docs.length };
}

/**
 * What is written when the team saves a deal: their version, plus the reserved documents they
 * could not see, so a save from the team never deletes them. The team cannot add one either.
 */
export function mergeForSave(incoming: Doc, current: Doc | null, role: Role): Doc {
  const doc = stored(incoming);
  if (role === "admin") return doc;
  const kept = (current?.docs ?? []).filter((x) => x.admin === true);
  return { ...doc, docs: [...(doc.docs ?? []).filter((x) => x.admin !== true), ...kept] };
}
