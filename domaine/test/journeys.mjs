// End-to-end check of the real app against a local server (see README): sign-in, saving,
// reload, a second person seeing the change live, version conflict, file upload, team rights.
// Run: BASE=http://localhost:3300 node test/journeys.mjs
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3300", out = [], errors = [];
const ok = (name, cond, seen = "") => out.push(`${cond ? "OK  " : "FAIL"} ${name}${cond ? "" : " -> " + seen}`);
const b = await chromium.launch();
const person = async (email, role = "admin") => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(email + " " + String(e).slice(0, 300))); p.on("console", (m) => m.type() === "error" && !/status of (401|403|409|415)/.test(m.text()) && errors.push(email + " " + m.text().slice(0, 300)));
  await p.goto(`${BASE}/auth/dev?email=${email}&name=${email.split("@")[0]}&role=${role}`); await p.waitForSelector(".topbar h1, .logincard"); return p; };
const S = (p, expr) => p.evaluate(`(() => { const { S, TERMS, bookings } = window.__app; return ${expr}; })()`);
const settle = (p) => p.waitForTimeout(900);

// Signed out: only the sign-in screen, and the API refuses
const anon = await (await b.newContext()).newPage(); await anon.goto(BASE); await anon.waitForSelector(".logincard");
ok("signed out: sign-in screen only", (await anon.locator(".rail").count()) === 0 && (await anon.locator('a[href="/auth/google"]').count()) === 1);
ok("signed out: the API refuses", (await anon.evaluate(() => fetch("/api/state").then((r) => r.status))) === 401);

// A previous run leaves its settings behind (they are saved for real): start from the defaults.
const reset = await person("alice@test.local");
await reset.evaluate(() => fetch("/api/settings/prefs", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ value: { buffer: 0, deposit: 30, hold: 2500, plSeq: { D: 0, F: 0 }, sources: [] } }) }));
await reset.evaluate(() => { window.__app.S.deals = []; return window.__app.persist(); }); await reset.close();
const a = await person("alice@test.local");
ok("signed in: the deals page, empty", (await a.locator(".board").count()) === 1 && (await S(a, "S.deals.length")) === 0, String(await S(a, "S.deals.length")));
ok("features not plugged in are not offered", (await a.locator('a[href="#messages"], a[href="#openspace"]').count()) === 0);

// Create a deal, reload: it is still there
await a.click('.topbar [data-a="new"]'); await a.fill("#n-title", "Mariage test"); await a.fill("#n-start", "2027-06-10"); await a.fill("#n-end", "2027-06-13"); await a.fill("#n-guests", "40"); await a.fill("#n-amount", "9000"); await a.click('[data-a="create"]');
await a.waitForSelector(".dealhead"); await settle(a);
const id = await S(a, "S.deals[0].id");
await a.reload(); await a.waitForSelector(".dealhead");
ok("a created deal survives a reload", (await a.locator(".dealhead h2").innerText()).includes("Mariage test") && (await S(a, "S.deals[0]._v")) >= 1);

// A second person sees a change as it is saved
const bob = await person("bob@test.local"); await bob.goto(`${BASE}/#affaire-${id}`); await bob.waitForSelector(".dealhead");
await a.click('[data-comp="Notes"]'); await a.fill("#note", "Note écrite par Alice"); await a.click('[data-a="note"]'); await settle(a); await settle(bob);
ok("another person sees the note without reloading", (await bob.locator(".feed").innerText()).includes("Note écrite par Alice"));
ok("a note is a sticky note placed above the documents", (await a.locator(".stickies .sticky").first().innerText()).includes("Note écrite par Alice")
  && (await a.evaluate(() => { const note = document.querySelector(".stickies"), docs = [...document.querySelectorAll(".feed .blk h3")].find((h) => h.textContent.startsWith("Documents")); return Boolean(note && docs && (note.compareDocumentPosition(docs) & Node.DOCUMENT_POSITION_FOLLOWING)); })));
await a.click('.sticky [data-a="note-edit"]'); await a.fill("#note-edit", "Note corrigée par Alice"); await a.click('[data-a="note-save"]'); await settle(a); await settle(bob);
ok("a note can be corrected, and the correction reaches the others", (await a.locator(".sticky p").first().innerText()) === "Note corrigée par Alice" && (await a.locator(".sticky small").first().innerText()).includes("modifiée") && (await bob.locator(".stickies").innerText()).includes("Note corrigée par Alice"));
await a.click('.sticky [data-a="pin-del"]'); await a.waitForSelector('[role="alertdialog"]');
ok("deleting a note asks for a confirmation first", (await a.locator('[role="alertdialog"]').innerText()).includes("Note corrigée par Alice") && (await a.locator(".sticky").count()) === 1);
await a.click('[role="alertdialog"] [data-a="close-modal"]'); ok("declining keeps the note", (await a.locator(".sticky").count()) === 1 && (await a.locator('[role="alertdialog"]').count()) === 0);
await a.click('.sticky [data-a="pin-del"]'); await a.click('[data-a="confirm-yes"]'); await settle(a); await settle(bob);
ok("once confirmed the note is gone for everyone", (await a.locator(".sticky").count()) === 0 && (await bob.locator(".sticky").count()) === 0);
// Visits: planned on the deal, corrected, shown in the calendar, written in Google Agenda (its answers are played here)
ok("the activity tab is gone, a visit tab takes its place", (await a.locator('.composer [data-comp="Activité"]').count()) === 0 && (await a.locator('.composer [data-comp="Visite"]').count()) === 1);
await a.click('[data-comp="Visite"]'); await a.fill("#vs-date", "2027-03-06"); await a.fill("#vs-time", "10:30"); await a.selectOption("#vs-dur", "90"); await a.fill("#vs-note", "Avec les parents"); await a.click('[data-a="visit-add"]'); await settle(a); await settle(bob);
const visitId = await S(a, "S.deals[0].visits[0].id");
ok("a planned visit is listed on the deal, above its documents, for everyone", (await a.locator(".vrow").innerText()).includes("samedi 6 mars 2027 à 10:30") && (await a.locator(".vrow").innerText()).includes("1 h 30 · Avec les parents") && (await bob.locator(".vrow").count()) === 1
  && (await a.evaluate(() => { const row = document.querySelector(".vrow"), docs = [...document.querySelectorAll(".feed .blk h3")].find((h) => h.textContent.startsWith("Documents")); return Boolean(row.compareDocumentPosition(docs) & Node.DOCUMENT_POSITION_FOLLOWING); })));
