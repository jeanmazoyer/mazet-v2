// Les appels à Documenso (API v2) pour les contrats : créer l'enveloppe avec le PDF, l'envoyer au client,
// la relire. Chaque appel a une limite de temps : un service qui ne répond pas ne bloque pas l'application.
import { envelopeBody, type Contract } from "./signature.ts";

export class DocumensoError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export type DocConfig = { base: string; token: string };
export type Envelope = { id: string; status?: string; envelopeItems?: Array<Record<string, unknown>> };
const LIMIT_MS = 20_000;

// Le message d'erreur ne reprend jamais le jeton : il peut finir dans un journal.
async function call(cfg: DocConfig, path: string, init: { method: "GET" | "POST"; body?: FormData | string; json?: boolean }, limit = LIMIT_MS): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${cfg.base}${path}`, {
      method: init.method, signal: AbortSignal.timeout(limit), body: init.body,
      headers: { authorization: cfg.token, ...(init.json ? { "content-type": "application/json" } : {}) },
    });
  } catch {
    // Pas de réponse à temps : une erreur à traiter, pas une exception à laisser remonter.
    throw new DocumensoError(504, "Documenso n'a pas répondu à temps");
  }
  if (!res.ok) throw new DocumensoError(res.status, `Documenso a refusé la demande (${res.status})`);
  return res.json();
}

/** Crée l'enveloppe : le contrat en PDF, et le client comme seul signataire. */
export async function createEnvelope(cfg: DocConfig, c: Contract, file: Uint8Array, fileName: string): Promise<{ id: string }> {
  const form = new FormData();
  form.append("payload", JSON.stringify(envelopeBody(c)));
  form.append("files", new Blob([file], { type: "application/pdf" }), fileName);
  const out = await call(cfg, "/envelope/create", { method: "POST", body: form });
  const id = (out as { id?: unknown }).id;
  if (typeof id !== "string" || !id) throw new DocumensoError(502, "Documenso n'a pas renvoyé d'identifiant");
  return { id };
}

/** Envoie l'enveloppe au client : c'est à ce moment-là que le client reçoit le lien pour signer. */
export async function distributeEnvelope(cfg: DocConfig, id: string): Promise<void> {
  await call(cfg, "/envelope/distribute", { method: "POST", body: JSON.stringify({ envelopeId: id }), json: true });
}

/** Relit l'enveloppe : son état, et ses fichiers. */
export async function getEnvelope(cfg: DocConfig, id: string, limit = LIMIT_MS): Promise<Envelope> {
  const out = await call(cfg, `/envelope/${encodeURIComponent(id)}`, { method: "GET" }, limit);
  return out as Envelope;
}
