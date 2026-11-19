// Every screen of the app with a few made-up deals in it: no script error, no button without an
// action, and the main journeys of the deal page. Run after journeys.mjs, against a local server.
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3300", out = [], errors = [];
const ok = (name, cond, seen = "") => out.push(`${cond ? "OK  " : "FAIL"} ${name}${cond ? "" : " -> " + seen}`);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
p.on("pageerror", (e) => errors.push(String(e).slice(0, 300))); p.on("console", (m) => m.type() === "error" && !/status of (401|403|409|415)/.test(m.text()) && !m.location().url.includes("/ical/not-the-secret") && errors.push(m.text().slice(0, 300) + " " + m.location().url));
await p.goto(`${BASE}/auth/dev?email=alice@test.local&name=Alice`); await p.waitForSelector(".topbar h1");
const settle = () => p.waitForTimeout(700), txt = (sel) => p.locator(sel).first().innerText().catch(() => "");
const S = (expr) => p.evaluate(`(() => { const { S, TERMS, bookings } = window.__app; return ${expr}; })()`);
await p.evaluate(() => fetch("/api/settings/prefs", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ value: { buffer: 0, deposit: 30, hold: 2500, plSeq: { D: 0, F: 0 }, sources: [] } }) }));
await p.evaluate(() => fetch("/api/settings/bank", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ value: { lines: [], last: "jamais" } }) }));
await p.reload(); await p.waitForSelector(".topbar h1");
// Made-up deals, one per stage, written through the app's own factory.
await p.evaluate(() => { const { S, mk } = window.__app; S.deals = []; const y = new Date().getFullYear() + 1;
  const c = (n) => ({ name: n, email: n.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com", phone: "06 00 00 00 00", address: "1 rue de l'Exemple, 75000 Paris" });
  S.deals.push(mk("t-demande", "Famille Exemple", "Séjour", 0, 4200, `${y}-07-03`, `${y}-07-10`, 14, 14, "Site web", c("Hugo Exemple")),
    mk("t-visite", "Sophie & Antoine Test", "Mariage", 1, 14000, `${y}-06-10`, `${y}-06-13`, 90, 22, "Salon du mariage", c("Sophie Test")),
    mk("t-option", "Anna Essai", "Anniversaire", 2, 5200, `${y}-05-14`, `${y}-05-16`, 35, 20, "Recommandation", c("Anna Essai")),
    mk("t-devis", "Julie & Thomas Modele", "Mariage", 3, 12500, `${y}-08-26`, `${y}-08-29`, 80, 22, "Site web", c("Julie Modele")),
    mk("t-signe", "Elise & Marc Fictif", "Mariage", 4, 9000, `${y}-05-20`, `${y}-05-23`, 40, 22, "Recommandation", c("Elise Fictif")),
    mk("t-solde", "Lea Demo", "Séjour", 5, 3900, `${y}-04-18`, `${y}-04-25`, 12, 12, "Airbnb", c("Lea Demo")));
  return window.__app.persist(); });
await settle(); await p.reload(); await p.waitForSelector(".board");
ok("six made-up deals saved and reloaded", (await S("S.deals.length")) === 6);
ok("a signed deal gets its schedule, a request gets none", (await S("S.deals.find(d => d.id === 't-signe').payments.length")) === 3 && (await S("S.deals.find(d => d.id === 't-demande').payments.length")) === 0);
ok("no invented document or e-mail on a new deal", (await S("S.deals.every(d => d.docs.length === 0 && d.emails.length === 0)")));

const dead = [];
for (const h of ["#affaires", "#reservations", "#contacts", "#documents", "#audit", "#taches", "#statistiques", "#reglages", "#affaire-t-signe", "#affaire-t-option", "#affaire-t-demande", "#contact-t-signe"]) {
  await p.goto(`${BASE}/${h}`); await p.waitForTimeout(350);
  ok("screen " + h, (await p.locator(".topbar h1").count()) === 1 && !(await p.locator("#app").innerText()).match(/undefined|NaN|\[object/), (await p.locator("#app").innerText()).match(/.{0,30}(undefined|NaN|\[object).{0,30}/)?.[0] ?? "no topbar");
  const sel = await p.evaluate(() => window.__app.SEL);
  for (const f of await p.evaluate((s) => [...document.querySelectorAll("button, a")].filter((el) => !el.matches(s) && !el.matches("[data-cmd]") && !(el.tagName === "A" && /^(#|\/api\/|\/auth\/|https:\/\/)/.test(el.getAttribute("href") ?? "")) && !el.disabled).map((el) => el.outerHTML.slice(0, 100)), sel)) dead.push(h + " " + f);
}
ok("no button without an action", dead.length === 0, "\n   " + dead.slice(0, 8).join("\n   "));
for (const v of ["year", "season", "month"]) { await p.goto(`${BASE}/#reservations`); await p.click(`[data-calview="${v}"]`); await p.click(v === "month" ? '[data-month="1"]' : '[data-year="1"]'); await p.waitForTimeout(200); ok("calendar view " + v, (await p.locator(v === "season" ? ".srow" : ".cmonth").count()) >= 1); }
await p.evaluate(() => { window.__app.S.month = `${new Date().getFullYear() + 1}-05`; }); await p.click('[data-calview="season"]');
ok("the season line shows next year's held stays", (await p.locator(".sbar").count()) === 4, String(await p.locator(".sbar").count()));

// Deal page journeys
await p.goto(`${BASE}/#affaire-t-option`); await p.waitForSelector(".dealhead");
ok("an option expects quote and contract only", (await txt(".h .count")) === "0 sur 2", await txt(".h .count"));
await p.click('[data-slot="devis"][data-a="slot-create"]'); await p.fill("#ql-0-p", "5000");
ok("quote lines drive the total", (await txt("#q-total")).replace(/\s/g, "") === "5450€", await txt("#q-total"));
await p.click('[data-a="pl-final"]');
ok("finalising numbers the quote and freezes it", (await S("S.deals.find(d => d.id === 't-option').docs[0].pl.num")) === "D-2026-001" || /^D-\d{4}-001$/.test(await S("S.deals.find(d => d.id === 't-option').docs[0].pl.num")), await S("S.deals.find(d => d.id === 't-option').docs[0].pl.num"));
ok("no leftover of unplugged features in the panel", (await p.locator('[data-a="doc-mail"], [data-a="sig-new"]').count()) === 0 && !(await txt(".drawer")).includes("Pennylane"));
await p.click("#close-preview"); await p.click('[data-slot="contrat"][data-a="slot-create"]');
ok("without Drive, creating a contract offers to connect it first", (await p.locator('.modal a[href="/auth/drive"]').count()) === 1);
await p.click('[data-a="confirm-yes"]'); await p.click("#doc-edit h2"); await p.keyboard.press("End"); await p.keyboard.type(" (modifié)"); await settle(); await p.reload(); await p.waitForSelector(".dealhead");
ok("an edited contract is saved", ((await S("S.deals.find(d => d.id === 't-option').docs.find(x => x.slot === 'contrat').body")) ?? "").includes("(modifié)"));
await p.click('[data-comp="Visite"]'); await p.fill("#vs-date", "2027-03-06"); await p.fill("#vs-time", "10:30"); await p.fill("#vs-note", "Avec les parents"); await p.click('[data-a="visit-add"]'); await p.click('[data-comp="Événement"]'); await p.fill("#pv-name", "Traiteur Test"); await p.click('[data-a="pv-add"]');
await p.click('[data-edit="guests"]'); await p.fill("#e-guests", "42"); await p.keyboard.press("Enter"); await settle(); await p.reload(); await p.waitForSelector(".dealhead");
ok("visit, provider and an edited field are saved", (await S("(() => { const d = S.deals.find(x => x.id === 't-option'); return d.visits.length === 1 && d.visits[0].time === '10:30' && d.providers.length === 1 && d.guests === 42; })()")));
ok("the history names the person who did it", (await S("S.deals.find(d => d.id === 't-option').history[0].by")) === "Alice");
await p.goto(`${BASE}/#affaire-t-signe`); await p.waitForSelector(".dealhead");
await p.click('[data-pay="settle"][data-id="dep"]'); await p.click('[data-pay="confirm-settle"]'); await settle();
ok("a payment marked received shows in the figures", (await S("S.deals.find(d => d.id === 't-signe').payments[0].status")) === "paid");
await p.goto(`${BASE}/#affaires`); await p.waitForSelector(".board");
ok("figures at the top follow the data", (await txt(".kpis .v")).replace(/\s/g, "") === "12900€" && (await p.locator(".kpi").nth(1).innerText()).replace(/\s/g, "").includes("2700€"), await txt(".kpis"));
// Bank statement: made-up lines, one of which pays the deposit of the signed deal
const csv = 'Date,Description,Amount,Bank Account\n"05/01/2027","VIR SEPA M ET MME FICTIF ACOMPTE MARIAGE","2700.00","Compte"\n"06/01/2027","PRLV ASSURANCE","-120.50","Compte"\n"07/01/2027","VIR AUTRE CLIENT","2700.00","Compte"\n';
await p.goto(`${BASE}/#affaire-t-signe`); await p.waitForSelector(".dealhead"); await p.click('[data-pay="undo"][data-id="dep"]'); await p.click('[data-pay="confirm-undo"]'); await settle();
await p.goto(`${BASE}/#reglages`); await p.waitForSelector("#bank-file");
await p.setInputFiles("#bank-file", { name: "releve.csv", mimeType: "text/csv", buffer: Buffer.from(csv) }); await settle();
ok("a statement keeps the incoming lines only and matches the deposit", (await S("S.bankStatement.length")) === 2 && (await S("S.deals.find(d => d.id === 't-signe').payments[0].status")) === "paid" && (await S("S.deals.find(d => d.id === 't-signe').payments[0].paidOn")) === "2027-01-05", await txt(".flash"));
await p.setInputFiles("#bank-file", { name: "releve.csv", mimeType: "text/csv", buffer: Buffer.from(csv) }); await settle();
ok("importing the same statement twice adds nothing", (await S("S.bankStatement.length")) === 2 && (await txt(".flash")).includes("0 nouvel"), await txt(".flash"));
await p.setInputFiles("#bank-file", { name: "bad.csv", mimeType: "text/csv", buffer: Buffer.from('Date,Description,Amount\n"2027-01-05","X","12"\n') }); await settle();
ok("an unreadable statement is refused whole", (await txt(".notice")).includes("JJ/MM/AAAA") && (await S("S.bankStatement.length")) === 2);
ok("cents are exact", (await p.evaluate(() => window.__app.parseStatement('Date,Description,Amount\n"01/02/2027","A","1234.56"\n"01/02/2027","B","0.07"\n').lines.map((l) => l.amount).join("|"))) === "1234.56|0.07");
// Backup and the calendar other sites read
const backup = await p.evaluate(() => fetch("/api/backup").then((r) => r.json()));
ok("a backup holds the deals and the settings", backup.format === "domaine-backup-1" && backup.deals.length === 6 && backup.settings.some((s) => s.key === "bank"));
const ical = await p.evaluate(() => window.__app.S.admin.icalUrl);
const feed = await p.evaluate((u) => fetch(new URL(u).pathname).then((r) => r.text()), ical);
ok("my calendar lists held stays without any name", (feed.match(/BEGIN:VEVENT/g) ?? []).length === 4 && !/Fictif|Essai|Modele|Demo/.test(feed) && feed.includes("SUMMARY:Réservé"), feed.slice(0, 200));
ok("a wrong calendar link gives nothing", (await p.evaluate(() => fetch("/ical/not-the-secret-not-the-secret.ics").then((r) => r.status))) === 404);
await p.goto(`${BASE}/#affaires`); await p.waitForSelector(".board");
await p.keyboard.press("Control+k"); await p.keyboard.type("fictif");
ok("search finds a deal and its contact", (await p.locator(".searchm .pick").count()) >= 2); await p.keyboard.press("Escape");
await p.goto(`${BASE}/#taches`); await p.waitForTimeout(300); await p.click('[data-a="task-new"]'); await p.fill("#tk-text", "Rappeler pour la visite"); await p.click('[data-a="task-add"]'); await p.waitForTimeout(300);
ok("a task added from the task page shows in the list", (await p.locator(".row.task").count()) === 1);
await p.evaluate(() => { window.__app.S.deals = []; return window.__app.persist(); }); await settle();
console.log(out.join("\n")); console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no page error");
console.log(out.filter((l) => l.startsWith("FAIL")).length + " failed of " + out.length);
await b.close();