ok("without a connected agenda nothing is written in Google, and a page cannot reach another event", (await a.evaluate(([d, v]) => fetch("/api/calendar/visit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dealId: d, visitId: v }) }).then((r) => r.status), [id, visitId])) === 409
  && (await a.request.post(`${BASE}/api/calendar/visit`, { data: { dealId: id, visitId: "vnone0000" } })).status() === 404 && (await a.request.post(`${BASE}/api/calendar/visit/remove`, { data: { dealId: id, visitId: "../primary" } })).status() === 400);
ok("the team can neither start the agenda consent nor read its key", (await bob.evaluate(() => fetch("/api/state").then((r) => r.json()).then((st) => st.agenda.on === false && !("agenda" in st.settings)))) && (await a.evaluate(() => fetch("/api/settings/agenda").then((r) => r.status))) === 403);
let calAsked = []; await a.context().route("**/api/calendar/**", (r) => { calAsked.push([new URL(r.request().url()).pathname, JSON.parse(r.request().postData() ?? "{}")]); return r.fulfill({ contentType: "application/json", body: '{"ok":true}' }); });
await a.evaluate(() => { window.__app.S.agenda = { on: true, email: "domaine@test.local" }; });
await a.click('[data-a="visit-edit"]'); await a.fill("#ve-time", "15:00"); await a.click('[data-a="visit-save"]'); await a.waitForSelector(".vsync.ok");
ok("a corrected visit is saved and sent to the agenda as the same visit", (await S(a, "S.deals[0].visits[0].time")) === "15:00" && (await a.locator(".vrow").innerText()).includes("à 15:00") && calAsked.length === 1 && calAsked[0][0] === "/api/calendar/visit" && calAsked[0][1].dealId === id && calAsked[0][1].visitId === visitId, JSON.stringify(calAsked));
await a.goto(`${BASE}/#reservations`); await a.waitForSelector(".cmonth"); await a.evaluate(() => { window.__app.S.month = "2027-03"; window.dispatchEvent(new HashChangeEvent("hashchange")); });
ok("the calendar shows the visit on its day and in the coming visits", (await a.locator(".vchip").count()) === 1 && (await a.locator(".vchip").innerText()).includes("15:00") && (await a.locator(".vlist").innerText()).includes("Mariage test"));
await a.click(".vchip"); await a.waitForSelector(".drawer.peek .vrow"); await a.click('.drawer.peek [data-a="visit-del"]'); await a.waitForSelector('[role="alertdialog"]');
ok("deleting a visit asks for a confirmation first", (await S(a, "S.deals[0].visits.length")) === 1);
await a.click('[data-a="confirm-yes"]'); await settle(a);
ok("a deleted visit leaves the deal, the calendar and the agenda", (await S(a, "S.deals[0].visits.length")) === 0 && (await a.locator(".vchip").count()) === 0 && calAsked.some(([path, body]) => path === "/api/calendar/visit/remove" && body.visitId === visitId));
await a.evaluate(() => { window.__app.S.agenda = { on: false }; }); await a.context().unroute("**/api/calendar/**"); await a.goto(`${BASE}/#affaire-${id}`); await a.waitForSelector(".dealhead");
// Signing the deal creates the schedule; the other page follows
await a.click('[data-stage="4"]'); await settle(a); await settle(bob);
ok("stage and schedule reach the other page", (await bob.locator(".step.cur").innerText()).includes("Signé") && (await S(bob, "S.deals[0].payments.length")) === 3);
ok("money: 30 % deposit and the balance add up", (await S(a, "S.deals[0].payments.filter(p => !p.hold).map(p => p.amount).join('+')")) === "2700+6300");

// Two people changing the same deal at the same moment: the second is told, nothing is lost silently
await bob.evaluate(() => { window.__app.S.deals[0].guests = 55; }); await a.evaluate(() => { window.__app.S.deals[0].guests = 60; });
await Promise.all([a.evaluate(() => window.__app.persist()), bob.evaluate(() => window.__app.persist())]); await settle(a); await settle(bob);
const ga = await S(a, "S.deals[0].guests"), gb = await S(bob, "S.deals[0].guests");
ok("a simultaneous change is not silently overwritten", ga === gb && ((await a.locator(".notice").count()) + (await bob.locator(".notice").count())) === 1, `${ga}/${gb}`);

// Upload a real file and see it in the panel
writeFileSync("/tmp/domaine-test.pdf", "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
await a.reload(); await a.waitForSelector(".dealhead");
await a.click('.h [data-a="doc"]'); await a.click('[data-src="file"]'); await a.setInputFiles("#dn-file", "/tmp/domaine-test.pdf"); await a.click('[data-a="doc-add"]'); await a.waitForSelector(".fileview");
ok("an uploaded PDF is filed on the deal and shown", (await S(a, "S.deals[0].docs.some(x => x.fileId && x.k === 'pdf')")) && (await a.locator(".fileview").getAttribute("src")).startsWith("/api/files/"));
const fileUrl = await a.locator(".fileview").getAttribute("src");
ok("the file is served to a signed-in person only", (await a.evaluate((u) => fetch(u).then((r) => r.status), fileUrl)) === 200 && (await anon.evaluate((u) => fetch(u).then((r) => r.status), fileUrl)) === 401);
writeFileSync("/tmp/domaine-test.html", "<script>alert(1)</script>");
ok("a web page is refused as an upload", (await a.evaluate(async () => { const fd = new FormData(); fd.append("file", new File(["<script>alert(1)</script>"], "x.html", { type: "text/html" })); return (await fetch("/api/files", { method: "POST", body: fd })).status; })) === 415);

// Settings are saved; a team member can neither change them nor delete a deal
await a.click("#close-preview"); await a.goto(`${BASE}/#reglages-echeancier`); await a.waitForSelector(".setmain"); await a.click('[data-a="dep-plus"]'); await settle(a);
await a.reload(); await a.waitForSelector(".setmain");
ok("a setting survives a reload", (await S(a, "TERMS.deposit")) === 35);
ok("cards of features not plugged in are not shown", !(await a.locator(".setx").innerText()).includes("Pennylane") && (await a.locator(".setnav a").count()) === 14 && (await a.locator(".setmain h2").innerText()) === "Échéancier par défaut");
const team = await person("carol@test.local", "team");
ok("the team does not receive the bank statement or the calendar secret", await team.evaluate(() => fetch("/api/state").then((r) => r.json()).then((s) => !("bank" in s.settings) && !("ical_token" in s.settings) && s.admin === null)));
ok("the team cannot download a backup", (await team.evaluate(() => fetch("/api/backup").then((r) => r.status))) === 403); await team.goto(`${BASE}/#reglages`); await team.waitForSelector(".lockcard");
ok("the team sees the settings locked", (await team.locator(".lockcard").count()) === 1);
ok("the server refuses a setting or a deletion from the team", (await team.evaluate(() => fetch("/api/settings/prefs", { method: "PUT", headers: { "content-type": "application/json" }, body: '{"value":{}}' }).then((r) => r.status))) === 403
  && (await team.evaluate((i) => fetch("/api/deals/" + i, { method: "DELETE" }).then((r) => r.status), id)) === 403);
// Google Drive: nothing about the grant leaves the server, and only an administrator may connect or disconnect it
ok("the team can neither start the Drive consent nor disconnect it", (await team.evaluate(() => fetch("/auth/drive").then((r) => new URL(r.url).origin === location.origin))) && (await team.evaluate(() => fetch("/api/drive", { method: "DELETE" }).then((r) => r.status))) === 403);
ok("the Drive grant cannot be read back, even by an administrator", (await a.evaluate(() => fetch("/api/settings/drive").then((r) => r.status))) === 403 && (await S(a, "S.drive.on")) === false);
ok("without a connection the server creates no Drive document", (await a.evaluate((id) => fetch("/api/drive/docs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dealId: id, title: "Caution", html: "<p>x</p>" }) }).then((r) => r.status), id)) === 409);
ok("without a connection the server makes no Drive folder either", (await a.evaluate((id) => fetch("/api/drive/folder", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dealId: id, name: "Séjour", client: false }) }).then((r) => r.status), id)) === 409
  && (await S(a, "S.deals.every(d => !d.driveFolder)")));
// Gmail: the mailbox's key stays on the server, only an administrator connects it, and nothing is read or sent without it
ok("the team can neither start the mailbox consent nor disconnect it", (await team.evaluate(() => fetch("/auth/gmail").then((r) => new URL(r.url).origin === location.origin))) && (await team.evaluate(() => fetch("/api/mail", { method: "DELETE" }).then((r) => r.status))) === 403);
ok("the mailbox grant can be neither read back nor written by a page", (await a.evaluate(() => fetch("/api/settings/gmail").then((r) => r.status))) === 403 && (await S(a, "S.mail.on")) === false
  && (await a.request.put(`${BASE}/api/settings/gmail`, { data: { value: { refresh: "x", email: "x@test.local" } } })).status() === 400 && (await a.evaluate(() => fetch("/api/state").then((r) => r.json()).then((st) => st.mail.on === false && !("gmail" in st.settings)))));
ok("without a connected mailbox no attachment is served, and a page cannot ask for an arbitrary message", (await a.evaluate((id) => fetch(`/api/mail/attachment?dealId=${id}&messageId=aaa0000000000001&n=0`).then((r) => r.status), id)) === 409
  && (await a.request.get(`${BASE}/api/mail/attachment?dealId=${id}&messageId=../labels&n=0`)).status() === 404);
ok("without a connected mailbox the server reads no conversation", (await a.evaluate((id) => fetch("/api/mail?dealId=" + id).then((r) => r.status), id)) === 409 && (await a.request.get(`${BASE}/api/mail?dealId=nope`)).status() === 404);
const sendTry = async (to) => (await a.request.post(`${BASE}/api/mail/send`, { data: { dealId: id, subject: "Essai", html: "<p>Bonjour</p>", to } })).status();
ok("the server sends nothing to an address that is not the deal's, nor without a mailbox", (await sendTry("boss@corp.com")) === 400 && [400, 409].includes(await sendTry("")));
await a.goto(`${BASE}/#reglages-drive`); await a.waitForSelector(".setmain");
ok("the settings offer to connect Google Drive, and show at a glance that nothing is connected", (await a.locator('a[href="/auth/drive"]').count()) === 1 && (await a.locator(".setnav .cdot").count()) === 3 && (await a.locator(".setnav .cdot.on").count()) === 0);
await a.click('.setnav a[href="#reglages-gmail"]'); await a.waitForSelector('a[href="/auth/gmail"]');
ok("a section of the settings opens from the list on the left, one at a time", (await a.locator(".setmain h2").innerText()) === "Gmail" && (await a.locator('a[href="/auth/drive"]').count()) === 0 && (await a.evaluate(() => location.hash)) === "#reglages-gmail");

// Import a planning file, then delete what the test created
writeFileSync("/tmp/domaine-plan.json", JSON.stringify([{ title: "Séjour importé", kind: "Séjour", start: "2027-07-14", end: "2027-07-21", guests: 12 }, { title: "", start: "x" }]));
await a.click('.setnav a[href="#reglages-import"]'); await a.waitForSelector("#imp-file"); await a.setInputFiles("#imp-file", "/tmp/domaine-plan.json"); await settle(a);
ok("a planning file becomes deals, bad lines are skipped", (await S(a, "S.deals.some(d => d.title === 'Séjour importé' && d.stage === 4)")) && (await a.locator(".flash").innerText()).includes("1 ligne ignorée"), await a.locator(".flash").innerText().catch(() => ""));
await a.goto(`${BASE}/#reservations`); await a.waitForSelector(".cmonth"); await a.click('[data-calview="season"]'); await a.click('[data-year="1"]');
ok("the season line shows the imported stay", (await a.locator(".sbar").count()) >= 1);
// A request noted in a hurry: nothing is required, and every page copes with a deal that has no dates yet
await a.goto(`${BASE}/#affaires`); await a.click('.topbar [data-a="new"]'); await a.fill("#n-note", "Appel de Mme Test\nMariage été 2028, rappeler jeudi"); await a.click('[data-a="create"]'); await a.waitForSelector(".dealhead"); await settle(a);
const quick = await S(a, "S.deals.find(d => d.title === 'Appel de Mme Test')");
ok("a deal is created from a note alone", Boolean(quick) && quick.start === "" && quick.pinned[0].body.includes("rappeler jeudi") && (await a.locator(".dealhead").innerText()).includes("Dates à définir"), JSON.stringify(quick ?? null).slice(0, 200));
await a.click('.step[data-stage="2"]'); await settle(a);
ok("no option can be held without dates", (await S(a, "S.deals.find(d => d.title === 'Appel de Mme Test').stage")) === 0 && (await a.locator(".notice, .banner, [role=alert]").first().innerText().catch(() => "")).includes("dates"));
await a.click('[data-edit="dates"]'); await a.waitForSelector(".pmonths");
const free = a.locator(".pmonths [data-day]:not([disabled])"); await free.nth(20).click(); await free.nth(23).click(); await a.click('[data-a="dates-ok"]'); await settle(a);
const dated = await S(a, "S.deals.find(d => d.title === 'Appel de Mme Test')");
ok("dates can be given afterwards", /^\d{4}-\d{2}-\d{2}$/.test(dated.start) && dated.end > dated.start, JSON.stringify([dated.start, dated.end]));
await a.evaluate(() => { const d = window.__app.S.deals.find((o) => o.title === "Appel de Mme Test"); d.start = d.end = ""; return window.__app.persist(); }); await settle(a);
const errsBefore = errors.length;
for (const h of ["#affaires", "#reservations", "#contacts", "#documents", "#audit", "#taches", "#statistiques", "#reglages", `#contact-${quick.id}`, `#affaire-${quick.id}`]) { await a.goto(`${BASE}/${h}`); await a.waitForSelector(".topbar h1"); await a.waitForTimeout(150); }
await a.click('[data-comp="Événement"]'); await a.click('[data-a="sheet"]'); await a.waitForSelector(".drawer"); await a.click("#close-preview");
await a.goto(`${BASE}/#affaires`); await a.click('[data-view="list"]').catch(() => {}); await a.waitForTimeout(150);
await a.goto(`${BASE}/#reservations`); for (const v of ["year", "season"]) { await a.click(`[data-calview="${v}"]`); await a.waitForTimeout(150); }
ok("every page shows a deal without dates", errors.length === errsBefore && !(await a.locator("#app").innerText()).match(/undefined|NaN|Invalid/), errors.slice(errsBefore).join(" | ").slice(0, 300));
await a.evaluate(() => { const S = window.__app.S; S.deals = S.deals.filter((d) => d.title !== "Appel de Mme Test"); return window.__app.persist(); }); await settle(a);

// The rental agreement: the estate's own text, in the deal's language, the lessor coming from the settings
await a.goto(`${BASE}/#reglages`); await a.waitForSelector("#ls-name"); await a.fill("#ls-name", "SARL Essai"); await a.fill("#ls-city", "Nîmes"); await a.click('[data-a="lessor-save"]'); await settle(a);
await a.goto(`${BASE}/#affaires`); await a.click('.topbar [data-a="new"]'); await a.fill("#n-title", "Contrat bilingue"); await a.fill("#n-start", "2028-06-09"); await a.fill("#n-end", "2028-06-12"); await a.fill("#n-amount", "10000"); await a.click('[data-a="create"]'); await a.waitForSelector(".dealhead");
await a.click('.blk [data-a="doc"]'); await a.waitForSelector("#dn-slot"); await a.selectOption("#dn-slot", "contrat"); await a.click('[data-a="doc-add"]'); await a.waitForSelector("#doc-edit");
const frText = await a.locator("#doc-edit").innerText(), depText = new Intl.NumberFormat("fr-FR").format(100 * (await S(a, "TERMS.deposit"))).replace(/[\u00a0\u202f]/g, " ");
ok("the agreement is the estate's, filled from the deal and the settings", ["Contrat de location saisonnière", "SARL Essai", "vendredi 09/06/2028", "3 nuits", "10 000", depText, "9 avril 2028", "acompte et non des arrhes", "Article 20. Droit applicable"].every((t) => frText.replace(/[\u00a0\u202f]/g, " ").includes(t)), ["Contrat de location saisonnière", "SARL Essai", "vendredi 09/06/2028", "3 nuits", "10 000", depText, "9 avril 2028", "acompte et non des arrhes", "Article 20. Droit applicable"].filter((t) => !frText.replace(/[\u00a0\u202f]/g, " ").includes(t)).join(" | "));
await a.selectOption("[data-docstatus]", "À signer"); await settle(a);
ok("out of the draft state the agreement can no longer be typed in", (await a.locator("#doc-edit").count()) === 0 && (await a.locator(".drawer .dstate").innerText()).includes("ne se modifie plus") && (await a.locator('[data-a="doc-newver"]').count()) === 1);
await a.selectOption("[data-docstatus]", "Signé"); await settle(a);
ok("once signed its status is final", (await a.locator("[data-docstatus]").count()) === 0 && (await a.locator(".drawer header .tag").innerText()) === "Signé");
await a.click('[data-a="doc-newver"]'); await a.waitForSelector("#doc-edit");
ok("a new version starts from a draft and keeps the signed one", (await S(a, "S.deals.find(d => d.title === 'Contrat bilingue').docs.map(x => [x.slot ?? '', x.st ?? 'Brouillon'].join(':')).join(',')")) === ":Signé,contrat:Brouillon", await S(a, "JSON.stringify(S.deals.find(d => d.title === 'Contrat bilingue').docs.map(x => [x.t, x.slot, x.st]))"));
await a.click("#close-preview"); await a.waitForSelector(".drawer", { state: "detached" }); await a.click('[data-edit="eventPart"]'); await a.fill("#e-eventpart", "2500"); await a.click('[data-a="save"]');
await a.click('[data-edit="lang"]'); await a.selectOption("#e-lang", "en"); await a.click('[data-a="save"]'); await a.click('.docs .drow >> nth=0'); await a.waitForSelector("#doc-edit");
const enText = await a.locator("#doc-edit").innerText();
ok("switching the deal to English switches the agreement", ["Seasonal Rental Agreement", "Friday 09/06/2028", "3 nights", "€10,000", "9 April 2028", "VAT at 20%", "€2,500", "Article 20. Governing law"].every((t) => enText.includes(t)), enText.slice(0, 400));
await a.click("#close-preview"); await a.waitForSelector(".drawer", { state: "detached" });
await a.evaluate(() => { const S = window.__app.S; S.deals = S.deals.filter((d) => d.title !== "Contrat bilingue"); S.lessor = {}; return window.__app.persist(); }); await settle(a);

// A page left open on an older version: told so while something is being typed, reloaded by itself otherwise
await a.goto(`${BASE}/#affaires`); await a.waitForSelector(".topbar h1");
await a.evaluate(() => { const S = window.__app.S; S.build = "older"; S.draft.note = "en cours"; return window.__app.checkBuild(); }); await a.waitForSelector(".notice.stale");
ok("an outdated page says a new version is online while something is being typed", (await a.locator('.notice.stale [data-a="reload"]').count()) === 1);
await a.evaluate(() => { const S = window.__app.S; S.draft = {}; S.stale = false; S.build = "older"; window.__marker = 1; return window.__app.checkBuild(); }); await a.waitForFunction(() => window.__marker === undefined && window.__app && window.__app.S.build && window.__app.S.build !== "older");
ok("with nothing in progress it reloads by itself onto the new version", (await a.locator(".notice.stale").count()) === 0);

// A season file (fictional people): stays with payments, documents and remarks, then the audit page
const season = { format: "domaine-import-1", season: 2027, mailbox: "accueil@test.local", lessor: { name: "SARL Importée", city: "Nîmes", signer: "<b>Signataire</b>" }, deals: [
  { id: "t27-ok", title: "Mariage Alba & Noé", kind: "Mariage", stage: 4, status: "Gagné", amount: 8000, start: "2027-08-06", end: "2027-08-09", guests: 60, sleeping: 20, signed: "2027-01-10", contact: { name: "Alba Test", email: "alba@test.local" },
    payments: [{ id: "dep", kind: "Acompte", amount: 2400, due: "2027-01-10", status: "paid", paidOn: "2027-01-12", bank: "VIR ALBA TEST ACOMPTE" }, { id: "bal", kind: "Solde", amount: 5600, due: "2027-06-06", status: "due" }, { id: "hold", kind: "Caution", amount: 2500, due: "2027-08-06", status: "held", hold: true, how: "Chèque" }],
    docs: [{ t: "Contrat signé.pdf", k: "pdf", d: "2027-01-10", st: "Signé", slot: "contrat", url: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view" }, { t: "Avenant", k: "gdoc", d: "2027-01-11", st: "Brouillon", url: "https://docs.google.com/document/d/1ZyXwVuTsRqPoNmLk/edit" }, { t: "Piège", k: "pdf", d: "2027-01-10", url: "javascript:alert(1)" }],
    sheet: [{ k: "Lieu du repas", v: "Terrasse <b>ouest</b>" }], providers: [{ name: "Traiteur Test", role: "Traiteur" }], src: { contract: { start: "2027-08-07", end: "2027-08-09", guests: 60 } },
    findings: [{ lvl: "warn", t: "Remarque de test à traiter." }], mails: { threads: 1, messages: 3, received: 2, sent: 1, first: "2026-12-01", last: "2027-01-10", list: [{ id: "19abcdef0123", first: "2026-12-01", last: "2027-01-10", n: 3, subject: "Mariage août 2027" }] } },
  { id: "bad id!", title: "Refusé", start: "2027-09-01", end: "2027-09-03" }, { id: "t27-nodate", title: "Sans dates" }] };
writeFileSync("/tmp/domaine-season.json", JSON.stringify(season));
await a.goto(`${BASE}/#reglages-import`); await a.waitForSelector("#imp-file"); await a.setInputFiles("#imp-file", "/tmp/domaine-season.json"); await a.waitForSelector(".audit"); await settle(a);
ok("a season file: valid stays in, invalid ones skipped, the audit opens", (await S(a, "S.deals.filter(d => d.id.startsWith('t27-')).length")) === 1 && (await a.locator(".flash").innerText()).includes("2 ignorés"), await a.locator(".flash").innerText().catch(() => ""));
ok("the season file fills in the lessor where nothing was typed", (await S(a, "S.lessor.name")) === "SARL Importée" && (await S(a, "S.lessor.city")) === "Nîmes");
ok("only Google Drive links are kept on documents", (await S(a, "S.deals.find(d => d.id === 't27-ok').docs.length")) === 2);
ok("the audit lists the stay and flags the contract dates", (await a.locator('[data-aopen="t27-ok"] .ac.bad').count()) === 1 && (await a.locator('[data-aopen="t27-ok"] .st').innerText()) === "Bloquant");
await a.click('[data-aopen="t27-ok"]'); const treat = a.locator('.aitems li.warn [data-aok]').first(), before = await a.locator(".aitems li.seen").count(); await treat.click(); await settle(a);
ok("a remark marked as dealt with is struck out", (await a.locator(".aitems li.seen").count()) === before + 1);
await a.goto(`${BASE}/#reglages-import`); await a.waitForSelector("#imp-file"); await a.setInputFiles("#imp-file", "/tmp/domaine-season.json"); await a.waitForSelector(".audit"); await settle(a); await a.reload(); await a.waitForSelector(".audit");
ok("importing the same season again updates, never duplicates, and keeps what was dealt with", (await S(a, "S.deals.filter(d => d.id === 't27-ok').length")) === 1 && (await S(a, "S.deals.find(d => d.id === 't27-ok').auditOk.length")) === 1, await a.locator(".flash").innerText().catch(() => ""));
await a.goto(`${BASE}/#affaire-t27-ok`); await a.waitForSelector(".dealhead");
ok("the deal page shows the remarks, the conversations and the Drive document", (await a.locator(".aitems li").count()) >= 2 && (await a.locator('a.drow[href^="https://mail.google.com/"]').count()) === 1 && (await a.locator(".docs .drow").first().innerText()).includes("Contrat signé"));
await a.context().route(/https:\/\/(drive|docs)\.google\.com\//, (r) => r.fulfill({ contentType: "text/html", body: "<p>Google</p>" }));
await a.click('.docs .drow >> nth=0'); await a.waitForSelector(".drawer iframe.fileview");
ok("a signed PDF kept in Drive is shown in the panel by the Drive viewer", (await a.locator(".drawer iframe.fileview").getAttribute("src")) === "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview");
ok("the panel has slid in from the right", (await a.locator(".drawer").evaluate((el) => getComputedStyle(el).animationName)) === "drawer-in");
await a.click("#close-preview");
ok("closing slides it back out before it goes", (await a.locator(".drawer.out").count()) === 1 && (await a.locator(".drawer").evaluate((el) => getComputedStyle(el).animationName)) === "drawer-out");
await a.waitForSelector(".drawer", { state: "detached" }); await a.click('.docs .drow >> nth=1'); await a.waitForSelector(".drawer iframe.fileview");
ok("a Google Docs draft opens in the panel in edit mode", (await a.locator(".drawer iframe.fileview").getAttribute("src")) === "https://docs.google.com/document/d/1ZyXwVuTsRqPoNmLk/edit");
const box = await a.locator(".drawer.wide").boundingBox(), frame = await a.locator(".drawer iframe.fileview").boundingBox();
ok("a Drive document gets a wide panel and its whole height", box.width >= 1100 && frame.width >= box.width - 4 && frame.height >= 600, JSON.stringify({ box, frame }));
await a.click('[data-a="doc-bare"]'); ok("« Page seule » asks Google Docs for the page alone", (await a.locator(".drawer iframe.fileview").getAttribute("src")).endsWith("/edit?rm=minimal")); await a.click('[data-a="doc-bare"]');
await a.click("#close-preview");
// With Drive connected (its answers are played by the test), both ways of creating from a model make a Google Docs file
let asked = []; await a.context().route("**/api/drive/**", (r) => { asked.push(JSON.parse(r.request().postData() ?? "{}")); return r.fulfill({ contentType: "application/json", body: JSON.stringify({ id: "1DocFromDrive0001", url: "https://docs.google.com/document/d/1DocFromDrive0001/edit", folder: "1FolderOfTheDeal01" }) }); });
await a.evaluate(() => { window.__app.S.drive = { on: true }; }); await a.click('[data-a="rail"]'); await a.click('[data-a="rail"]');
await a.click('[data-slot="caution"][data-a="slot-create"]'); await a.waitForSelector(".drawer iframe.fileview");
ok("« Créer » makes the deposit form in Drive, in the stay's folder, and opens it for editing", (await a.locator(".drawer iframe.fileview").getAttribute("src")) === "https://docs.google.com/document/d/1DocFromDrive0001/edit"
  && asked.some((q) => q.title === "Caution - Mariage Alba & Noé" && q.client === true && q.html.includes("Alba")) && (await S(a, "S.deals.find(d => d.id === 't27-ok').driveFolder")) === "1FolderOfTheDeal01", JSON.stringify(asked).slice(0, 300));
await a.click("#close-preview"); asked = []; await a.click('.blk [data-a="doc"]'); await a.waitForSelector("#dn-slot"); await a.selectOption("#dn-slot", ""); await a.fill("#dn-name", "Avenant piscine"); await a.click('[data-a="doc-add"]'); await a.waitForSelector(".drawer iframe.fileview");
ok("« Ajouter un document » from a model makes a Google Docs file too", asked.some((q) => q.title === "Avenant piscine" && q.folder === "1FolderOfTheDeal01") && (await S(a, "S.deals.find(d => d.id === 't27-ok').docs.filter(x => x.url && x.url.includes('1DocFromDrive0001')).length")) === 2, JSON.stringify(asked).slice(0, 300));
await a.click("#close-preview"); await a.waitForSelector(".drawer", { state: "detached" }); asked = [];
await a.evaluate(() => { const d = window.__app.S.deals.find((o) => o.id === "t27-ok"); d.tenants = ["Alba Nouvelle", "Noé Test"]; return window.__app.persist(); }); await settle(a);
ok("changing the deal rewrites its Drive draft", asked.some((q) => q.id === "1DocFromDrive0001" && q.html.includes("Alba Nouvelle") && q.force === false), JSON.stringify(asked).slice(0, 300));
await a.context().unroute("**/api/drive/**"); await a.context().route("**/api/drive/**", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ edited: true }) }));
await a.evaluate(() => { const d = window.__app.S.deals.find((o) => o.id === "t27-ok"); d.tenants = ["Alba Encore", "Noé Test"]; return window.__app.persist(); }); await settle(a);
await a.click('.docs .drow:has-text("Caution")'); await a.waitForSelector(".drawer iframe.fileview");
ok("a draft typed in by hand in Google Docs is left alone, and says so", (await a.locator(".drawer footer").innerText()).includes("ne suit plus la fiche") && (await a.locator('[data-a="doc-resync"]').count()) === 1);
await a.click("#close-preview"); await a.evaluate(() => { window.__app.S.drive = { on: false }; }); await a.context().unroute("**/api/drive/**");
// Gmail in the deal: the conversations are read in the page and answered from it (Gmail's answers are played here)
ok("without a mailbox, the e-mail tab is not offered", (await a.locator('.composer [data-comp="E-mail"]').count()) === 0);
const mailDeal = await a.evaluate(() => location.hash.slice(9));
const played = { addresses: ["alba@test.local"], threads: [
  { id: "aaa0000000000001", subject: "Mariage en juin", messages: [
    { id: "m1", from: "Alba Test <alba@test.local>", to: "domaine@test.local", subject: "Mariage en juin", at: "2027-01-10T09:00:00.000Z", mine: false, messageId: "<1@mail>", files: [{ n: 0, name: "Plan de table.pdf", type: "application/pdf", size: 204800 }], html: '<p>Bonjour, le domaine est-il <b>libre</b> ?</p><img src="x" onerror="window.__hit = 1"><script>window.__hit = 1</script>' },
    { id: "m2", from: "Le Domaine <domaine@test.local>", to: "alba@test.local", subject: "Re: Mariage en juin", at: "2027-01-10T11:00:00.000Z", mine: true, messageId: "<2@mail>", files: [], html: "<p>Oui, il est libre.</p>" }] },
  { id: "aaa0000000000002", subject: "Question traiteur", messages: [{ id: "m3", from: "alba@test.local", to: "domaine@test.local", subject: "Question traiteur", at: "2026-12-01T08:00:00.000Z", mine: false, messageId: "<3@mail>", files: [], html: "<p>Peut-on venir avec notre traiteur ?</p>" }] }] };
let mailAsked = [], mailReads = 0;
await a.context().route("**/api/mail?**", (r) => { mailReads++; return r.fulfill({ contentType: "application/json", body: JSON.stringify(played) }); });
await a.context().route("**/api/mail/send", (r) => { mailAsked.push(JSON.parse(r.request().postData() ?? "{}")); return r.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, threadId: "aaa0000000000001" }) }); });
await a.evaluate((i) => { const { S } = window.__app; S.deals.find((d) => d.id === i).contact.email = "Alba@test.local"; S.mail = { on: true, email: "domaine@test.local" }; S.composer = "Notes"; window.dispatchEvent(new HashChangeEvent("hashchange")); }, mailDeal);
await a.waitForSelector('.blk:has-text("Conversations") .drow');
ok("with the mailbox connected, the deal lists its conversations", (await a.locator('.blk:has-text("Conversations") .drow').count()) === 2 && (await a.locator('.composer [data-comp="E-mail"]').count()) === 1);
await a.locator('.blk:has-text("Conversations") .drow').first().click(); await a.waitForSelector("#thread .mail");
ok("a conversation opens in the page, message by message, with its attachments named", (await a.locator("#thread .mail").count()) === 2 && (await a.locator("#thread .mail.out").count()) === 1 && (await a.locator("#thread").innerText()).includes("Plan de table.pdf") && (await a.locator("#thread .mail b").first().innerText()) === "Alba Test");
ok("an attachment is a link that opens that file of that message, and the head offers a small button and an icon", (await a.locator("#thread a.att").getAttribute("href")) === `/api/mail/attachment?dealId=${mailDeal}&messageId=m1&n=0` && (await a.locator("#thread a.att").innerText()).includes("200 Ko")
  && (await a.locator('.mailhead .btn[data-a="mail-new"]').count()) === 1 && (await a.locator('.mailhead .iconbtn[data-a="mail-reload"]').innerText()).trim() === "");
