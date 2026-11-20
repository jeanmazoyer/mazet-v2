// The register of invoices: what the accounting tool says was invoiced, read from its export, matched
// to the stays, then checked against what each stay received. Nothing here touches the page, so that
// these rules can be run and tested alone.

const plain = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const near = (a, b) => Math.abs(a - b) < 0.005;
const round2 = (n) => Math.round(n * 100) / 100;
const got = (p) => p.got ?? p.amount;

/* ---------- Reading an export ---------- */
// Accounting tools do not agree on a separator: the one that cuts the first line into most pieces is the one.
function rowsOf(text) {
  const src = text.replace(/^﻿/, ""), first = src.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const sep = [";", "\t", ","].reduce((best, s) => (first.split(s).length > first.split(best).length ? s : best), ";");
  const rows = []; let row = [], cell = "", quoted = false;
  const end = () => { row.push(cell.trim()); cell = ""; if (row.some((c) => c !== "")) rows.push(row); row = []; };
  for (let i = 0; i < src.length; i++) { const ch = src[i];
    if (quoted) { if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch; }
    else if (ch === '"') quoted = true; else if (ch === sep) { row.push(cell.trim()); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && src[i + 1] === "\n") i++; end(); } else cell += ch; }
  if (cell !== "" || row.length) end();
  return rows;
}
// Column names as each tool writes them, most precise first. A date of payment or a rate of tax is never the column wanted.
const COLS = {
  n: [/^(numero|n|no|num|ref|reference)( de| d une)?( la)? ?(facture|piece|document)?$/, /numero/, /invoice (number|no|id)/, /^(number|facture|piece)$/],
  on: [/date.*(emission|facture|facturation)/, /^(emise le|date|invoice date|issue date)$/, /^date/],
  who: [/^(client|nom du client|nom client|customer|customer name|tiers|destinataire|raison sociale)$/, /client|customer/],
  label: [/^(libelle|intitule|titre|objet|designation|description|label|title)$/, /libelle|intitule|objet|designation/],
  ht: [/\bht\b/, /hors taxe/, /excl/],
  ttc: [/\bttc\b/, /toutes taxes/, /incl/],
  vat: [/montant.*\btva\b|\btva\b.*montant/, /\btva\b/, /\bvat\b/],
  status: [/^(statut|etat|status|state)$/],
  kind: [/^(type|nature|type de document)$/],
};
const NEVER = { on: /echeance|paiement|reglement|due|creation|modif/, vat: /taux|rate|%/, ht: /tva|vat/ };
function columns(head) {
  const names = head.map((h) => plain(h).replace(/[^a-z0-9%]+/g, " ").trim()), col = {};
  for (const [key, tries] of Object.entries(COLS)) { col[key] = -1;
    for (const re of tries) { const at = names.findIndex((h) => re.test(h) && !(NEVER[key] && NEVER[key].test(h))); if (at >= 0) { col[key] = at; break; } } }
  // A lone "Total" or "Montant" is what the client pays when the file names no other amount.
  if (col.ttc < 0 && col.ht < 0) col.ttc = names.findIndex((h) => /^(total|montant|amount)$/.test(h));
  return col;
}
/** An amount as a tool writes it ("1 234,56 €", "1,234.56", "(500,00)"), in euros. Null when it is not one. */
export function amountOf(raw) {
  let s = String(raw ?? "").replace(/[\s  €]|eur/gi, "").replace(/−/g, "-");
  if (!s) return null;
  const neg = /^-|-$|^\(.*\)$/.test(s); s = s.replace(/[()+-]/g, "");
  const c = s.lastIndexOf(","), p = s.lastIndexOf(".");
  let at = -1;
  if (c >= 0 && p >= 0) at = Math.max(c, p);
  // One kind of mark only: it is the decimal one unless it groups thousands (three digits after it, or several marks).
  else if (c >= 0 || p >= 0) { const i = Math.max(c, p), mark = s[i]; if (s.indexOf(mark) === i && s.length - i - 1 !== 3) at = i; }
  const whole = (at < 0 ? s : s.slice(0, at)).replace(/[.,]/g, ""), frac = at < 0 ? "" : s.slice(at + 1);
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(frac)) return null;
  // Cents are built from the digits, never by multiplying a decimal number.
  const cents = Number(whole) * 100 + Math.round(Number((frac + "00").slice(0, 3)) / 10);
  return (neg ? -cents : cents) / 100;
}
const pad = (v) => String(v).padStart(2, "0");
function dayOf(raw) {
  const s = String(raw ?? "").trim(); let m, y, mo, d;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) [y, mo, d] = [m[1], m[2], m[3]];
  else if ((m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?!\d)/.exec(s))) [y, mo, d] = [m[3].length === 2 ? "20" + m[3] : m[3], m[2], m[1]];
  else return "";
  return Number(mo) >= 1 && Number(mo) <= 12 && Number(d) >= 1 && Number(d) <= 31 ? `${y}-${pad(mo)}-${pad(d)}` : "";
}
/**
 * The invoices of an export. A credit note comes out negative, a draft is left out, a line without a
 * number (a total, a blank) is ignored. The file is refused whole when its columns cannot be told.
 */
