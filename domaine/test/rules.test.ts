import assert from "node:assert/strict";
import { test } from "node:test";

process.env.BASE_URL ??= "http://localhost:3000";
process.env.DATABASE_URL ??= "postgres://unused";
const { decideAccess, readIdToken, hashToken, mayBootstrap } = await import("../server/auth.ts");
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
test("the setup code opens the door once: only while no administrator exists, and only the right code", () => {
  const hash = hashToken("the-right-setup-code-0123456789");
  assert.equal(mayBootstrap("the-right-setup-code-0123456789", hash, 0), true);
  assert.equal(mayBootstrap("the-right-setup-code-0123456789", hash, 1), false);
  assert.equal(mayBootstrap("a-wrong-code-0123456789abcdef", hash, 0), false);
  assert.equal(mayBootstrap("", hash, 0), false);
  assert.equal(mayBootstrap("the-right-setup-code-0123456789", "", 0), false);
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

/* ---------- Google Drive: documents created from the app ---------- */
const { driveAuthUrl, driveSeen, docHtml, docMeta, DRIVE_SCOPE } = await import("../server/drive.ts");

test("Drive consent asks only for the files the app creates, and for a lasting grant", () => {
  const u = new URL(driveAuthUrl("client", "https://x.fr", "drive.abc"));
  assert.equal(u.origin + u.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(u.searchParams.get("redirect_uri"), "https://x.fr/auth/callback");
  assert.deepEqual(u.searchParams.get("scope")?.split(" ").sort(), ["email", "openid", DRIVE_SCOPE].sort());
  assert.equal(DRIVE_SCOPE, "https://www.googleapis.com/auth/drive.file");
  assert.equal(u.searchParams.get("access_type"), "offline");
  assert.equal(u.searchParams.get("state"), "drive.abc");
});

test("the pages never receive the Drive token, and the team not even the account", () => {
  const stored = { refresh: "secret-token", email: "a@ex.fr", folder: "folder1234567890" };
  assert.deepEqual(driveSeen(stored, "admin"), { on: true, email: "a@ex.fr", folder: "folder1234567890" });
  assert.deepEqual(driveSeen(stored, "team"), { on: true });
  assert.deepEqual(driveSeen(null, "admin"), { on: false });
  assert.deepEqual(driveSeen({ email: "a@ex.fr" }, "admin"), { on: false });
  assert.ok(!JSON.stringify(driveSeen(stored, "admin")).includes("secret"));
});

test("a document sent to Drive carries text and layout only", () => {
  const html = docHtml("Caution <b>", `<h1>Caution</h1><script>alert(1)</script><p onclick="x()">Dépôt de <mark>2 500 €</mark></p><img src=x onerror=y><a href="javascript:z">l</a>`);
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(html.includes("<title>Caution &lt;b&gt;</title>"));
  assert.ok(html.includes("Dépôt de 2 500 €"));
  for (const bad of ["<script", "onclick", "onerror", "<img", "javascript:", "<mark"]) assert.ok(!html.includes(bad), bad);
});

test("a new document is a Google Docs file in the one folder given", () => {
  assert.deepEqual(docMeta("Caution", "f1"), { name: "Caution", mimeType: "application/vnd.google-apps.document", parents: ["f1"] });
});

const { moveQuery, folderName } = await import("../server/drive.ts");
test("a stay's folder moves only when it is not where it should be", () => {
  assert.equal(moveQuery(["clients"], "clients"), "");
  assert.equal(moveQuery(["prospects"], "clients"), "addParents=clients&removeParents=prospects");
  // A folder left at the root by an earlier version, or filed in two places, ends up in one place only.
  assert.equal(moveQuery(["root", "prospects"], "prospects"), "removeParents=root");
  assert.equal(moveQuery([], "prospects"), "addParents=prospects");
});
test("a folder name is plain text of a reasonable length", () => {
  assert.equal(folderName("  Mariage Lola & Lucas\n22 au 24 juillet 2027 "), "Mariage Lola & Lucas 22 au 24 juillet 2027");
  assert.equal(folderName("a/b\\c"), "a b c");
  assert.equal(folderName("x".repeat(300)).length, 120);
  assert.equal(folderName(" \n "), "Séjour");
});

const { editedSince } = await import("../server/drive.ts");
test("a document counts as edited by hand only when it changed after the app's own write settled", () => {
  assert.equal(editedSince("2026-11-19T10:42:55.997Z", "2026-11-19T10:42:55.997Z"), false);
  // Google finishes converting a moment after it answers: that is still the app's own write.
  assert.equal(editedSince("2026-11-19T10:42:55.501Z", "2026-11-19T10:42:55.997Z"), false);
  assert.equal(editedSince("2026-11-19T10:42:55.997Z", "2026-11-19T10:43:30.000Z"), true);
  // Without a record of the last write, nothing is ever overwritten.
  assert.equal(editedSince("", "2026-11-19T10:43:30.000Z"), true);
  assert.equal(editedSince("not a date", "2026-11-19T10:43:30.000Z"), true);
});

const { lockBody } = await import("../server/drive.ts");
test("a document leaving the draft state is locked in Drive, with the reason shown to whoever opens it", () => {
  assert.deepEqual(lockBody(true, "À signer"), { contentRestrictions: [{ readOnly: true, reason: "À signer" }] });
  assert.deepEqual(lockBody(false, "whatever"), { contentRestrictions: [{ readOnly: false }] });
  assert.equal(lockBody(true, "x".repeat(500)).contentRestrictions[0].reason?.length, 120);
});