ok("what a message carries is shown as text and formatting only", (await a.locator("#thread img, #thread script").count()) === 0 && (await a.evaluate(() => window.__hit)) === undefined && (await a.locator("#thread .rich b").first().innerText()) === "libre");
await a.click("#mail-body"); await a.keyboard.type("Merci Alba, "); await a.click('.rte [data-cmd="bold"]'); await a.keyboard.type("à bientôt"); await settle(a);
await a.click('[data-a="mail-send"]'); await a.waitForSelector(".flash, .toast, [role=status]", { timeout: 3000 }).catch(() => null); await settle(a);
ok("an answer goes into its conversation, formatted, and the page never chooses the recipient", mailAsked.length === 1 && mailAsked[0].dealId === mailDeal && mailAsked[0].threadId === "aaa0000000000001" && /<b>à bientôt<\/b>/.test(mailAsked[0].html) && JSON.stringify(mailAsked[0].to) === '["alba@test.local"]', JSON.stringify(mailAsked));
ok("a sent e-mail is written in the deal's history and the message box is emptied", (await S(a, `S.deals.find(d => d.id === '${mailDeal}').history[0].t`)) === "E-mail envoyé : Mariage en juin" && (await a.locator("#mail-body").innerText()).trim() === "");
await a.click('[data-a="mail-new"]'); await a.waitForSelector("#mail-subject"); await a.click("#mail-body"); await a.keyboard.type("Bonjour"); await a.click('[data-a="mail-send"]'); await settle(a);
ok("a new conversation is not sent without a subject", mailAsked.length === 1 && (await a.locator("#mail-subject").count()) === 1);
await a.fill("#mail-subject", "Votre visite"); await a.click('[data-a="mail-send"]'); await settle(a);
ok("a new conversation is sent with its subject, outside any thread", mailAsked.length === 2 && mailAsked[1].subject === "Votre visite" && mailAsked[1].threadId === "");
// The composer: sender, recipients and subject as lines, templates, fields of the deal, files, signature
await a.click('[data-a="mail-new"]'); await a.waitForSelector("#mail-subject");
ok("the message shows who it is from, who it is for and its subject", (await a.locator(".mline .from").innerText()) === "domaine@test.local" && (await a.locator(".mto .rcpt").count()) === 1 && (await a.locator(".mto .rcpt").innerText()).includes("alba@test.local"));
await a.fill("#mail-to-new", "pas une adresse"); await a.press("#mail-to-new", "Enter"); const refused = await a.locator(".mto .rcpt").count();
await a.fill("#mail-to-new", "Noe@test.local"); await a.press("#mail-to-new", "Enter"); await a.waitForSelector(".mto .rcpt:nth-of-type(2)");
ok("a second recipient is added to the deal, an invalid address is not", refused === 1 && (await S(a, `S.deals.find(d => d.id === '${mailDeal}').mailAddrs.join()`)) === "noe@test.local" && (await a.locator(".mto .rcpt").count()) === 2);
await a.click('[data-menu="mailtpl"]'); await a.waitForSelector(".tplpop"); const allTpl = await a.locator(".tplpop .tpllist .mi").count(); await a.fill("#tpl-q", "relance"); await a.waitForTimeout(200);
ok("templates are offered in a list that can be searched", allTpl >= 4 && (await a.locator(".tplpop .tpllist .mi").count()) === 1);
await a.click('.tplpop [data-a="tpl-use"]'); await a.waitForTimeout(200);
ok("choosing a template fills the subject and the text", (await a.inputValue("#mail-subject")).startsWith("Rappel") && (await a.locator("#mail-body").innerText()).includes("Bonjour") && (await a.locator(".tplpop").count()) === 0);
await a.click('[data-a="mail-drop"]'); await a.click('[data-a="confirm-yes"]'); await a.waitForTimeout(200);
ok("the bin empties the draft after a confirmation", (await a.locator("#mail-body").innerText()).trim() === "" && (await a.inputValue("#mail-subject")) === "");
await a.fill("#mail-subject", "Votre arrivée"); await a.click("#mail-body"); await a.keyboard.type("Bonjour "); await a.selectOption("#mail-var", "Prénom"); await a.keyboard.type(", à très vite"); await settle(a);
ok("a field of the deal is inserted with its value", (await a.locator('#mail-body span[data-var="Prénom"]').count()) === 1 && (await a.locator("#mail-body").innerText()).includes("à très vite"));
await a.click('[data-menu="mailtpl"]'); await a.click('[data-a="tpl-save"]'); await a.fill("#tp-name", "Accueil maison"); await a.click('[data-a="tpl-save-ok"]'); await settle(a);
ok("a draft is kept as a template, its fields ready for another deal", (await S(a, "S.mailkit.templates.length")) === 1 && (await S(a, "S.mailkit.templates[0].html")).includes("{{Prénom}}") && (await a.evaluate(() => fetch("/api/state").then((r) => r.json()).then((st) => st.settings.mailkit.templates[0].name))) === "Accueil maison");
await a.setInputFiles("#mail-file", { name: "Plan d'accès.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") }); await a.waitForSelector(".mfiles.out .att");
await a.evaluate(() => { window.__app.S.mailkit.signature = "Alice\nLes jardins de Campagne"; window.dispatchEvent(new HashChangeEvent("hashchange")); }); await a.waitForSelector(".msign");
await a.locator('#mail-body').click(); await a.click('.rte [data-cmd="strikeThrough"]'); await a.keyboard.type("x"); await a.selectOption("#mail-color", "#c0392b"); await a.keyboard.type("y"); await a.click('[data-a="mail-send"]'); await settle(a); await settle(a);
const big = mailAsked[2] ?? {};
ok("the message leaves for both recipients with its file and its signature, formatting kept", JSON.stringify(big.to) === '["alba@test.local","noe@test.local"]' && (big.files ?? []).length === 1 && /^[0-9a-f-]{36}$/.test(big.files[0]) && big.html.includes("Les jardins de Campagne") && big.html.includes("<strike>") && big.html.includes('color="#c0392b"') && !big.html.includes("data-var"), JSON.stringify(big).slice(0, 600));
ok("once sent, the draft and its files are gone, and the history names the file", (await a.locator(".mfiles.out").count()) === 0 && (await S(a, `S.deals.find(d => d.id === '${mailDeal}').history[0].body`)).includes("Plan d'accès.pdf"));
ok("the real server refuses a file of another deal and a recipient outside the deal", (await a.request.post(`${BASE}/api/mail/send`, { data: { dealId: mailDeal, subject: "x", html: "<p>x</p>", files: ["00000000-0000-0000-0000-000000000000"] } })).status() === 400
  && (await a.request.post(`${BASE}/api/mail/send`, { data: { dealId: mailDeal, subject: "x", html: "<p>x</p>", to: ["alba@test.local", "boss@corp.com"] } })).status() === 400);
