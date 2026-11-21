import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

const { createEnvelope, distributeEnvelope, getEnvelope, DocumensoError } = await import("../server/documenso.ts");

type Seen = { method: string; url: string; auth: string; type: string; body: string };
let server: Server, base = "", seen: Seen[] = [], answer: (req: IncomingMessage, res: ServerResponse) => void = () => {};

before(async () => {
  server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      seen.push({ method: req.method ?? "", url: req.url ?? "", auth: String(req.headers.authorization ?? ""), type: String(req.headers["content-type"] ?? ""), body: Buffer.concat(chunks).toString("utf8") });
      answer(req, res);
    });
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v2`;
});
after(() => new Promise<void>((ok) => server.close(() => ok())));

const json = (res: ServerResponse, status: number, body: unknown) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const cfg = () => ({ base, token: "api_fictif_000000000000000000" });
const contract = { title: "Contrat fictif Alba & Bruno", email: "alba@example.test", name: "Alba Fictive" };
const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

test("a contract is created with the token, the client as signer, and its PDF attached", async () => {
  seen = [];
  answer = (_req, res) => json(res, 200, { id: "envelope_fictif_1", recipients: [] });
  const out = await createEnvelope(cfg(), contract, pdf, "contrat-fictif.pdf");
  assert.equal(out.id, "envelope_fictif_1");
  const [req] = seen;
  assert.equal(req.method, "POST");
  assert.equal(req.url, "/api/v2/envelope/create");
  assert.equal(req.auth, "api_fictif_000000000000000000");
  assert.match(req.type, /^multipart\/form-data/);
  assert.match(req.body, /name="payload"/);
  assert.match(req.body, /"role":"SIGNER"/);
  assert.match(req.body, /"email":"alba@example\.test"/);
  assert.match(req.body, /name="files"; filename="contrat-fictif\.pdf"/);
  assert.match(req.body, /Content-Type: application\/pdf/);
});

test("a contract is sent for signature once created", async () => {
  seen = [];
  answer = (_req, res) => json(res, 200, { id: "envelope_fictif_1" });
  await distributeEnvelope(cfg(), "envelope_fictif_1");
  const [req] = seen;
  assert.equal(req.method, "POST");
  assert.equal(req.url, "/api/v2/envelope/distribute");
  assert.deepEqual(JSON.parse(req.body), { envelopeId: "envelope_fictif_1" });
});

test("an envelope can be read back by its identifier", async () => {
  seen = [];
  answer = (_req, res) => json(res, 200, { id: "envelope_fictif_1", status: "PENDING", envelopeItems: [] });
  const env = await getEnvelope(cfg(), "envelope_fictif_1");
  assert.equal(env.status, "PENDING");
  assert.equal(seen[0].method, "GET");
  assert.equal(seen[0].url, "/api/v2/envelope/envelope_fictif_1");
});

test("a refused token is an error with its status, and the token is never written in the message", async () => {
  answer = (_req, res) => json(res, 401, { message: "Unauthorized" });
  await assert.rejects(
    () => getEnvelope(cfg(), "envelope_fictif_1"),
    (e: unknown) => e instanceof DocumensoError && e.status === 401 && !e.message.includes("api_fictif"),
  );
});

test("a server that does not answer is given up after the limit, not waited for", async () => {
  answer = () => {};
  const started = Date.now();
  await assert.rejects(() => getEnvelope(cfg(), "envelope_fictif_1", 200));
  assert.ok(Date.now() - started < 5_000);
});