export function parseInvoices(text, src = "") {
  const rows = rowsOf(String(text ?? ""));
  if (!rows.length) return { error: "le fichier est vide" };
  // Some exports open with a title: the header is the first line that names a number and an amount.
  const usable = (c) => c.n >= 0 && (c.ttc >= 0 || (c.ht >= 0 && c.vat >= 0));
  const at = rows.slice(0, 6).findIndex((r) => usable(columns(r)));
  if (at < 0) return { error: "colonnes attendues : un numéro de facture et un montant TTC (ou HT et TVA)" };
  const col = columns(rows[at]), cell = (r, k) => (col[k] >= 0 ? r[col[k]] ?? "" : ""), list = [];
  let skipped = 0;
  for (const r of rows.slice(at + 1)) {
    const n = cell(r, "n").replace(/^n°\s*/i, "").slice(0, 40); if (!n) continue;
    const ht = amountOf(cell(r, "ht")), vat = amountOf(cell(r, "vat")), full = amountOf(cell(r, "ttc"));
    const ttc = full ?? (ht !== null && vat !== null ? round2(ht + vat) : null);
    if (ttc === null || /brouillon|draft/.test(plain(cell(r, "status")))) { skipped++; continue; }
    const credit = ttc > 0 && /avoir|credit ?note/.test(plain(`${cell(r, "kind")} ${n}`)), sign = credit ? -1 : 1, before = ht ?? (vat !== null ? round2(ttc - vat) : null);
    list.push({ n, on: dayOf(cell(r, "on")), who: cell(r, "who").slice(0, 120), label: cell(r, "label").slice(0, 200), ...(before === null ? {} : { ht: sign * before }), ttc: sign * ttc, ...(src ? { src: String(src).slice(0, 40) } : {}) });
    if (list.length >= 2000) break;
  }
  const sum = (k) => round2(list.reduce((s, i) => s + (i[k] ?? 0), 0));
  return { list, skipped, ht: sum("ht"), ttc: sum("ttc") };
}

const keyOf = (n) => plain(n).replace(/\s+/g, "");
const byDate = (a, b) => ((a.on || "9999") < (b.on || "9999") ? -1 : (a.on || "9999") > (b.on || "9999") ? 1 : a.n.localeCompare(b.n, "fr", { numeric: true }));
/** A second file adds to the register. The same number is updated in place, and keeps the stay it was linked to by hand. */
export function mergeInvoices(have, list) {
  const out = new Map(have.map((i) => [keyOf(i.n), i])); let added = 0, updated = 0;
  for (const i of list) { const k = keyOf(i.n), old = out.get(k);
    if (old) { out.set(k, { ...i, ...(old.deal ? { deal: old.deal } : {}) }); updated++; } else { out.set(k, i); added++; } }
  return { list: [...out.values()].sort(byDate), added, updated };
}

/* ---------- Which stay an invoice is for ---------- */
const STOP = new Set(("mariage sejour retraite vacances anniversaire famille annule and les des mme mlle monsieur madame sarl sas eurl sci facture acompte solde location domaine weekend seminaire the pour"
  + " janvier fevrier mars avril mai juin juillet aout septembre octobre novembre decembre").split(" "));
const words = (s) => plain(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w));
function namesOf(d) {
  const people = [d.contact?.name, ...(d.tenants ?? [])].filter(Boolean);
  // A family name is the last word of a full name: someone known by a first name alone has none here.
  return { all: new Set(words([d.title, ...people].join(" "))), family: new Set(people.map((p) => words(p)).filter((w) => w.length >= 2).map((w) => w[w.length - 1])) };
}
const owes = (d, ttc) => (d.payments ?? []).some((p) => !p.hold && (near(p.amount, Math.abs(ttc)) || near(got(p), Math.abs(ttc))));
/**
 * Each invoice with its stay. A link made by hand wins. Otherwise the client's name decides: two words
 * in common, or the family name. A first name alone is shared by too many stays: the amount must then
 * be one the stay expects. What stays undecided is left loose, to be linked by hand.
 */
