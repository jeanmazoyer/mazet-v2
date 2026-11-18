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
await a.click("#close-preview"); await a.goto(`${BASE}/#reglages`); await a.waitForSelector(".setgrid"); await a.click('[data-a="dep-plus"]'); await settle(a);
await a.reload(); await a.waitForSelector(".setgrid");
ok("a setting survives a reload", (await S(a, "TERMS.deposit")) === 35);
ok("cards of features not plugged in are not shown", !(await a.locator(".setgrid").innerText()).includes("Pennylane"));
const team = await person("carol@test.local", "team");
ok("the team does not receive the bank statement or the calendar secret", await team.evaluate(() => fetch("/api/state").then((r) => r.json()).then((s) => !("bank" in s.settings) && !("ical_token" in s.settings) && s.admin === null)));
ok("the team cannot download a backup", (await team.evaluate(() => fetch("/api/backup").then((r) => r.status))) === 403); await team.goto(`${BASE}/#reglages`); await team.waitForSelector(".lockcard");
ok("the team sees the settings locked", (await team.locator(".lockcard").count()) === 1);
ok("the server refuses a setting or a deletion from the team", (await team.evaluate(() => fetch("/api/settings/prefs", { method: "PUT", headers: { "content-type": "application/json" }, body: '{"value":{}}' }).then((r) => r.status))) === 403
  && (await team.evaluate((i) => fetch("/api/deals/" + i, { method: "DELETE" }).then((r) => r.status), id)) === 403);

// Import a planning file, then delete what the test created
writeFileSync("/tmp/domaine-plan.json", JSON.stringify([{ title: "Séjour importé", kind: "Séjour", start: "2027-07-14", end: "2027-07-21", guests: 12 }, { title: "", start: "x" }]));
await a.setInputFiles("#imp-file", "/tmp/domaine-plan.json"); await settle(a);
ok("a planning file becomes deals, bad lines are skipped", (await S(a, "S.deals.some(d => d.title === 'Séjour importé' && d.stage === 4)")) && (await a.locator(".flash").innerText()).includes("1 ligne ignorée"), await a.locator(".flash").innerText().catch(() => ""));
await a.goto(`${BASE}/#reservations`); await a.waitForSelector(".cmonth"); await a.click('[data-calview="season"]'); await a.click('[data-year="1"]');
ok("the season line shows the imported stay", (await a.locator(".sbar").count()) >= 1);
await a.evaluate(() => { window.__app.S.deals = []; return window.__app.persist(); }); await settle(a); await a.reload(); await a.waitForSelector(".topbar h1");
ok("deleting is saved too", (await S(a, "S.deals.length")) === 0);
await a.evaluate(() => fetch("/auth/logout", { method: "POST" })); await a.reload(); await a.waitForSelector(".logincard");
ok("after sign-out the session is gone", (await a.evaluate(() => fetch("/api/state").then((r) => r.status))) === 401);

console.log(out.join("\n")); console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no page error");
console.log(out.filter((l) => l.startsWith("FAIL")).length + " failed of " + out.length);
await b.close();
