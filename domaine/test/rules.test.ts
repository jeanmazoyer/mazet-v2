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

/* ---------- Gmail: the conversations of a deal, read and answered from the app ---------- */
const { mailAuthUrl, MAIL_SCOPES, addressesOf, mailQuery, buildMime, toRaw, readMessage, cleanMailHtml, concerns } = await import("../server/mail.ts");
const b64 = (t: string) => Buffer.from(t, "utf8").toString("base64url");

test("the mailbox consent asks to read and to send, nothing more", () => {
  const u = new URL(mailAuthUrl("client", "https://x.fr", "gmail.abc"));
  assert.deepEqual(u.searchParams.get("scope")?.split(" ").sort(), ["email", "openid", ...MAIL_SCOPES].sort());
  assert.deepEqual([...MAIL_SCOPES].sort(), ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"]);
  assert.equal(u.searchParams.get("redirect_uri"), "https://x.fr/auth/callback");
  assert.equal(u.searchParams.get("access_type"), "offline");
});

test("only real addresses of the deal are searched, each one quoted", () => {
  const doc = { contact: { email: " Alba@Test.fr " }, mailAddrs: ["noe@test.fr", "à compléter", "x\" OR from:boss@corp.com", "alba@test.fr"] };
  assert.deepEqual(addressesOf(doc), ["alba@test.fr", "noe@test.fr"]);
  assert.equal(mailQuery(["alba@test.fr", "noe@test.fr"]), '{from:"alba@test.fr" to:"alba@test.fr" from:"noe@test.fr" to:"noe@test.fr"}');
  assert.deepEqual(addressesOf({ contact: { email: "à compléter" } }), []);
});

test("a message is built as a standard two-part e-mail, accents and thread headers included", () => {
  const mime = buildMime({ from: "Domaine <d@test.fr>", to: "alba@test.fr", subject: "Réservation été", html: "<p>Bonjour <b>Alba</b></p>", inReplyTo: "<abc@mail>", references: "<abc@mail>" }, "BOUND");
  assert.ok(mime.includes("To: alba@test.fr\r\n") && mime.includes("From: Domaine <d@test.fr>\r\n"));
  assert.ok(mime.includes(`Subject: =?UTF-8?B?${Buffer.from("Réservation été").toString("base64")}?=\r\n`));
  assert.ok(mime.includes("In-Reply-To: <abc@mail>\r\n") && mime.includes("References: <abc@mail>\r\n"));
  assert.ok(mime.includes('Content-Type: multipart/alternative; boundary="BOUND"'));
  const parts = mime.split("--BOUND");
  assert.equal(parts.length, 4);
  assert.ok(parts[1].includes("text/plain; charset=UTF-8") && Buffer.from(parts[1].split("\r\n\r\n")[1].trim(), "base64").toString("utf8").includes("Bonjour Alba"));
  assert.ok(parts[2].includes("text/html; charset=UTF-8") && Buffer.from(parts[2].split("\r\n\r\n")[1].trim(), "base64").toString("utf8").includes("<b>Alba</b>"));
  assert.ok(/^[A-Za-z0-9_-]+$/.test(toRaw(mime)));
  // No header can be smuggled in through the subject or the recipient.
  assert.throws(() => buildMime({ from: "d@test.fr", to: "a@test.fr\r\nBcc: x@evil.fr", subject: "s", html: "<p>x</p>" }, "B"));
  assert.ok(!buildMime({ from: "d@test.fr", to: "a@test.fr", subject: "s\r\nBcc: x@evil.fr", html: "<p>x</p>" }, "B").includes("\r\nBcc:"));
});

test("a received message is read into sender, date and safe content, without the quoted history", () => {
  const msg = { id: "m1", internalDate: "1795000000000", payload: { headers: [{ name: "From", value: "Alba Test <alba@test.fr>" }, { name: "To", value: "d@test.fr" }, { name: "Subject", value: "Re: Mariage" }, { name: "Message-ID", value: "<id1@mail>" }],
    mimeType: "multipart/alternative", parts: [{ mimeType: "text/plain", body: { data: b64("Bonjour") } }, { mimeType: "text/html", body: { data: b64('<div>Bonjour <script>alert(1)</script><a href="javascript:x" onclick="y()">lien</a><img src="http://t/p.gif"></div><div class="gmail_quote">ancien message</div>') } }] } };
  const m = readMessage(msg, "d@test.fr");
  assert.equal(m.from, "Alba Test <alba@test.fr>"); assert.equal(m.subject, "Re: Mariage"); assert.equal(m.mine, false); assert.equal(m.messageId, "<id1@mail>");
  assert.equal(m.at, new Date(1795000000000).toISOString());
  assert.ok(m.html.includes("Bonjour") && m.html.includes("lien"));
  for (const bad of ["<script", "javascript:", "onclick", "<img", "ancien message"]) assert.ok(!m.html.includes(bad), bad);
  assert.equal(readMessage({ ...msg, payload: { ...msg.payload, headers: [{ name: "From", value: "Le Domaine <D@Test.fr>" }] } }, "d@test.fr").mine, true);
  const plain = readMessage({ id: "m2", internalDate: "0", payload: { headers: [], mimeType: "text/plain", body: { data: b64("Ligne 1\n<b>pas du html</b>\n\nLe lun. 2 mars, X a écrit :\n> ancien") } } }, "d@test.fr");
  assert.ok(plain.html.includes("Ligne 1") && plain.html.includes("&lt;b&gt;") && !plain.html.includes("ancien"));
  const withFile = readMessage({ id: "m3", internalDate: "0", payload: { headers: [], mimeType: "multipart/mixed", parts: [{ mimeType: "text/plain", body: { data: b64("Voir le devis") } }, { mimeType: "application/pdf", filename: "Devis <1>.pdf", body: {} }] } }, "d@test.fr");
  assert.deepEqual(withFile.files, ["Devis <1>.pdf"]); assert.deepEqual(m.files, []);
});

test("mail content keeps simple formatting and safe links only", () => {
  const out = cleanMailHtml('<p style="color:red">Texte <a href="https://ex.fr/a?b=1" target="_top">ici</a> <a href="mailto:a@b.fr">mail</a> <a href="data:text/html,x">non</a></p><table><tr><td>cellule</td></tr></table>');
  assert.ok(out.includes('<a href="https://ex.fr/a?b=1" target="_blank" rel="noopener noreferrer">ici</a>') && out.includes('href="mailto:a@b.fr"'));
  assert.ok(!out.includes("style=") && !out.includes("data:") && out.includes("cellule"));
});

test("a thread is shown only when one of the deal's addresses takes part in it", () => {
  const m = (from: string, to: string) => ({ from, to });
  assert.equal(concerns([m("Alba <alba@test.fr>", "d@test.fr")], ["alba@test.fr"]), true);
  assert.equal(concerns([m("d@test.fr", "Autre <autre@test.fr>, ALBA@test.fr")], ["alba@test.fr"]), true);
  assert.equal(concerns([m("boss@corp.com", "d@test.fr")], ["alba@test.fr"]), false);
  assert.equal(concerns([m("notalba@test.fr", "d@test.fr")], ["alba@test.fr"]), false);
});

test("a message can only go to an address of the deal, and the page never learns the mailbox's key", async () => {
  const { recipientFor, mailSeen } = await import("../server/mail.ts");
  const doc = { contact: { email: "alba@test.fr" }, mailAddrs: ["noe@test.fr"] };
  assert.equal(recipientFor(doc, ""), "alba@test.fr");
  assert.equal(recipientFor(doc, "NOE@test.fr"), "noe@test.fr");
  assert.equal(recipientFor(doc, "boss@corp.com"), null);
  assert.equal(recipientFor({ contact: { email: "à compléter" } }, ""), null);
  assert.deepEqual(mailSeen({ refresh: "secret", email: "d@test.fr" }, "admin"), { on: true, email: "d@test.fr" });
  assert.deepEqual(mailSeen({ refresh: "secret", email: "d@test.fr" }, "team"), { on: true });
  assert.deepEqual(mailSeen(null, "admin"), { on: false });
});