export function assignInvoices(invoices, deals) {
  const byId = new Map(deals.map((d) => [d.id, d])), names = new Map(deals.map((d) => [d.id, namesOf(d)])), byDeal = {}, loose = [];
  for (const i of invoices) {
    let pick = i.deal && byId.has(i.deal) ? byId.get(i.deal) : null;
    if (!pick && !i.deal) { const w = new Set(words(`${i.who} ${i.label}`));
      const scored = deals.map((d) => { const n = names.get(d.id), shared = [...w].filter((x) => n.all.has(x)); return { d, s: shared.length, family: shared.some((x) => n.family.has(x)) }; }).filter((x) => x.s > 0);
      const best = Math.max(0, ...scored.map((x) => x.s)), top = scored.filter((x) => x.s === best);
      if (top.length === 1 && (best >= 2 || top[0].family)) pick = top[0].d;
      else { const byAmount = scored.filter((x) => owes(x.d, i.ttc)); if (byAmount.length === 1) pick = byAmount[0].d; } }
    if (pick) (byDeal[pick.id] ??= []).push(i); else loose.push(i);
  }
  // An invoice without a date was issued no later than the next number that has one.
  const plainNo = (i) => /^\d+$/.test(i.n), dated = invoices.filter((i) => i.on && plainNo(i)), upTo = {};
  for (const i of invoices) { if (i.on || !plainNo(i)) continue; const next = dated.filter((j) => Number(j.n) > Number(i.n)).map((j) => j.on).sort()[0]; if (next) upTo[i.n] = next; }
  return { byDeal, loose, upTo };
}

/* ---------- What the audit says of a stay's invoices ---------- */
// A gap between an invoice and a payment wider than this is not the same payment.
const SAME_PAYMENT = 0.25;
/**
 * The remarks on a stay's invoicing. `mine` are the invoices of the register matched to it; `o` gives
 * the page's way of writing amounts and days, the first day the bank statement covers, the latest day
 * an undated invoice can be from, and whether a register was imported at all. Money received and never invoiced is blocking, and so is an invoice
 * that is wrong: twice the same payment, another amount, or the security deposit counted in.
 */
