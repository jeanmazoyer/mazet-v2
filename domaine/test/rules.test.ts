import assert from "node:assert/strict";
import { test } from "node:test";

process.env.BASE_URL ??= "http://localhost:3000";
process.env.DATABASE_URL ??= "postgres://unused";
const { decideAccess, readIdToken, hashToken } = await import("../server/auth.ts");
const { forRole, mergeForSave, stored } = await import("../server/deals.ts");
const { parseIcal } = await import("../server/ical.ts");

const token = (p: Record<string, unknown>) => `x.${Buffer.from(JSON.stringify(p)).toString("base64url")}.y`;
const good = { iss: "https://accounts.google.com", aud: "client", email: "A@Ex.fr", email_verified: true, name: "A", exp: 2_000_000_000 };

test("only administrators and invited people get in, and only with a verified address", () => {
  assert.deepEqual(decideAccess("a@ex.fr", true, ["a@ex.fr"], null), { ok: true, role: "admin" });
  assert.deepEqual(decideAccess("b@ex.fr", true, ["a@ex.fr"], "team"), { ok: true, role: "team" });
  assert.equal(decideAccess("c@ex.fr", true, ["a@ex.fr"], null).ok, false);
  assert.equal(decideAccess("a@ex.fr", false, ["a@ex.fr"], null).ok, false);
});
test("a Google token for another app, expired, or from elsewhere is not an identity", () => {
  assert.equal(readIdToken(token(good), "client", 1_000)?.email, "a@ex.fr");
  assert.equal(readIdToken(token({ ...good, aud: "other" }), "client", 1_000), null);
  assert.equal(readIdToken(token({ ...good, exp: 1 }), "client", 5_000), null);
  assert.equal(readIdToken(token({ ...good, iss: "https://evil.example" }), "client", 1_000), null);
  assert.equal(readIdToken("garbage", "client", 1_000), null);
});
test("a session token is never stored as such", () => { assert.notEqual(hashToken("abc"), "abc"); assert.equal(hashToken("abc").length, 64); });
test("the team neither reads nor loses the documents reserved to administrators", () => {
  const deal = { id: "d", title: "T", docs: [{ t: "Contrat", admin: true }, { t: "Devis" }] };
  const seen = forRole(deal, "team");
  assert.deepEqual(seen.docs, [{ t: "Devis" }]);
  assert.equal(seen._hidden, 1);
  const saved = mergeForSave({ ...seen, title: "T2", docs: [{ t: "Devis" }, { t: "Faux", admin: true }] }, deal, "team");
  assert.deepEqual(saved.docs, [{ t: "Devis" }, { t: "Contrat", admin: true }]);
  assert.equal(saved.title, "T2");
  assert.equal("_hidden" in saved, false);
  assert.deepEqual(stored({ a: 1, _v: 3 }), { a: 1 });
});
test("an iCal booking keeps its arrival and departure days", () => {
  const ics = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20270503\r\nDTEND;VALUE=DATE:20270505\r\nSUMMARY:Reserved\r\nEND:VEVENT\r\nEND:VCALENDAR";
  assert.deepEqual(parseIcal(ics, { id: "s1", kind: "Airbnb", name: "Mas", url: "" }), [{ src: "s1", title: "Airbnb, Mas · Reserved", start: "2027-05-03", end: "2027-05-05" }]);
});