await a.evaluate(() => { const { S } = window.__app; S.mailkit = { templates: [], signature: "" }; return window.__app.persist(); });
await a.waitForTimeout(1800); await a.evaluate(() => { const { S, mails } = window.__app; S.mail = { on: false }; mails.clear(); S.composer = "Notes"; S.notice = ""; window.dispatchEvent(new HashChangeEvent("hashchange")); });
await a.context().unroute("**/api/mail?**"); await a.context().unroute("**/api/mail/send");
await a.click('[data-comp="Événement"]'); ok("the information sheet is shown as text, never as markup", (await a.locator(".evt").innerText()).includes("Terrasse <b>ouest</b>"));
// From the calendar, a stay opens in a panel and can be worked on there, without leaving the calendar
await a.goto(`${BASE}/#reservations`); await a.waitForSelector(".cmonth"); await a.evaluate(() => { window.__app.S.month = "2027-08"; }); await a.click('[data-a="rail"]'); await a.click('[data-a="rail"]');
await a.locator('[data-go="affaire-t27-ok"]').first().click(); await a.waitForSelector(".drawer.peek .dealhead");
ok("a stay clicked in the calendar opens in a panel over it", (await a.evaluate(() => location.hash)) === "#reservations" && (await a.locator(".cmonth").count()) >= 1 && (await a.locator(".drawer.peek h2").first().innerText()).includes("Alba"));
await a.click('.drawer.peek [data-comp="Notes"]'); await a.fill(".drawer.peek #note", "Note prise depuis le calendrier"); await a.click('.drawer.peek [data-a="note"]'); await settle(a);
ok("what is done in the panel lands on that deal", (await S(a, "S.deals.find(d => d.id === 't27-ok').pinned.some(h => h.body === 'Note prise depuis le calendrier')")) === true);
await a.click('.drawer.peek [data-a="peek-close"]'); await a.waitForSelector(".drawer.peek", { state: "detached" });
ok("closing the panel leaves the calendar as it was", (await a.evaluate(() => location.hash)) === "#reservations" && (await S(a, "S.month")) === "2027-08");
await a.evaluate(() => { window.__app.S.deals = []; return window.__app.persist(); }); await settle(a); await a.reload(); await a.waitForSelector(".topbar h1");
ok("deleting is saved too", (await S(a, "S.deals.length")) === 0);
await a.evaluate(() => fetch("/auth/logout", { method: "POST" })); await a.reload(); await a.waitForSelector(".logincard");
ok("after sign-out the session is gone", (await a.evaluate(() => fetch("/api/state").then((r) => r.status))) === 401);

console.log(out.join("\n")); console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no page error");
console.log(out.filter((l) => l.startsWith("FAIL")).length + " failed of " + out.length);
await b.close();