export function billing(d, mine, o) {
  const out = [], add = (c, lvl, t) => out.push({ c, lvl, t }), col = (p) => (p.id.startsWith("dep") ? "acompte" : "solde"), lost = d.status === "Perdu";
  const lines = (d.payments ?? []).filter((p) => !p.hold), paid = lines.filter((p) => p.status === "paid"), hold = (d.payments ?? []).find((p) => p.hold);
  const has = (slot) => (d.docs ?? []).some((x) => x.slot === slot), low = (p) => p.kind.charAt(0).toLowerCase() + p.kind.slice(1), on = (i) => (i.on ? ` du ${o.day(i.on)}` : "");
  if (lost) {
    // Money given back leaves an invoice standing for a sale that did not happen.
    const net = round2(mine.reduce((s, i) => s + i.ttc, 0)), kept = Math.max(0, round2(paid.reduce((s, p) => s + got(p), 0) - (d.refunds ?? []).reduce((s, r) => s + r.amount, 0)));
    if (net > kept + 0.005) add("solde", "bad", `Séjour annulé : ${o.eur(net)} facturés pour ${o.eur(kept)} gardés après remboursement. Un avoir de ${o.eur(round2(net - kept))} est à émettre.`);
    return out;
  }
  if (!o.registered) {
    const bills = [["acompte", "dep", "d'acompte"], ["solde", "bal", "de solde"]].filter(([slot, id]) => lines.some((p) => p.id.startsWith(id)) && !has(slot));
    if (bills.length) add(bills[0][0], "warn", `Facture ${bills.map((x) => x[2]).join(" et facture ")} absente${bills.length > 1 ? "s" : ""} du dossier (registre des factures non importé).`);
    return out;
  }
  const sorted = [...mine].sort(byDate), live = sorted.filter((i) => i.ttc > 0), used = new Set(), pair = new Map();
  // A credit note cancels the invoice of the same amount: neither is looked at again.
  sorted.filter((i) => i.ttc < 0).forEach((c) => { const hit = live.find((i) => !used.has(i) && near(i.ttc, -c.ttc)); if (hit) used.add(hit); });
  // A payment seen at the bank is served before one that is only noted: it is the one that must have its invoice.
  const order = [...paid].sort((a, b) => Number(Boolean(b.bank)) - Number(Boolean(a.bank)));
  const free = () => live.filter((i) => !used.has(i)), rest = () => order.filter((p) => !pair.has(p)), take = (p, i) => { pair.set(p, i); used.add(i); };
  // Two payments of the same amount are told apart by their time: an invoice issued before the period the
  // bank statement covers is for the payment made before it. Invoices are issued in batches, so nothing finer holds.
  const issued = (i) => i.on || o.upTo?.[i.n] || "", early = (i) => Boolean(o.start && issued(i) && issued(i) < o.start), before = (p) => !p.bank && !(o.start && p.paidOn && p.paidOn >= o.start);
  const exact = (i, pool) => pool.find((p) => near(i.ttc, got(p))) ?? pool.find((p) => near(i.ttc, p.amount));
  // One invoice for a payment made in several transfers.
  const several = (i, pool) => { for (let mask = 3; mask < 1 << Math.min(pool.length, 10); mask++) { const set = pool.filter((_, k) => mask & (1 << k)); if (set.length > 1 && near(set.reduce((s, p) => s + got(p), 0), i.ttc)) return set; } return null; };
  for (const i of free()) { const pool = rest().filter((p) => before(p) === early(i)), hit = exact(i, pool); if (hit) take(hit, i); else (several(i, pool) ?? []).forEach((p) => take(p, i)); }
  for (const i of free()) { const hit = exact(i, rest()); if (hit) take(hit, i); }
  for (const i of free()) {
    const open = rest(), group = near(i.ttc, d.amount) && open.length ? open : several(i, open);
    if (group) { group.forEach((p) => take(p, i)); continue; }
    const withHold = hold && open.find((p) => near(i.ttc, got(p) + hold.amount));
    if (withHold) { take(withHold, i); add(col(withHold), "bad", `La facture n° ${i.n}${on(i)} (${o.eur(i.ttc)}) comprend la caution de ${o.eur(hold.amount)} : elle ne devrait porter que sur ${o.eur(got(withHold))}.`); continue; }
    const twin = [...pair].find(([, j]) => near(j.ttc, i.ttc));
    if (twin) { used.add(i); add(col(twin[0]), "bad", `${twin[0].kind} de ${o.eur(i.ttc)} facturé deux fois : n° ${twin[1].n}${on(twin[1])} et n° ${i.n}${on(i)}.`); continue; }
    const close = open.filter((p) => Math.abs(i.ttc - got(p)) <= SAME_PAYMENT * got(p)).sort((a, b) => Math.abs(i.ttc - got(a)) - Math.abs(i.ttc - got(b)))[0];
    if (close) { take(close, i); add(col(close), "bad", `Facture n° ${i.n} de ${o.eur(i.ttc)} pour ${o.eur(got(close))} reçus (${low(close)}${i.on ? ", facture" + on(i) : ""}, écart de ${o.eur(round2(Math.abs(i.ttc - got(close))))}) : à corriger.`); continue; }
    used.add(i); add("solde", "warn", `Facture n° ${i.n}${on(i)} de ${o.eur(i.ttc)} sans encaissement correspondant dans ce dossier.`);
  }
  for (const p of rest()) {
    if (p.proof === "facture" || has(col(p))) continue;
    const when = p.paidOn ? ` le ${o.day(p.paidOn)}` : "";
    // What a platform pays out is not a client's transfer: whether it needs an invoice is the accountant's call.
    if (/airbnb|booking|abritel/i.test(p.kind)) add(col(p), "warn", `${p.kind} : ${o.eur(got(p))} versés${when}, sans facture. À voir avec le comptable.`);
    else if (p.bank || (o.start && p.paidOn && p.paidOn >= o.start)) add(col(p), "bad", `${p.kind} de ${o.eur(got(p))} reçu${when}, sans facture au registre.`);
    else add(col(p), "info", `${p.kind} de ${o.eur(got(p))} reçu avant la période vérifiable : facture absente du registre, à chercher parmi les plus anciennes.`);
  }
  return out;
}
