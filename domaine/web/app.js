
import { Idiomorph } from "/vendor/idiomorph.js";
import { CONTRACT } from "/contract.js";
const I = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.900 6.500 5.500"/><circle cx="17.5" cy="9" r="2.500"/><path d="M17 14.500c2.400.2 4 1.700 4.500 4.500"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  gear: '<path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0"/><circle cx="15" cy="6" r="2.500"/><circle cx="9" cy="12" r="2.500"/><circle cx="17" cy="18" r="2.500"/>',
  home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  star: '<path d="m12 3 2.700 5.800 6.300.800-4.600 4.400 1.200 6.300L12 17.200l-5.600 3.100 1.200-6.300L3 9.600l6.300-.800z"/>',
  plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chev: '<path d="m6 15 6-6 6 6"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  alert: '<path d="M12 8v5M12 16.500v.5"/><circle cx="12" cy="12" r="9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3 5 6v6c0 4.500 3 7.500 7 9 4-1.500 7-4.500 7-9V6z"/>',
  bank: '<path d="M3 10 12 4l9 6M5 10v8M9.500 10v8M14.500 10v8M19 10v8M3 20h18"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.500-4.500L4 8M4 4v4h4M4 13a8 8 0 0 0 14.500 4.500L20 16M20 20v-4h-4"/>',
  pin: '<path d="M9 3h6l-1 6 3 3H7l3-3zM12 12v9"/>',
  euro: '<circle cx="12" cy="12" r="9"/><path d="M15.500 8.500a4.500 4.500 0 1 0 0 7M7.500 11h6M7.500 13.500h5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.500 6h.01M3.500 12h.01M3.500 18h.01"/>',
  cols: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>',
  heart: '<path d="M12 20s-7-4.500-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  send: '<path d="M4 12 20 4l-6 16-3-7z"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  down: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  spark: '<path d="m11 3 1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="m18.5 15 .9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  tasks: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  chart: '<path d="M5 20V11M11 20V5M17 20v-6M3 20h18"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
  dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  clip: '<path d="M20 11.5 12.5 19a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4l7-7"/>',
  left: '<path d="m15 6-6 6 6 6"/>', right: '<path d="m9 6 6 6-6 6"/>',
};
const ico = (n, c = "") => `<svg class="ico ${c}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// A plain no-break space between thousands: the narrow one all but vanishes in heavy type.
const eur = (n) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n).replace(/\u202f/g, "\u00a0") + "\u00a0€";
const MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
// Every single day is written in words ("30 sept. 2025"), like the stays, never as digits.
const fr = (iso) => { if (!iso) return "date inconnue"; const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS_SHORT[m - 1]} ${y}`; };
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const longDay = (iso) => { if (!iso) return "date à définir"; const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
// A stay written the way it is said aloud: "14 au 17 mai 2026", the month and year given once.
const NO_DATES = "Dates à définir";
const range = (a, b) => { if (!a || !b) return NO_DATES; const [ya, ma, da] = a.split("-").map(Number), [yb, mb, db] = b.split("-").map(Number);
  if (ya === yb && ma === mb) return `${da} au ${db} ${MONTHS[ma - 1]} ${ya}`;
  if (ya === yb) return `${da} ${MONTHS[ma - 1]} au ${db} ${MONTHS[mb - 1]} ${ya}`;
  return `${da} ${MONTHS[ma - 1]} ${ya} au ${db} ${MONTHS[mb - 1]} ${yb}`; };
const nights = (a, b) => (a && b ? Math.round((Date.parse(b) - Date.parse(a)) / 864e5) : 0);
const TODAY = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();
const STAGES = ["Demande", "Visite", "Option", "Devis envoyé", "Signé", "Soldé"];
const KIND = { Mariage: "t-purple", Séjour: "t-teal", Séminaire: "t-green", Anniversaire: "t-orange", Retraite: "t-orange", Famille: "" };
const KIND_ICON = { Mariage: "heart", Séjour: "home", Séminaire: "brief", Anniversaire: "star", Retraite: "star", Famille: "home" };
// What the dates of a deal are worth at its stage: a wish, an option, or a firm booking.
const hold = (d) => (d.stage >= 4 ? "firm" : d.stage >= 2 ? "option" : "wish");
const HOLD = { wish: "dates souhaitées", option: "option", firm: "réservation ferme" };

// The estate's default terms. The settings page changes them for the deals signed afterwards.
const TERMS = { deposit: 30, hold: 2500 };
function schedule(amount, start, signed, paid) {
  const dep = Math.round(amount * TERMS.deposit / 100);
  const two = new Date(Date.parse(start)); two.setUTCMonth(two.getUTCMonth() - 2);
  return [
    { id: "dep", kind: "Acompte", amount: dep, due: signed, status: paid > 0 ? "paid" : "due", paidOn: paid > 0 ? signed : null, bank: paid > 0 ? "VIR ACOMPTE" : null },
    { id: "bal", kind: "Solde", amount: amount - dep, due: two.toISOString().slice(0, 10) < signed ? signed : two.toISOString().slice(0, 10), status: paid > 1 ? "paid" : "due", paidOn: paid > 1 ? two.toISOString().slice(0, 10) : null, bank: paid > 1 ? "VIR SOLDE" : null },
    { id: "hold", kind: "Caution", amount: TERMS.hold, due: start, status: "held", paidOn: null, bank: null, hold: true },
  ];
}
function mk(id, title, kind, stage, amount, start, end, guests, sleeping, source, contact, extra = {}) {
  const signed = extra.signed ?? TODAY;
  return {
    id, title, kind, stage, amount, start, end, guests, sleeping, source,
    arrival: "16:00", departure: "18:00", status: stage >= 4 ? "Gagné" : "En cours",
    tenants: extra.tenants ?? [contact.name, ""], contact, signed,
    payments: extra.payments ?? (stage >= 4 && amount > 0 ? schedule(amount, start, signed, 0) : []),
    docs: extra.docs ?? [],
    emails: extra.emails ?? [],
    wa: extra.wa ?? [], optionUntil: extra.optionUntil ?? addDays(TODAY, 14), unread: extra.unread ?? {},
    providers: extra.providers ?? [], rooms: extra.rooms ?? [], quote: null, lostReason: "",
    todos: extra.todos ?? [], pinned: extra.pinned ?? [], history: extra.history ?? [
      { type: "Modification", t: "Affaire créée", at: stamp(), by: me().name }],
  };
}
const S = {
  role: "admin", calView: "month", real: null, docEdit: false, railOpen: (() => { try { return localStorage.getItem("rail") !== "0"; } catch (_) { return true; } })(), agentSel: null, props: [], ignored: new Set(), plSeq: { D: 0, F: 0 }, menu: null, confirm: null, flash: null, focus: null, lateOnly: false, sort: null, mq: "", mTab: "Tous", tTab: "all", sYear: TODAY.slice(0, 4), ext: null,
  user: null, loginErr: "", uploading: false, users: [],
  sources: [],
  view: "board", tab: "all", q: "", kind: "Tous les types", cq: "", cKind: "Tous les types", cSource: "Toutes les sources",
  histTab: "Toutes", composer: "Notes", edit: null, payEdit: null, sync: "", preview: null, toast: "", modal: null, modalErr: "", draft: {},
  dq: "", dType: "Tous les types", dDeal: "Toutes les affaires", dStatus: "Tous les statuts", lastBank: "jamais", showFree: false, pickSlot: null, buffer: 0, pending: null, notice: "",
  dKind: "Tous les documents", dYear: "Toutes les années", dView: "folders", openFolders: {}, exportMsg: "",
  // Files found in Google Drive that no deal claims yet.
  library: [],
  closed: { contact: true }, month: TODAY.slice(0, 7),
  bankStatement: [],
  feeds: [],
  auditYear: TODAY.slice(0, 4), auditTab: "all", auditOpen: {}, mailbox: "", drive: { on: false }, creating: "", previewOut: false, lessor: {}, peek: null, peekOut: false, build: "", stale: false, docBare: (() => { try { return localStorage.getItem("docBare") === "1"; } catch (_) { return false; } })(),
  deals: [],
};
const deal = (id) => S.deals.find((d) => d.id === id);
const income = (d) => d.payments.filter((p) => !p.hold);
const received = (d) => income(d).filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
const late = (p) => p.status === "due" && p.due < TODAY;
const nextAction = (d) => {
  const overdue = income(d).find(late);
  if (overdue) return { label: `Relancer : ${overdue.kind.toLowerCase()}`, chip: `En retard depuis le ${fr(overdue.due)}`, cls: "t-red" };
  if (d.status === "Perdu") return { label: "Affaire perdue" };
  const opt = { chip: `Option jusqu'au ${fr(d.optionUntil)}`, cls: d.optionUntil < TODAY ? "t-red" : "t-orange" };
  return [{ label: "Répondre à la demande" }, { label: "Planifier la visite" }, { label: "Confirmer l'option", ...opt }, { label: "Relancer le devis", ...opt }, { label: "Préparer l'accueil" }, { label: "Demander un avis" }][d.stage];
};
function log(d, type, t, body) { d.history.unshift({ type, t, body, at: fr(TODAY) + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), by: me().name }); }

/* ---------- Stage changes, bookings, cleaning buffer and free dates ---------- */
const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const addDays = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
// Everything that holds dates: deals from the Option stage on, and the imported calendars.
function bookings(exceptId) {
  return [...live().filter((d) => d.stage >= 2 && d.start && d.end && d.id !== exceptId).map((d) => ({ title: d.title, start: d.start, end: d.end, cls: hold(d), go: "affaire-" + d.id })), ...S.feeds.map((f, i) => ({ ...f, cls: "ext", ext: i }))];
}
const overlap = (a, b, exceptId) => bookings(exceptId).find((o) => a <= o.end && b >= o.start) ?? null;
// The house needs S.buffer full days of cleaning between a departure and the next arrival. This
// finds the stay that [a, b] would sit too close to, before or after.
function bufferClash(a, b, exceptId) {
  return bookings(exceptId).find((o) => { const after = dayDiff(o.end, a) - 1, before = dayDiff(b, o.start) - 1; return (after >= 0 && after < S.buffer) || (before >= 0 && before < S.buffer); }) ?? null;
}
// One way to change a deal's stage, whichever control asked for it (drag and drop, the cycle,
// the top-bar button), so the same rules apply: no double booking, the cleaning buffer unless it
// is knowingly forced, and a payment schedule as soon as the deal is signed.
function setStage(d, i, force = false) {
  if (i === d.stage) return;
  if (d.status === "Perdu") { S.notice = "Cette affaire est perdue : rouvrez-la avant de changer son étape."; return; }
  const from = d.stage;
  // A request taken down in a hurry may have no dates yet: they are needed before anything is held.
  if (i >= 2 && (!d.start || !d.end)) { S.notice = "Indiquez d'abord les dates du séjour : elles sont nécessaires pour poser une option."; return; }
  if (i >= 2 && d.stage < 2) {
    const taken = overlap(d.start, d.end, d.id);
    if (taken) { S.notice = `Impossible de réserver : ces dates sont déjà prises par « ${taken.title} ».`; return; }
    const close = bufferClash(d.start, d.end, d.id);
    if (close && !force) { S.modal = "buffer"; S.pending = { id: d.id, a: d.start, b: d.end, other: close.title, stage: i }; return; }
    if (close) log(d, "Modification", `Délai de ménage forcé (séjour voisin : ${close.title})`);
  }
  log(d, "Modification", `Étape : ${STAGES[d.stage]} → ${STAGES[i]}`); d.stage = i;
  if (i >= 2 && i <= 3 && from < 2) d.optionUntil = addDays(TODAY, 14);
  if (i < 4 && d.status === "Gagné") d.status = "En cours";
  if (i >= 4) { d.status = "Gagné"; if (d.payments.length === 0) { d.signed = TODAY; d.payments = schedule(d.amount, d.start, TODAY, 0); log(d, "Paiement", "Échéancier créé à la signature"); } }
}
// The coming weekends (Friday to Sunday) that are free AND leave the cleaning days around them.
function freeWeekends(count = 13) {
  const out = []; let t = Date.parse(TODAY);
  while (new Date(t).getUTCDay() !== 5) t += 864e5;
  for (let i = 0; i < count; i++, t += 7 * 864e5) { const a = new Date(t).toISOString().slice(0, 10), b = addDays(a, 2); if (!overlap(a, b) && !bufferClash(a, b)) out.push({ start: a, end: b }); }
  return out;
}
function bufferModal() {
  if (S.modal !== "buffer" || !S.pending) return "";
  const p = S.pending;
  return `<div class="scrim" data-a="buffer-cancel"></div>
    <div class="modal small" role="alertdialog" aria-modal="true" aria-labelledby="m-title">
      <header><h2 id="m-title">Délai de ménage trop court</h2><button class="iconbtn" data-a="buffer-cancel" aria-label="Fermer">${ico("close", "m")}</button></header>
      <div class="mbody"><p>Le séjour du <b>${range(p.a, p.b)}</b> laisse moins de <b>${S.buffer} jours</b> de ménage avec « ${esc(p.other)} ».</p>
        <p class="muted">Le délai minimal se règle dans le calendrier. Vous pouvez passer outre pour cette réservation : ce sera noté dans l'historique.</p></div>
      <footer><button class="btn alt" data-a="buffer-cancel">Annuler</button><button class="btn red" data-a="buffer-force">Forcer la réservation</button></footer>
    </div>`;
}

/* ---------- Shell ---------- */
const isAdmin = () => S.role === "admin";
const me = () => { const u = S.user ?? { name: "", email: "" }, name = u.name || u.email; return { name, email: u.email, role: isAdmin() ? "Admin" : "Équipe", ini: initials(name || "?") }; };
// A lost deal leaves the pipeline, the figures and the calendar, but stays on file.
const live = () => S.deals.filter((d) => d.status !== "Perdu");
const missingDocs = (d) => slotsFor(d).filter((sl) => !d.docs.some((x) => x.slot === sl.key)).length;
// Everything that asks for attention today, each line leading to the place where it is dealt with.
function alerts() {
  const out = [];
  live().forEach((d) => {
    const go = "affaire-" + d.id, who = d.title.includes(d.contact.name) ? d.title : `${d.contact.name} · ${d.title}`;
    income(d).filter(late).forEach((p) => out.push({ icon: "alert", tone: "t-red", t: `${p.kind} en retard : ${eur(p.amount)}`, sub: `${d.title} · échéance du ${fr(p.due)}`, go }));
    if ((d.stage === 2 || d.stage === 3) && dayDiff(TODAY, d.optionUntil) <= 14) out.push({ icon: "clock", tone: "t-orange", t: d.optionUntil < TODAY ? "Option expirée" : `Option à confirmer avant le ${fr(d.optionUntil)}`, sub: d.title, go });
    if (d.unread.mail) out.push({ icon: "mail", tone: "t-blue", t: "E-mail non lu", sub: who, go, comp: "E-mail" });
    if (d.unread.wa) out.push({ icon: "send", tone: "t-green", t: "WhatsApp non lu", sub: who, go, comp: "WhatsApp" });
    d.todos.filter((t) => t.due && t.due <= TODAY).forEach((t) => out.push({ icon: "tasks", tone: "t-orange", t: t.t, sub: `${d.title} · prévu le ${fr(t.due)}`, go }));
    const miss = missingDocs(d), inDays = dayDiff(TODAY, d.start);
    if (d.stage >= 2 && inDays >= 0 && inDays <= 45 && miss) out.push({ icon: "doc", tone: "", t: `${miss} document${miss > 1 ? "s" : ""} manquant${miss > 1 ? "s" : ""} avant l'arrivée`, sub: `${d.title} · arrivée dans ${inDays} jours`, go });
  });
  return out;
}
function rail(active) {
  const item = (hash, icon, label, n = 0) => `<a class="item ${active === hash ? "on" : ""}" href="#${hash}" title="${label}" aria-label="${label}${n ? `, ${n} à traiter` : ""}">${ico(icon)}<span class="lb">${label}</span>${n ? `<i class="badge num">${n}</i>` : ""}</a>`;
  const unread = live().reduce((s, d) => s + (d.unread.mail ? 1 : 0) + (d.unread.wa ? 1 : 0), 0);
  const due = live().flatMap((d) => d.todos).filter((t) => t.due && t.due <= TODAY).length, n = alerts().length, u = me();
  return `<nav class="rail" aria-label="Navigation principale">
    <a class="brand" href="#affaires" title="Accueil" aria-label="Accueil : affaires"><span class="logo">J</span><span class="lb">Les jardins de Campagne</span></a><hr>
    <button class="tile" data-a="search" title="Rechercher (Ctrl K)" aria-label="Rechercher partout">${ico("search", "m")}<span class="lb">Rechercher</span><kbd class="lb">Ctrl K</kbd></button>
    ${item("affaires", "grid", "Affaires")}${item("reservations", "cal", "Réservations")}${item("contacts", "users", "Contacts")}${item("documents", "doc", "Documents")}${item("audit", "shield", "Audit", auditCount())}${item("messages", "mail", "Messages", unread)}${item("taches", "tasks", "Tâches", due)}${item("openspace", "spark", "Open Space", S.props.length)}${item("statistiques", "chart", "Statistiques")}${item("reglages", "gear", "Réglages")}
    <button class="plus" data-a="new" title="Nouvelle affaire" aria-label="Nouvelle affaire">${ico("plus")}<span class="lb">Nouvelle affaire</span></button>
    <div class="spacer"></div>
    <button class="bell ${S.menu === "notif" ? "on" : ""}" data-menu="notif" title="À traiter" aria-label="À traiter${n ? `, ${n} éléments` : ""}" aria-haspopup="dialog" aria-expanded="${S.menu === "notif"}">${ico("bell")}<span class="lb">À traiter</span>${n ? `<i class="badge num">${n}</i>` : ""}</button>
    <button class="me" data-menu="me" title="${u.name}" aria-label="Compte : ${u.name}" aria-haspopup="menu" aria-expanded="${S.menu === "me"}"><span class="av">${u.ini}</span><span class="lb"><b>${esc(u.name)}</b><small>${esc(u.role)}</small></span></button></nav>
    <button class="railtoggle" data-a="rail" title="${S.railOpen ? "Réduire le menu" : "Ouvrir le menu"}" aria-label="${S.railOpen ? "Réduire le menu" : "Ouvrir le menu"}" aria-expanded="${S.railOpen}">${ico(S.railOpen ? "left" : "right", "xs")}</button>`;
}
// The two menus that float next to the rail. The deal menu is drawn by the deal page itself.
function menus() {
  if (S.menu === "notif") { const a = alerts();
    return `<div class="pop notif" role="dialog" aria-label="À traiter"><h3>À traiter <span class="count num">${a.length}</span></h3>${a.map((x) => `<button class="nrow" data-go="${x.go}" ${x.comp ? `data-comp="${x.comp}"` : ""}><span class="nic ${x.tone}">${ico(x.icon, "s")}</span><span class="grow"><b>${esc(x.t)}</b><small>${esc(x.sub)}</small></span></button>`).join("") || `<p class="muted">Rien ne demande votre attention.</p>`}</div>`; }
  if (S.menu === "me") { const u = me();
    return `<div class="pop mepop" role="menu" aria-label="Compte"><div class="ident"><b>${esc(u.name)}</b><small>${esc(u.email)} · ${esc(u.role)}</small></div>
      <div class="eyebrow">Voir l'application comme</div>
      <div class="seg full" role="group" aria-label="Rôle"><button class="${isAdmin() ? "on" : ""}" data-a="role" data-role="admin">Admin</button><button class="${isAdmin() ? "" : "on"}" data-a="role" data-role="team">Équipe</button></div>
      <button class="mi" role="menuitem" data-go="reglages">${ico("gear", "s")}Réglages</button><button class="mi" role="menuitem" data-a="logout">${ico("back", "s")}Se déconnecter</button></div>`; }
  return "";
}
function confirmModal() {
  if (S.modal !== "confirm" || !S.confirm) return "";
  const c = S.confirm;
  return `<div class="scrim top" data-a="close-modal"></div>
    <div class="modal small top" role="alertdialog" aria-modal="true" aria-labelledby="c-title">
      <header><h2 id="c-title">${esc(c.title)}</h2><button class="iconbtn" data-a="close-modal" aria-label="Fermer">${ico("close", "m")}</button></header>
      <div class="mbody"><p>${c.body}</p>${c.more ? `<p class="muted">${c.more}</p>` : ""}</div>
      <footer><button class="btn alt" data-a="close-modal">Annuler</button><button class="btn ${c.link ? "alt" : "red"}" data-a="confirm-yes">${esc(c.cta)}</button>${c.link ? `<a class="btn" href="${esc(c.link.href)}">${esc(c.link.label)}</a>` : ""}</footer>
    </div>`;
}
const topbar = (title, right = "", back = "", sub = "") => `<header class="topbar">
  ${back ? `<a class="back" href="#${back}" aria-label="Retour">${ico("back", "m")}</a>` : ""}
  <div class="grow"><h1>${esc(title)}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div>${right}</header>`;
const banner = "";

/* ---------- Affaires (board + list) ---------- */
// "11 au 13 déc.", the year only when it is not the current one: short enough for a figure card.
const rangeShort = (a, b) => { if (!a || !b) return NO_DATES; const [, ma, da] = a.split("-").map(Number), [yb, mb, db] = b.split("-").map(Number), tail = `${db} ${MONTHS_SHORT[mb - 1]}${yb !== Number(TODAY.slice(0, 4)) ? " " + yb : ""}`; return a === b ? tail : `${da}${ma === mb ? "" : " " + MONTHS_SHORT[ma - 1]} au ${tail}`; };
const SORTS = { title: (d) => d.title.toLowerCase(), kind: (d) => d.kind, start: (d) => d.start, amount: (d) => d.amount, received: (d) => received(d), stage: (d) => d.stage };
function viewAffaires() {
  const q = S.q.toLowerCase(), open = live(), lostDeals = S.deals.filter((d) => d.status === "Perdu");
  const all = (S.tab === "lost" ? lostDeals : open.filter((d) => S.tab === "all" || d.stage >= 4))
    .filter((d) => (S.kind === "Tous les types" || d.kind === S.kind) && (!S.lateOnly || income(d).some(late)) && (d.title + " " + d.contact.name).toLowerCase().includes(q));
  if (S.sort) all.sort((a, b) => { const x = SORTS[S.sort.k](a), y = SORTS[S.sort.k](b); return (x < y ? -1 : x > y ? 1 : 0) * S.sort.dir; });
  const signed = open.filter((d) => d.stage >= 4);
  const lateSum = open.flatMap((d) => income(d).filter(late)).reduce((s, p) => s + p.amount, 0);
  const signedSum = signed.reduce((t, d) => t + d.amount, 0), cashed = open.reduce((t, d) => t + received(d), 0);
  const kpi = (icon, l, v, pill, sub, act = "", tone = "", corner = "") => `<${act ? `button data-a="${act}"` : "div"} class="card kpi ${tone}"><span class="kh"><span class="ic">${ico(icon, "m")}</span><span class="l">${l}</span>${act ? `<span class="kgo">${ico("right", "s")}</span>` : corner}</span><span class="v num">${v}${pill}</span><span class="ks">${sub}</span></${act ? "button" : "div"}>`;
  const paidLines = open.flatMap((d) => income(d).filter((p) => p.status === "paid")), linked = paidLines.filter((p) => p.bank).length;
  const lateCount = open.flatMap((d) => income(d).filter(late)).length;
  const coming = open.filter((d) => d.start > TODAY && d.stage >= 2).sort((a, b) => (a.start < b.start ? -1 : 1));
  const free = freeWeekends(), see = ` <b class="go">Voir ›</b>`;
  const card = (d) => { const n = nextAction(d); return `<a class="deal" href="#affaire-${d.id}" draggable="true" data-id="${d.id}">
      <span class="tags"><span class="mini">${esc(d.source)}</span><span class="mini ${KIND[d.kind]}">${d.kind}</span></span>
      <span class="who">${esc(d.contact.name.split(" ")[0])}</span><span class="name">${esc(d.title)}</span>
      <span class="line num">${ico("euro", "s")}${eur(d.amount)}</span>
      <span class="line num">${ico("cal", "s")}${range(d.start, d.end)}</span>
      <span class="next">${ico("right", "xs")}${esc(n.label)}</span>
      ${n.chip ? `<span class="line"><span class="mini ${n.cls}">${ico("clock", "xs")}${esc(n.chip)}</span></span>` : ""}</a>`; };
  const board = `<div class="board">${STAGES.map((s, i) => { const ds = all.filter((d) => d.stage === i);
    return `<section class="col" data-col="${i}" aria-label="${s}"><h3>${s}<span class="n num">${ds.length}</span></h3>${ds.map(card).join("") || `<span class="none">Aucune affaire</span>`}</section>`; }).join("")}</div>`;
  const th = (k, l) => `<button data-sort="${k}" aria-label="Trier par ${l.toLowerCase()}">${l}${S.sort?.k === k ? (S.sort.dir > 0 ? " ↑" : " ↓") : ""}</button>`;
  const list = `<div class="scrollx"><div class="inner"><div class="thead cols-deals">${th("title", "Affaire")}${th("kind", "Type")}${th("start", "Dates")}${th("amount", "Montant")}${th("received", "Encaissé")}${th("stage", "Étape")}</div>
    ${all.map((d) => `<button class="row cols-deals" data-go="affaire-${d.id}">
      <span class="cell"><small>${esc(d.contact.name)}</small><b>${esc(d.title)}</b></span>
      <span class="cell"><span class="mini ${KIND[d.kind]}">${d.kind}</span></span>
      <span class="cell num"><small>${nights(d.start, d.end)} nuits</small><b>${range(d.start, d.end)}</b></span>
      <span class="cell num"><b>${eur(d.amount)}</b></span>
      ${d.payments.length ? `<span class="cell num"><small>${d.amount ? Math.round(received(d) / d.amount * 100) : 0} %</small><b>${eur(received(d))}</b></span>` : `<span class="cell muted">Pas encore d'échéancier</span>`}
      <span class="cell">${d.status === "Perdu" ? `<small>${esc(d.lostReason || "Raison non précisée")}</small><span class="tag t-red">Perdue</span>` : `<span class="tag ${d.stage >= 4 ? "t-green" : ""}">${STAGES[d.stage]}</span>`}</span></button>`).join("") || `<p class="muted">Aucune affaire ne correspond.</p>`}</div></div>`;
  const tab = (id, label, n) => `<button class="${S.tab === id ? "on" : ""}" data-tab="${id}">${label} <span class="count num">${n}</span></button>`;
  return topbar("Affaires et réservations", `<button class="btn" data-a="new">${ico("doc", "s")}Nouvelle affaire</button>`) + `<div class="content">${banner}
    <div class="tabs" role="tablist">${tab("all", "Toutes les affaires", open.length)}${tab("signed", "Affaires signées", signed.length)}${tab("lost", "Perdues", lostDeals.length)}</div>
    <div class="kpis">${kpi("euro", "Chiffre signé", eur(signedSum), "", `${signed.length} affaire${signed.length > 1 ? "s" : ""} signée${signed.length > 1 ? "s" : ""}`, "kpi-signed")}
      ${kpi("bank", "Encaissé", eur(cashed), "", `<span class="live" aria-hidden="true"></span>Banque : <b class="num">${linked} sur ${paidLines.length}</b> rapprochés`, "", "tone-ok", `<button class="iconbtn ksync" data-a="sync-all" title="Rapprocher avec le relevé importé (${S.lastBank})" aria-label="Rapprocher avec le relevé importé">${ico("sync", "s")}</button>`)}
      ${kpi("alert", "En retard", eur(lateSum), "", lateCount ? `${lateCount} échéance${lateCount > 1 ? "s" : ""} à relancer` : "Aucune échéance dépassée", lateCount ? "kpi-late" : "", lateCount ? "tone-bad" : "")}
      ${kpi("home", coming.length > 1 ? "Séjours à venir" : "Séjour à venir", String(coming.length), "", coming.length ? `Prochain : ${rangeShort(coming[0].start, coming[0].end)}` : "Aucun séjour réservé", coming.length ? "kpi-coming" : "")}
      ${kpi("cal", free.length > 1 ? "Week-ends libres" : "Week-end libre", String(free.length), "", free.length ? `Sur 3 mois · dès le ${rangeShort(free[0].start, free[0].start)}` : "Aucun sur 3 mois", "free")}</div>
    <div class="tray"><div class="tl"><strong class="num">${all.length} affaire${all.length > 1 ? "s" : ""}</strong>
      <input id="q" class="search" type="search" placeholder="Rechercher une affaire ou un contact" value="${esc(S.q)}" aria-label="Rechercher une affaire ou un contact">
      <select id="f-kind" class="${S.kind === "Tous les types" ? "" : "on"}" aria-label="Filtrer par type">${["Tous les types", ...Object.keys(KIND)].map((k) => `<option ${S.kind === k ? "selected" : ""}>${k}</option>`).join("")}</select>
      ${S.lateOnly ? `<button class="chip" data-a="late-off" aria-label="Retirer le filtre : paiement en retard">Paiement en retard ${ico("close", "xs")}</button>` : ""}
      </div><div class="tr">${S.tab === "lost" ? "" : `<div class="seg" role="group" aria-label="Affichage"><button class="${S.view === "list" ? "on" : ""}" data-view="list">${ico("list", "s")}Liste</button><button class="${S.view === "board" ? "on" : ""}" data-view="board">${ico("cols", "s")}Tableau</button></div>`}</div></div>
    ${S.view === "board" && S.tab !== "lost" ? board : list}</div>`;
}

/* ---------- Deal page ---------- */
// Returned by a field's save when the change waits for a confirmation: the editor stays open.
const HOLD_EDIT = Symbol("hold");
const FIELDS = {
  dates: { label: "Dates", show: (d) => (d.start && d.end ? `${range(d.start, d.end)}<small>${nights(d.start, d.end)} nuits, ${HOLD[hold(d)]}</small>` : `${NO_DATES}<small>à renseigner avant de poser une option</small>`),
    edit: (d) => { const p = S.pending?.id === d.id ? S.pending : null; return `<div class="pair"><input id="e-start" type="date" value="${p ? p.a : d.start}" aria-label="Arrivée"><input id="e-end" type="date" value="${p ? p.b : d.end}" aria-label="Départ"></div>`; },
    save: (d) => { const a = val("e-start"), b = val("e-end"); if (!a || !b || b < a) return "Vérifiez les jours d'arrivée et de départ.";
      if (d.stage >= 2) { const taken = overlap(a, b, d.id); if (taken) return `Ces dates sont déjà réservées (${taken.title}).`;
        const close = bufferClash(a, b, d.id); if (close) { S.modal = "buffer"; S.pending = { id: d.id, a, b, other: close.title }; return HOLD_EDIT; } }
      d.start = a; d.end = b; } },
  eventPart: { label: "Part réception", show: (d) => (d.eventPart ? `${eur(d.eventPart)}<small>TVA à 20 %, le reste (hébergement) à 10 %</small>` : ""), edit: (d) => `<input id="e-eventpart" type="number" min="0" step="50" value="${d.eventPart ?? 0}" aria-label="Part du loyer pour la réception, en euros">`,
    save: (d) => { const n = Number(val("e-eventpart")); if (!(n >= 0) || n > d.amount) return "La part réception ne peut pas dépasser le montant de l'affaire."; d.eventPart = n; } },
  lang: { label: "Langue", show: (d) => LANGS[d.lang] ?? LANGS.fr, edit: (d) => `<select id="e-lang" aria-label="Langue des documents">${Object.entries(LANGS).map(([k, l]) => `<option value="${k}" ${k === (d.lang ?? "fr") ? "selected" : ""}>${l}</option>`).join("")}</select>`, save: (d) => { d.lang = LANGS[val("e-lang")] ? val("e-lang") : "fr"; } },
  kind: { label: "Type", show: (d) => d.kind, edit: (d) => `<select id="e-kind" aria-label="Type">${Object.keys(KIND).map((k) => `<option ${k === d.kind ? "selected" : ""}>${k}</option>`).join("")}</select>`, save: (d) => { d.kind = val("e-kind"); } },
  arrival: { label: "Arrivée", show: (d) => d.arrival, edit: (d) => `<input id="e-arrival" type="time" value="${d.arrival}" aria-label="Heure d'arrivée">`, save: (d) => { if (!val("e-arrival")) return "Indiquez une heure."; d.arrival = val("e-arrival"); } },
  departure: { label: "Départ", show: (d) => d.departure, edit: (d) => `<input id="e-departure" type="time" value="${d.departure}" aria-label="Heure de départ">`, save: (d) => { if (!val("e-departure")) return "Indiquez une heure."; d.departure = val("e-departure"); } },
  guests: { label: "Invités", show: (d) => d.guests, edit: (d) => `<input id="e-guests" type="number" min="1" value="${d.guests}" aria-label="Invités">`, save: (d) => { const n = Number(val("e-guests")); if (!Number.isInteger(n) || n < 1) return "Entrez un nombre entier."; d.guests = n; } },
  sleeping: { label: "Couchages", show: (d) => d.sleeping, edit: (d) => `<input id="e-sleeping" type="number" min="1" max="22" value="${d.sleeping}" aria-label="Couchages">`, save: (d) => { const n = Number(val("e-sleeping")); if (!Number.isInteger(n) || n < 1) return "Entrez un nombre entier."; if (n > 22) return "Le domaine couche 22 personnes au maximum."; d.sleeping = n; } },
  tenants: { label: "Locataires", show: (d) => d.tenants.filter(Boolean).map(esc).join("<br>") || "", edit: (d) => `<div class="stack"><input id="e-t1" value="${esc(d.tenants[0])}" placeholder="Locataire 1" aria-label="Locataire 1"><input id="e-t2" value="${esc(d.tenants[1])}" placeholder="Locataire 2" aria-label="Locataire 2"></div>`, save: (d) => { if (val("e-t1").trim().length < 2) return "Le premier locataire est obligatoire."; d.tenants = [val("e-t1").trim(), val("e-t2").trim()]; } },
  amount: { label: "Montant", show: (d) => `<b class="num">${eur(d.amount)}</b>`, edit: (d) => `<input id="e-amount" type="number" min="0" step="50" value="${d.amount}" aria-label="Montant">`, save: (d) => { const n = Number(val("e-amount")); if (!(n >= 0)) return "Entrez un montant."; d.amount = n; } },
  title: { label: "Affaire", show: (d) => esc(d.title), edit: (d) => `<input id="e-title" value="${esc(d.title)}" aria-label="Nom de l'affaire">`, save: (d) => { if (val("e-title").trim().length < 2) return "Donnez un nom à l'affaire."; d.title = val("e-title").trim(); } },
  source: { label: "Source", show: (d) => esc(d.source), edit: (d) => `<select id="e-source" aria-label="Source">${SOURCES.map((k) => `<option ${k === d.source ? "selected" : ""}>${k}</option>`).join("")}</select>`, save: (d) => { d.source = val("e-source"); } },
  option: { label: "Option", show: (d) => `jusqu'au ${fr(d.optionUntil)}<small>${d.optionUntil < TODAY ? "expirée" : dayDiff(TODAY, d.optionUntil) + " jours restants"}</small>`, edit: (d) => `<input id="e-option" type="date" value="${d.optionUntil}" aria-label="Fin de l'option">`, save: (d) => { if (!val("e-option")) return "Indiquez une date."; d.optionUntil = val("e-option"); } },
  name: { label: "Nom", show: (d) => esc(d.contact.name), edit: (d) => `<input id="e-name" value="${esc(d.contact.name)}" aria-label="Nom">`, save: (d) => { d.contact.name = val("e-name").trim() || d.contact.name; } },
  email: { label: "E-mail", show: (d) => esc(d.contact.email), edit: (d) => `<input id="e-email" type="email" value="${esc(d.contact.email)}" aria-label="E-mail">`, save: (d) => { if (!/^\S+@\S+\.\S+$/.test(val("e-email"))) return "Adresse e-mail invalide."; d.contact.email = val("e-email"); } },
  phone: { label: "Téléphone", show: (d) => esc(d.contact.phone), edit: (d) => `<input id="e-phone" value="${esc(d.contact.phone)}" aria-label="Téléphone">`, save: (d) => { d.contact.phone = val("e-phone").trim(); } },
  address: { label: "Adresse", show: (d) => esc(d.contact.address), edit: (d) => `<input id="e-address" value="${esc(d.contact.address)}" aria-label="Adresse">`, save: (d) => { d.contact.address = val("e-address").trim(); } },
};
const val = (id) => document.getElementById(id)?.value ?? "";
function field(d, key) {
  const f = FIELDS[key];
  if (S.edit?.key === key) return `<div class="f"><span class="k">${f.label}</span><div class="v">${f.edit(d)}${S.edit.err ? `<div class="err" role="alert">${esc(S.edit.err)}</div>` : ""}
    <div class="editfoot"><button class="btn alt sm" data-a="cancel">Annuler</button><button class="btn green sm" data-a="save" data-key="${key}">Enregistrer</button></div></div></div>`;
  const shown = f.show(d);
  return `<div class="f"><span class="k">${f.label}</span><div class="v"><button class="val" data-edit="${key}" aria-label="Modifier ${f.label}"><span>${shown === "" ? `<span class="empty">Ajouter</span>` : shown}</span>${ico("pen", "s pen")}</button></div></div>`;
}
function section(id, title, body, tools = "") {
  return `<section class="sec ${S.closed[id] ? "closed" : ""}"><header><button class="chev" data-toggle="${id}" aria-label="Replier ${title}" aria-expanded="${!S.closed[id]}">${ico("chev", "m")}</button><h3>${title}</h3>${tools}</header><div class="body">${body}</div></section>`;
}
function finance(d) {
  const exp = income(d).reduce((s, p) => s + p.amount, 0), rec = received(d), pct = exp ? Math.round(rec / exp * 100) : 0;
  const ST = { paid: ["check", "var(--green)", "#fff"], late: ["alert", "var(--red-tint)", "var(--red)"], due: ["clock", "var(--tray)", "var(--ink-3)"], held: ["shield", "var(--tray)", "var(--ink-3)"], released: ["shield", "var(--green-tint)", "var(--green)"] };
  const line = (p) => { const st = late(p) ? "late" : p.status; const [ic, bg, fg] = ST[st];
    const when = { paid: p.paidOn ? `Reçu le ${fr(p.paidOn)}` : "Reçu, date non retrouvée", late: `En retard depuis le ${fr(p.due)}`, due: `À recevoir le ${fr(p.due)}`, held: `Retenue, prévue le ${fr(p.due)}`, released: `Restituée le ${fr(p.paidOn ?? p.due)}` }[st];
    const settled = p.status === "paid" || p.status === "released", mode = S.payEdit?.id === p.id ? S.payEdit.mode : "", at = `data-id="${p.id}"`;
    let acts = `<button class="link" data-pay="${settled ? "undo" : "settle"}" ${at}>${settled ? (p.hold ? "Remettre en retenue" : "Marquer comme non reçu") : (p.hold ? "Marquer comme restituée" : "Marquer comme reçu")}</button>${settled ? "" : `<button class="link" data-pay="edit" ${at}>Modifier</button>`}${p.id === "dep" || p.id === "bal" ? `<button class="link" data-a="invoice" data-slot="${p.id === "dep" ? "acompte" : "solde"}">Facture</button>` : ""}`;
    if (mode === "settle") acts = `<input id="pay-day" class="inp sm" type="date" value="${TODAY}" aria-label="Date"><button class="btn green sm" data-pay="confirm-settle" ${at}>Enregistrer</button><button class="btn alt sm" data-pay="cancel">Annuler</button>`;
    if (mode === "undo") acts = `<button class="btn red sm" data-pay="confirm-undo" ${at}>Confirmer</button><button class="btn alt sm" data-pay="cancel">Annuler</button>`;
    if (mode === "edit") acts = `<div class="payform"><input id="pay-amt" class="inp sm" type="number" min="0" step="50" value="${p.amount}" aria-label="Montant en euros"><input id="pay-due" class="inp sm" type="date" value="${p.due ?? ""}" aria-label="Échéance"></div><button class="btn green sm" data-pay="confirm-edit" ${at}>Enregistrer</button><button class="btn alt sm" data-pay="cancel">Annuler</button><button class="link danger" data-pay="del" ${at}>Supprimer la ligne</button>`;
    if (mode === "del") acts = `<span class="muted">Supprimer cette ligne ?</span><button class="btn red sm" data-pay="confirm-del" ${at}>Supprimer</button><button class="btn alt sm" data-pay="cancel">Annuler</button>`;
    return `<div class="pay"><span class="st" style="background:${bg};color:${fg}">${ico(ic, "xs")}</span><div class="body">
      <div class="top"><span>${esc(p.kind)}${p.how ? ` · ${esc(p.how)}` : ""}</span><span class="num">${eur2(p.amount)}</span></div>
      <div class="when ${st === "late" ? "late" : ""}">${when}${p.got != null && p.got !== p.amount ? ` · ${eur2(p.got)} reçus` : ""}</div>${p.note ? `<div class="when">${esc(p.note)}</div>` : ""}
      ${!p.hold && p.status === "paid" ? `<div class="bank ${p.bank ? "yes" : "no"}">${ico("bank", "xs")}<span>${p.bank ? "Banque : " + esc(p.bank) : "Pas encore rapproché du relevé bancaire"}</span></div>` : ""}
      <div class="acts">${acts}</div></div></div>`; };
  if (d.payments.length === 0) return `<span class="muted">L'échéancier (acompte de ${TERMS.deposit} %, solde, caution) est créé à la signature.</span>`;
  // The lines must add up to the deal's amount: say so when they no longer do.
  const warn = exp !== d.amount ? `<div class="finwarn">${ico("alert", "s")}<span>L'échéancier (${eur(exp)}) ne correspond plus au montant de l'affaire (${eur(d.amount)}).</span><button class="link" data-a="resched">Ajuster</button></div>` : "";
  const add = S.payEdit?.mode === "add"
    ? `<div class="pay"><span class="st" style="background:var(--tray);color:var(--ink-3)">${ico("euro", "xs")}</span><div class="body"><div class="acts"><div class="payform"><input id="pay-kind" class="inp sm" value="Complément" aria-label="Libellé de la ligne"><input id="pay-amt" class="inp sm" type="number" min="0" step="50" placeholder="Montant" aria-label="Montant en euros"><input id="pay-due" class="inp sm" type="date" value="${TODAY}" aria-label="Échéance"></div><button class="btn green sm" data-pay="confirm-add">Ajouter</button><button class="btn alt sm" data-pay="cancel">Annuler</button></div></div></div>`
    : `<div class="finadd"><button class="link" data-pay="add">+ Ajouter une ligne</button></div>`;
  return `<div class="fin-top"><b class="num">${eur(rec)}</b><span class="num">reçus sur ${eur(exp)} (${pct} %)</span></div>
    <div class="bar ${pct === 100 ? "full" : ""}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Part encaissée"><i style="width:${pct}%"></i></div>
    <div class="finmsg" aria-live="polite">${esc(S.sync)}</div>${warn}
    ${d.payments.map(line).join("")}${add}`;
}
/* ---------- Quote builder and event sheet (composer tabs) ---------- */
const quoteOf = (d) => d.quote ?? [{ l: `Location du domaine, ${nights(d.start, d.end)} nuits`, q: 1, p: Math.max(0, d.amount - 450) }, { l: "Ménage de fin de séjour", q: 1, p: 300 }, { l: "Linge de maison", q: 1, p: 150 }];
const quoteTotal = (q) => q.reduce((s, r) => s + (Number(r.q) || 0) * (Number(r.p) || 0), 0);
function eventTab(d) {
  const beds = d.rooms.reduce((s, r) => s + (Number(r.beds) || 0), 0), v = (k) => esc(S.draft[k] ?? "");
  const info = (d.sheet ?? []).length || d.eventDay ? `<h4>Fiche d'information</h4>${d.eventDay ? `<div class="er"><span class="grow"><b>Jour de l'événement</b><small>${longDay(d.eventDay)}</small></span></div>` : ""}${(d.sheet ?? []).map((x) => `<div class="er"><span class="grow"><b>${esc(x.k)}</b><small>${esc(x.v)}</small></span></div>`).join("")}` : "";
  return `<div class="evt">${info}<h4>Prestataires <span class="count num">${d.providers.length}</span></h4>
    ${d.providers.map((p, i) => `<div class="er"><span class="grow"><b>${esc(p.name)}</b><small>${esc(p.role)}${p.phone ? " · " + esc(p.phone) : ""}</small></span><span class="mini num">${p.at ? "Arrivée " + esc(p.at) : "Heure à préciser"}</span><button class="iconbtn" data-pvdel="${i}" aria-label="Retirer ${esc(p.name)}">${ico("close", "s")}</button></div>`).join("") || `<span class="hint">Aucun prestataire pour l'instant.</span>`}
    <div class="eform"><input id="pv-name" class="inp" placeholder="Nom" value="${v("pv-name")}" aria-label="Nom du prestataire"><input id="pv-role" class="inp" placeholder="Rôle (traiteur, musique)" value="${v("pv-role")}" aria-label="Rôle du prestataire"><input id="pv-phone" class="inp" placeholder="Téléphone" value="${v("pv-phone")}" aria-label="Téléphone du prestataire"><input id="pv-at" class="inp" type="time" value="${v("pv-at")}" aria-label="Heure d'arrivée du prestataire"><button class="btn alt sm" data-a="pv-add">Ajouter</button></div>
    <h4>Hébergements <span class="mini num ${beds > d.sleeping ? "t-red" : beds === d.sleeping ? "t-green" : ""}">${beds} couchages attribués sur ${d.sleeping}</span></h4>
    ${d.rooms.map((r, i) => `<div class="er"><span class="grow"><b>${esc(r.name)}</b><small>${esc(r.note || "Sans remarque")}</small></span><span class="mini num">${r.beds} couchages</span><button class="iconbtn" data-rmdel="${i}" aria-label="Retirer ${esc(r.name)}">${ico("close", "s")}</button></div>`).join("") || `<span class="hint">Aucun hébergement attribué pour l'instant.</span>`}
    <div class="eform rooms"><input id="rm-name" class="inp" placeholder="Bâtiment ou chambre" value="${v("rm-name")}" aria-label="Nom de l'hébergement"><input id="rm-beds" class="inp" type="number" min="1" placeholder="Couchages" value="${v("rm-beds")}" aria-label="Nombre de couchages"><input id="rm-note" class="inp" placeholder="Remarque (qui y dort, lit bébé)" value="${v("rm-note")}" aria-label="Remarque"><button class="btn alt sm" data-a="rm-add">Ajouter</button></div></div>
    <div class="cfoot"><span class="hint">La fiche reprend le séjour, les prestataires, les hébergements et le règlement du lieu.</span><button class="btn sm" data-a="sheet">Aperçu de la fiche événement</button></div>`;
}
// The one-page sheet handed to the people on site.
function sheetBody(d) {
  const beds = d.rooms.reduce((s, r) => s + (Number(r.beds) || 0), 0);
  return `<h1>${esc(d.title)}</h1><p class="c">Fiche événement</p>
    <table><tr><td>Séjour</td><td>${range(d.start, d.end)}, ${nights(d.start, d.end)} nuits</td></tr><tr><td>Arrivée</td><td>${d.arrival}</td></tr><tr><td>Départ</td><td>${d.departure}</td></tr>
    <tr><td>Invités</td><td>${d.guests}, dont ${d.sleeping} hébergés sur place</td></tr><tr><td>Contact</td><td>${esc(d.contact.name)} · ${esc(d.contact.phone)}</td></tr></table>
    ${(d.sheet ?? []).length ? `<h2>Fiche d'information</h2><table>${d.eventDay ? `<tr><td>Jour de l'événement</td><td>${longDay(d.eventDay)}</td></tr>` : ""}${d.sheet.map((x) => `<tr><td>${esc(x.k)}</td><td>${esc(x.v)}</td></tr>`).join("")}</table>` : ""}
    <h2>Prestataires</h2>${d.providers.length ? `<table><tr><th>Nom</th><th>Rôle</th><th>Téléphone</th><th class="r">Arrivée</th></tr>${d.providers.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.role)}</td><td>${esc(p.phone)}</td><td class="r">${esc(p.at || "à préciser")}</td></tr>`).join("")}</table>` : `<p>Aucun prestataire renseigné.</p>`}
    <h2>Hébergements</h2>${d.rooms.length ? `<table><tr><th>Lieu</th><th>Remarque</th><th class="r">Couchages</th></tr>${d.rooms.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.note)}</td><td class="r">${r.beds}</td></tr>`).join("")}<tr><td><b>Total</b></td><td></td><td class="r"><b>${beds} sur ${d.sleeping}</b></td></tr></table>` : `<p>Aucun hébergement attribué.</p>`}
    <h2>Règlement du lieu</h2><ul><li>Musique en extérieur jusqu'à 23 h, puis à l'intérieur.</li><li>Piscine sous la surveillance des adultes.</li><li>22 personnes hébergées au maximum.</li><li>Départ au plus tard à ${d.departure}, le ménage commence ensuite.</li></ul>`;
}
// Reopening a lost deal takes its dates back, so they must still be free.
function reopen(d) {
  const taken = d.stage >= 2 ? overlap(d.start, d.end, d.id) : null;
  if (taken) { S.notice = `Impossible de rouvrir : les dates sont prises par « ${taken.title} ». Modifiez d'abord les dates.`; return false; }
  d.status = d.stage >= 4 ? "Gagné" : "En cours"; d.lostReason = ""; log(d, "Modification", "Affaire rouverte"); return true;
}
// What moves a deal from each stage to the next one, said under the progress line.
const STEP_NEXT = ["répondez à la demande et proposez une visite.", "après la visite, posez une option sur les dates.", "envoyez le devis pour confirmer l'option.", "faites signer le contrat, la signature crée l'échéancier.", "encaissez le solde, puis marquez l'affaire comme soldée."];
function viewAffaire(id, peek = false) {
  const d = deal(id); if (!d) return peek ? "" : viewAffaires();
  if (S.composer === "E-mail") d.unread.mail = false;
  if (S.composer === "WhatsApp") d.unread.wa = false;
  const lost = d.status === "Perdu";
  const overdue = income(d).find(late), exp = income(d).reduce((s, p) => s + p.amount, 0), rec = received(d);
  const alert = lost
    ? `<div class="alert lost"><span class="dot">${ico("close", "xs")}</span><div><div class="t">Affaire perdue</div><div class="d">${esc(d.lostReason || "Raison non précisée")}</div></div><button class="btn alt sm push" data-a="reopen">Rouvrir</button></div>`
    : d.payments.length === 0
    ? `<div class="alert info"><span class="dot">i</span><div><div class="t">${esc(nextAction(d).label)}</div><div class="d">L'échéancier sera créé à la signature</div></div><span class="amt num">${eur(d.amount)}</span></div>`
    : overdue
    ? `<div class="alert"><span class="dot">!</span><div><div class="t">${esc(overdue.kind)} en retard</div><div class="d">Échéance du ${fr(overdue.due)}</div></div><span class="amt num">${eur(overdue.amount)}</span><button class="btn alt sm" data-a="remind">Relancer</button></div>`
    : rec >= exp && exp > 0 ? `<div class="alert ok"><span class="dot">${ico("check", "xs")}</span><div><div class="t">Séjour entièrement réglé</div><div class="d">Dernier encaissement rapproché ou saisi</div></div><span class="amt num">${eur(rec)}</span></div>`
    : `<div class="alert"><span class="dot">i</span><div><div class="t">Reste à encaisser</div><div class="d">Prochaine échéance : ${fr((income(d).find((p) => p.status === "due") ?? { due: d.start }).due)}</div></div><span class="amt num">${eur(exp - rec)}</span></div>`;
  const types = ["Toutes", "Note", "E-mail", "WhatsApp", "Paiement", "Document", "Modification"];
  const TLBL = { Toutes: "Toutes", Note: "Notes", "E-mail": "E-mails", WhatsApp: "WhatsApp", Paiement: "Paiements", Document: "Documents", Modification: "Modifications" };
  const counts = Object.fromEntries(types.map((t) => [t, t === "Toutes" ? d.history.length : d.history.filter((h) => h.type === t).length]));
  const hist = d.history.filter((h) => S.histTab === "Toutes" || h.type === S.histTab);
  const ev = (h) => `<article class="ev"><span class="mk done">${ico("check", "xs")}</span><div class="tx"><div class="tt">${esc(h.t)}</div>${h.body ? `<div class="plain">${esc(h.body)}</div>` : ""}<div class="meta">${esc(h.at)} · ${h.type} · Par ${esc(h.by)}</div></div></article>`;
  const comp = S.composer, dv = (k, dflt = "") => S.draft[k] ?? dflt;
  const composer = `<div class="composer"><div class="ctabs">${["Notes", "Activité", "E-mail", "WhatsApp", "Devis", "Événement"].map((t) => `<button class="${comp === t ? "on" : ""}" data-comp="${t}">${t === "WhatsApp" ? `<i class="wdot"></i>` : ""}${t}</button>`).join("")}</div>
    <div class="cbody">${comp === "Notes" ? `<textarea id="note" placeholder="Cliquez ici pour ajouter une note" aria-label="Nouvelle note">${esc(dv("note"))}</textarea><div class="cfoot"><label class="hint"><input id="note-pin" type="checkbox"> Épingler</label><button class="btn sm" data-a="note">Ajouter la note</button></div>`
      : comp === "Activité" ? `<input id="todo" class="inp" value="${esc(dv("todo"))}" placeholder="Que faut-il faire ? (rappel, appel, visite)" aria-label="Nouvelle activité"><div class="cfoot"><select id="act-type" class="inp auto" aria-label="Type d'activité">${TASK_TYPES.map((o) => `<option ${dv("act-type", "Rappel") === o ? "selected" : ""}>${o}</option>`).join("")}</select><input id="act-due" class="inp auto" type="date" value="${dv("act-due", addDays(TODAY, 2))}" aria-label="Échéance"><button class="btn sm" data-a="todo">Ajouter à faire</button></div>`
      : comp === "E-mail" ? mailTab(d) : comp === "WhatsApp" ? waTab(d) : comp === "Devis" ? quoteTab(d) : eventTab(d)}</div></div>`;
  const menu = S.menu === "deal" ? `<div class="pop dealpop" role="menu" aria-label="Autres actions"><button class="mi" role="menuitem" data-a="sheet">${ico("doc", "s")}Fiche événement</button><button class="mi" role="menuitem" data-a="deal-dup">${ico("copy", "s")}Dupliquer l'affaire</button>${lost ? "" : `<button class="mi" role="menuitem" data-a="lose">${ico("close", "s")}Marquer comme perdue</button>`}${isAdmin() ? `<button class="mi danger" role="menuitem" data-a="deal-del">${ico("trash", "s")}Supprimer l'affaire</button>` : ""}</div>` : "";
  return topbar(peek ? "Fiche de l'affaire" : "Détail d'une affaire", (peek ? `<a class="btn alt" href="#affaire-${d.id}" data-go="affaire-${d.id}">Ouvrir en pleine page</a>` : "") + `<span class="menuwrap"><button class="btn alt sq" data-menu="deal" aria-label="Autres actions" aria-haspopup="menu" aria-expanded="${S.menu === "deal"}">${ico("dots", "m")}</button>${menu}</span><button class="btn alt" data-a="doc">${ico("doc", "s")}Ajouter un document</button>${!lost && d.stage < 5 ? `<button class="btn" data-a="advance">${d.stage < 4 ? "Passer à l'étape suivante" : "Marquer comme soldé"}</button>` : ""}` + (peek ? `<button class="iconbtn" data-a="peek-close" aria-label="Fermer la fiche">${ico("close", "m")}</button>` : ""), peek ? "" : "affaires")
    + `<div class="dealhead"><div class="id"><h2><span class="ic">${ico(KIND_ICON[d.kind], "m")}</span>${esc(d.title)}</h2>
        <div class="tags">${lost ? `<span class="tag t-red">Perdue</span>` : ""}<span class="tag"><i class="dotk ${KIND[d.kind]}"></i>${d.kind}</span><span class="tag num">${range(d.start, d.end)}</span><span class="tag num">${d.guests ? d.guests + " invités" : "Invités à préciser"}</span><span class="tag">Source : ${esc(d.source)}</span></div></div>${alert}
        <div class="steps" role="group" aria-label="Cycle de l'affaire">${STAGES.map((s, i) => `<button class="step ${i < d.stage ? "done" : i === d.stage ? "cur" : ""}" data-stage="${i}" ${i === d.stage ? `aria-current="step"` : `title="${i < d.stage ? "Revenir à" : "Passer à"} l'étape ${s}"`}><i>${i < d.stage ? ico("check", "xs") : ""}</i><span>${s}</span>${i === d.stage ? `<small>Étape actuelle</small>` : ""}</button>`).join("")}</div>
        ${lost || d.stage >= 5 ? "" : `<p class="stepnote"><b>Pour passer à « ${STAGES[d.stage + 1]} » :</b> ${STEP_NEXT[d.stage]} <span>Cliquez sur une étape pour y aller directement.</span></p>`}</div>
      <div class="split"><aside class="panel">
        ${section("resume", "Résumé", `<div class="f"><span class="k">Statut</span><div class="v"><span class="status"><select id="e-status" data-status aria-label="Statut">${["En cours", "Gagné", "Perdu"].map((s) => `<option ${s === d.status ? "selected" : ""}>${s}</option>`).join("")}</select></span></div></div>
          ${field(d, "title")}${field(d, "amount")}${field(d, "eventPart")}
          <div class="f"><span class="k">Échéance</span><div class="v">${d.payments.length === 0 ? `<span class="due none">À la signature</span>` : overdue ? `<span class="due num">${fr(overdue.due)} ${ico("alert", "s")}</span>` : `<span class="due ok num">${rec >= exp ? "Tout est réglé" : fr((income(d).find((p) => p.status === "due") ?? { due: d.start }).due)}</span>`}</div></div>
          ${field(d, "source")}`)}
        ${section("sejour", "Séjour", ["dates", ...(d.stage === 2 || d.stage === 3 ? ["option"] : []), "kind", "lang", "arrival", "departure", "guests", "sleeping", "tenants"].map((k) => field(d, k)).join(""))}
        ${section("finance", "Finance", finance(d), d.payments.length ? `<button class="btn alt sm" data-a="sync">${ico("sync", "s")}Synchroniser</button>` : "")}
        ${section("contact", "Informations personnelles", ["name", "email", "phone", "address"].map((k) => field(d, k)).join("") + `<button class="link" data-go="contact-${d.id}">Voir la fiche contact ›</button>`)}
      </aside>
      <div class="feed">
        ${composer}
        <section class="blk"><h3 class="h flex">Documents <span class="count num">${slotsFor(d).length - missingDocs(d)} sur ${slotsFor(d).length}</span>${d.driveFolder ? `<a class="link drivelink" href="https://drive.google.com/drive/folders/${encodeURIComponent(d.driveFolder)}" target="_blank" rel="noopener">Dossier Drive · ${d.drivePlace === "clients" ? "Clients" : "Prospects"}</a>` : d.folderUrl ? `<a class="link drivelink" href="${esc(d.folderUrl)}" target="_blank" rel="noopener">Dossier Drive</a>` : ""}<button class="link" data-a="doc">+ Ajouter</button></h3><div class="docs">${dealDocs(d)}</div>${stageDocNote(d) ? `<p class="docnote">${stageDocNote(d)}</p>` : ""}</section>
        ${auditBlock(d)}${mailsBlock(d)}
        ${d.pinned.length ? `<section class="blk"><h3 class="h">Épinglées</h3><div class="list">${d.pinned.map((p, i) => `<article class="ev"><span class="mk">${ico("pin", "s")}</span><div class="tx"><div class="tt">${esc(p.t)}</div><div class="meta">${esc(p.at)} · Par ${esc(p.by)}</div><div class="note">${esc(p.body)}</div><div class="pinacts"><button class="link" data-unpin="${i}">Désépingler</button><button class="link danger" data-a="pin-del" data-i="${i}">Supprimer</button></div></div></article>`).join("")}</div></section>` : ""}
        <section class="blk"><h3 class="h">À faire</h3>
        <div class="list">${d.todos.length ? d.todos.map((t) => { const lt = t.due && t.due < TODAY; return `<article class="ev"><button class="mk todo" data-done="${t.id}" aria-label="Marquer comme fait : ${esc(t.t)}"></button><div class="tx"><div class="tt">${esc(t.t)}</div><div class="meta">${esc(t.type ?? "Rappel")}${t.due ? ` · <span class="${lt ? "latetx" : ""}">${lt ? "en retard depuis le" : "pour le"} ${fr(t.due)}</span>` : ""} · Par ${esc(t.by)}</div></div>${t.cta ? `<button class="btn out" data-a="remind">${esc(t.cta)}</button>` : ""}</article>`; }).join("") : `<span class="muted">Rien ne demande votre attention.</span>`}</div></section>
        <section class="blk"><h3 class="h">Historique</h3>
        <div class="tabs">${types.map((t) => `<button class="${S.histTab === t ? "on" : ""}" data-hist="${t}">${TLBL[t]}${counts[t] ? ` <span class="count num">${counts[t]}</span>` : ""}</button>`).join("")}</div>
        <div class="list">${hist.map(ev).join("") || `<span class="muted">Aucun élément.</span>`}</div></section>
      </div></div>`;
}

/* ---------- Réservations (calendar) ---------- */
function calItems() {
  return [...bookings().map((b) => ({ ...b, label: b.title })), ];
}
// Two letters for the round badge of a stay: first and last meaningful word of its name.
const ini2 = (t) => { const w = t.split(/[\s,]+/).filter((x) => x && !["&", "et", "de", "des", "du", "la", "le"].includes(x.toLowerCase())); return ((w[0] ? w[0][0] : "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); };
// One month as rows of weeks. Each day is a tile; each stay is one continuous pill laid over the
// tiles, from the middle of its arrival day to the middle of its departure day, so a departure
// and the next arrival never look like the same day. `mini` is the small version of the year view.
function monthGrid(ym, mini = false) {
  const [y, m] = ym.split("-").map(Number), days = new Date(Date.UTC(y, m, 0)).getUTCDate(), off = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const iso = (n) => `${ym}-${String(n).padStart(2, "0")}`, all = calItems(), items = all.filter((b) => b.end >= iso(1) && b.start <= iso(days)), cleaning = new Set();
  all.forEach((b) => { for (let k = 1; k <= S.buffer; k++) cleaning.add(addDays(b.end, k)); });
  const busy = (d) => all.some((b) => d >= b.start && d <= b.end), col = (d) => (off + Number(d.slice(8)) - 1) % 7;
  let out = "";
  for (let w = 0; w * 7 < off + days; w++) {
    const a = iso(Math.max(1, w * 7 - off + 1)), b = iso(Math.min(days, w * 7 - off + 7)), lanes = [];
    // 14 half-day columns per week: a stay that really starts or ends this week does so mid-tile.
    const bars = items.filter((it) => it.end >= a && it.start <= b).sort((p, q) => (p.start < q.start ? -1 : 1)).map((it) => {
      const sH = it.start >= a, eH = it.end <= b, c1 = col(sH ? it.start : a) * 2 + (sH ? 2 : 1), c2 = col(eH ? it.end : b) * 2 + (eH ? 2 : 3);
      let lane = lanes.findIndex((end) => end <= c1); if (lane < 0) { lane = lanes.length; lanes.push(0); } lanes[lane] = c2;
      const attr = it.go ? `data-go="${it.go}"` : it.real !== undefined ? `data-real="${it.real}"` : `data-ext="${it.ext}"`;
      return `<button class="bk ${it.cls} ${sH ? "start" : ""} ${eH ? "end" : ""}" style="grid-column:${c1}/${c2};grid-row:${lane + 1}" ${attr} title="${esc(it.label)}, ${range(it.start, it.end)}">${sH && !mini ? `<i class="bav">${esc(ini2(it.title))}</i>` : ""}<span>${esc(mini ? it.title : it.label)}</span></button>`; }).join("");
    let cells = "";
    for (let c = 0; c < 7; c++) { const n = w * 7 + c - off + 1; if (n < 1 || n > days) { cells += `<span class="void"></span>`; continue; }
      const d = iso(n), on = busy(d), clean = !on && cleaning.has(d), past = d < TODAY, isFree = !on && !clean && !past && S.showFree;
      cells += `<div class="day ${d === TODAY ? "today" : ""} ${clean ? "clean" : ""} ${past ? "past" : ""} ${isFree ? "free" : ""}"><span class="d num">${n}</span>${mini ? "" : `${clean ? `<span class="cl">Ménage</span>` : ""}${isFree ? `<span class="fr">Libre</span>` : ""}${!on && !past ? `<button class="addday" data-newday="${d}" title="Nouvelle affaire à partir de ce jour" aria-label="Nouvelle affaire à partir du ${longDay(d)}">+</button>` : ""}`}</div>`; }
    out += `<div class="cw" style="--lanes:${Math.max(1, lanes.length)}"><div class="cts">${cells}</div><div class="cbars">${bars}</div></div>`;
  }
  return `<div class="cmonth ${mini ? "ymini" : ""}">${out}</div>`;
}
const freeBtn = () => `<button class="btn alt ${S.showFree ? "on" : ""}" data-a="toggle-free" aria-pressed="${S.showFree}">${ico("check", "s")}Dates libres</button>`;
function viewReservations() {
  if (S.calView === "season") return viewSeason();
  if (S.calView === "year") return viewYear();
  const [y, m] = S.month.split("-").map(Number), days = new Date(Date.UTC(y, m, 0)).getUTCDate(), booked = new Set();
  calItems().forEach((b) => { for (let t = b.start; t <= b.end; t = addDays(t, 1)) if (t.startsWith(S.month)) booked.add(t); });
  const rate = Math.round(booked.size / days * 100), sw = (k, label) => `<span class="sleg1"><i class="swatch ${k}"></i>${label}</span>`;
  return topbar("Calendrier des réservations", calSeg() + `<button class="btn" data-a="new">${ico("cal", "s")}Nouvelle réservation</button>`) + `<div class="cal calx"><aside class="side">
      ${section("taux", "Taux de remplissage", `<div class="fin-top"><span>${MONTHS[m - 1][0].toUpperCase() + MONTHS[m - 1].slice(1)} ${y}</span><b class="num">${rate} %</b></div><div class="bar"><i style="width:${rate}%"></i></div><span class="muted num">${booked.size} jours réservés sur ${days}</span>`)}
      ${section("legende", "Légende", `<div class="legend">${sw("k-firm", "Réservation ferme")}${sw("k-option", "Option")}${sw("k-ext", "Calendrier importé (Airbnb)")}${sw("hatchsw", "Ménage")}</div><p class="help">Une pastille va du milieu du jour d'arrivée au milieu du jour de départ.</p>`)}
      ${section("menage", "Ménage entre deux séjours", `<div class="stepper"><button data-a="buf-minus" aria-label="Diminuer le délai" ${S.buffer <= 0 ? "disabled" : ""}>−</button><b class="num">${S.buffer} jours</b><button data-a="buf-plus" aria-label="Augmenter le délai" ${S.buffer >= 7 ? "disabled" : ""}>+</button></div><p class="help">Jours pleins à garder entre un départ et l'arrivée suivante. À 0, rien n'est demandé ; au-delà, une réservation plus rapprochée demande une confirmation.</p>`)}
      ${section("libres", "Prochains week-ends libres", `<div class="freelist">${freeWeekends().slice(0, 6).map((w) => `<button class="link" data-jump="${w.start.slice(0, 7)}">${ico("right", "xs")}${range(w.start, w.end)}</button>`).join("") || `<span class="muted">Aucun week-end libre d'ici 3 mois.</span>`}</div>`)}
      ${section("sources", "Calendriers importés", S.sources.map((x) => `<div class="f"><span class="k">${esc(x.kind)}</span><div class="v">${esc(x.name)}<small>${x.last ? "Lu le " + esc(when(x.last)) : "Pas encore lu"}</small></div></div>`).join("") + `<div class="freelist">${isAdmin() ? `<button class="link" data-a="ics-new">+ Ajouter un calendrier</button>` : ""}<button class="link" data-a="sim" data-msg="Dans l'application : un lien iCal est copié. Collé dans Airbnb ou Booking, il y bloque les dates réservées ici.">Exporter mon calendrier (lien iCal)</button></div>`)}
    </aside><div class="content"><div class="monthnav"><button class="iconbtn" data-month="-1" aria-label="Mois précédent">${ico("left", "m")}</button><span class="lbl">${MONTHS[m - 1]} ${y}</span><button class="iconbtn" data-month="1" aria-label="Mois suivant">${ico("right", "m")}</button><button class="btn alt" data-a="today" ${S.month === TODAY.slice(0, 7) ? "disabled" : ""}>Aujourd'hui</button>${freeBtn()}</div>
      <div><div class="cdow">${["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."].map((x) => `<span>${x}</span>`).join("")}</div>${monthGrid(S.month)}</div></div></div>`;
}
function viewYear() {
  const y = S.month.slice(0, 4);
  return topbar("Calendrier des réservations", calSeg() + `<button class="btn" data-a="new">${ico("cal", "s")}Nouvelle réservation</button>`) + `<div class="content calx"><div class="monthnav"><button class="iconbtn" data-year="-1" aria-label="Année précédente">${ico("left", "m")}</button><span class="lbl">${y}</span><button class="iconbtn" data-year="1" aria-label="Année suivante">${ico("right", "m")}</button>${freeBtn()}</div>
    <div class="ygrid">${MONTHS.map((name, i) => { const ym = `${y}-${String(i + 1).padStart(2, "0")}`; return `<section class="ym"><button class="ymt" data-seemonth="${ym}" title="Ouvrir ${name} ${y}">${name}</button><div class="cdow">${"LMMJVSD".split("").map((x) => `<span>${x}</span>`).join("")}</div>${monthGrid(ym, true)}</section>`; }).join("")}</div>
    <p class="docnote">Cliquez sur le nom d'un mois pour l'ouvrir en grand, sur une pastille pour le détail du séjour.</p></div>`;
}

/* ---------- Contacts ---------- */
// One person can hold several deals: contacts are the distinct people behind the deals.
function contacts() {
  const m = new Map();
  S.deals.forEach((d) => { const c = m.get(d.contact) ?? { c: d.contact, deals: [] }; c.deals.push(d); m.set(d.contact, c); });
  return [...m.values()];
}
function viewContacts() {
  const q = S.cq.toLowerCase();
  const all = contacts().filter(({ c, deals }) => deals.some((d) => (S.cKind === "Tous les types" || d.kind === S.cKind) && (S.cSource === "Toutes les sources" || d.source === S.cSource))
    && [c.name, c.email, c.phone, ...deals.map((d) => d.title)].some((v) => v.toLowerCase().includes(q)));
  const sel = (id, label, cur, list) => `<select id="${id}" aria-label="${label}">${list.map((o) => `<option ${cur === o ? "selected" : ""}>${o}</option>`).join("")}</select>`;
  return topbar("Contacts", `<button class="btn" data-a="new">${ico("users", "s")}Nouvelle affaire</button>`) + `<div class="content"><div class="tray"><strong class="num">${all.length} contact${all.length > 1 ? "s" : ""}</strong>
      <input id="cq" class="search" type="search" placeholder="Rechercher un nom, un e-mail, un téléphone" value="${esc(S.cq)}" aria-label="Rechercher un contact">
      ${sel("c-kind", "Filtrer par type", S.cKind, ["Tous les types", ...Object.keys(KIND)])}${sel("c-source", "Filtrer par source", S.cSource, ["Toutes les sources", ...SOURCES])}</div>
    <div class="scrollx"><div class="inner"><div class="thead cols-contacts"><span>Contact</span><span>Coordonnées</span><span>Affaires</span><span>Type</span><span>Total</span></div>
    ${all.map(({ c, deals }) => { const last = deals[0]; return `<button class="row cols-contacts" data-go="contact-${last.id}"><span class="cell"><small>${esc(last.source)}</small><b>${esc(c.name)}</b></span><span class="cell"><small>${esc(c.phone)}</small><b>${esc(c.email)}</b></span><span class="cell"><small>${deals.length > 1 ? `${deals.length} affaires` : STAGES[last.stage]}</small><b>${esc(last.title)}</b></span><span class="cell">${[...new Set(deals.map((d) => d.kind))].map((k) => `<span class="mini ${KIND[k]}">${k}</span>`).join(" ")}</span><span class="cell num"><b>${eur(deals.reduce((s, d) => s + d.amount, 0))}</b></span></button>`; }).join("") || `<p class="muted">Aucun contact ne correspond à ces filtres.</p>`}</div></div></div>`;
}
const convRow = (o, ch, last, unread) => `<button class="row conv" data-go="affaire-${o.id}" data-comp="${ch}"><span class="nic ${ch === "WhatsApp" ? "t-green" : "t-blue"}">${ico(ch === "WhatsApp" ? "send" : "mail", "s")}</span><span class="cell"><small>${ch} · ${esc(o.title)}</small><b>${esc(o.contact.name)}</b></span><span class="cell ex">${last.me ? "Vous : " : ""}${esc(last.text)}</span><span class="cell num right"><small>${esc(last.at)}</small>${unread ? `<span class="mini t-blue">Non lu</span>` : last.me ? `<span class="mini">En attente de réponse</span>` : `<span class="mini t-green">Lu</span>`}</span></button>`;
// The conversations of a deal, one per channel, each summed up by its last message.
function convs(o) {
  const out = [], e = o.emails[o.emails.length - 1], w = o.wa[o.wa.length - 1];
  if (e) out.push({ o, ch: "E-mail", unread: Boolean(o.unread.mail), last: { me: e.from === "me", text: e.subject + " · " + e.body.replace(/\s+/g, " "), at: e.at } });
  if (w) out.push({ o, ch: "WhatsApp", unread: Boolean(o.unread.wa), last: { me: w.from === "me", text: w.body, at: w.at } });
  return out;
}
function viewContact(id) {
  const d = deal(id); if (!d) return viewContacts();
  const c = d.contact, mine = S.deals.filter((o) => o.contact === c), won = mine.filter((o) => o.stage >= 4 && o.status !== "Perdu"), talks = mine.flatMap(convs);
  const docs = mine.flatMap((o) => o.docs.map((x, i) => docCard(x, `${o.id}:${i}`, o.title, kindOf(x))));
  return topbar("Fiche contact", `<button class="btn alt" data-go="affaire-${mine[0].id}" data-comp="E-mail">${ico("mail", "s")}Écrire</button><button class="btn" data-a="new" data-contact="${d.id}">${ico("doc", "s")}Nouvelle affaire</button>`, "contacts")
    + `<div class="dealhead"><div class="id"><h2><span class="ic av">${initials(c.name)}</span>${esc(c.name)}</h2>
        <div class="tags"><span class="tag">Source : ${esc(mine[mine.length - 1].source)}</span><span class="tag num">${mine.length} affaire${mine.length > 1 ? "s" : ""}</span><span class="tag num">${eur(won.reduce((s, o) => s + o.amount, 0))} signés</span></div></div></div>
      <div class="split"><aside class="panel">${section("coord", "Coordonnées", ["name", "email", "phone", "address"].map((k) => field(d, k)).join(""))}</aside>
      <div class="feed">
        <section class="blk"><h3 class="h">Affaires <span class="count num">${mine.length}</span></h3><div class="scrollx"><div class="inner"><div class="thead cols-cdeals"><span>Affaire</span><span>Dates</span><span>Montant</span><span>Étape</span></div>
          ${mine.map((o) => `<button class="row cols-cdeals" data-go="affaire-${o.id}"><span class="cell"><small>${o.kind}</small><b>${esc(o.title)}</b></span><span class="cell num"><small>${nights(o.start, o.end)} nuits</small><b>${range(o.start, o.end)}</b></span><span class="cell num"><b>${eur(o.amount)}</b></span><span class="cell">${o.status === "Perdu" ? `<span class="tag t-red">Perdue</span>` : `<span class="tag ${o.stage >= 4 ? "t-green" : ""}">${STAGES[o.stage]}</span>`}</span></button>`).join("")}</div></div></section>
        <section class="blk"><h3 class="h">Derniers échanges</h3><div class="scrollx"><div class="inner">${talks.map((t) => convRow(t.o, t.ch, t.last, t.unread)).join("") || `<p class="muted">Aucun échange pour l'instant.</p>`}</div></div></section>
        <section class="blk"><h3 class="h">Documents <span class="count num">${docs.length}</span></h3>${docs.length ? `<div class="docs">${docs.join("")}</div>` : `<span class="muted">Aucun document pour ce contact.</span>`}</section>
      </div></div>`;
}

/* ---------- Messages: every conversation, whatever the deal ---------- */
function viewMessages() {
  const q = S.mq.toLowerCase(), every = live().flatMap(convs), unreadN = every.filter((c) => c.unread).length;
  const all = every.filter((c) => (S.mTab === "Tous" || (S.mTab === "Non lus" ? c.unread : c.ch === S.mTab)) && (c.o.title + " " + c.o.contact.name + " " + c.last.text).toLowerCase().includes(q))
    .sort((a, b) => Number(b.unread) - Number(a.unread));
  const tab = (t, n) => `<button class="${S.mTab === t ? "on" : ""}" data-mtab="${t}">${t}${n ? ` <span class="count num">${n}</span>` : ""}</button>`;
  return topbar("Messages", "") + `<div class="content">
    <div class="tabs" role="tablist">${tab("Tous", every.length)}${tab("Non lus", unreadN)}${tab("E-mail", 0)}${tab("WhatsApp", 0)}</div>
    <div class="tray"><strong class="num">${all.length} conversation${all.length > 1 ? "s" : ""}</strong><input id="mq" class="search" type="search" placeholder="Rechercher un contact ou un message" value="${esc(S.mq)}" aria-label="Rechercher une conversation"></div>
    <div class="scrollx"><div class="inner">${all.map((c) => convRow(c.o, c.ch, c.last, c.unread)).join("") || `<p class="muted">Aucune conversation ne correspond.</p>`}</div></div></div>`;
}

/* ---------- Tasks: every "to do" of every deal ---------- */
const TASK_TYPES = ["Rappel", "Appel", "Visite", "Tâche"];
function viewTasks() {
  const every = live().flatMap((o) => o.todos.map((t) => ({ t, o }))).sort((a, b) => ((a.t.due ?? "9") < (b.t.due ?? "9") ? -1 : 1));
  const isLate = ({ t }) => Boolean(t.due) && t.due < TODAY, week = ({ t }) => Boolean(t.due) && t.due <= addDays(TODAY, 7);
  const all = every.filter((x) => (S.tTab === "late" ? isLate(x) : S.tTab === "week" ? week(x) : true));
  const tab = (id, label, n) => `<button class="${S.tTab === id ? "on" : ""}" data-ttab="${id}">${label}${n ? ` <span class="count num">${n}</span>` : ""}</button>`;
  return topbar("Tâches", `<button class="btn" data-a="task-new">${ico("tasks", "s")}Nouvelle tâche</button>`) + `<div class="content">
    <div class="tabs" role="tablist">${tab("all", "Toutes", every.length)}${tab("week", "Sous 7 jours", every.filter(week).length)}${tab("late", "En retard", every.filter(isLate).length)}</div>
    <div class="scrollx"><div class="inner">${all.map(({ t, o }) => `<div class="row task"><button class="mk todo" data-done="${t.id}" data-deal="${o.id}" aria-label="Marquer comme fait : ${esc(t.t)}"></button>
      <span class="cell"><small>${esc(t.type ?? "Rappel")}</small><b>${esc(t.t)}</b></span><span class="cell"><small>Affaire</small><b>${esc(o.title)}</b></span>
      <span class="cell num"><small>Échéance</small><b class="${isLate({ t }) ? "latetx" : ""}">${t.due ? fr(t.due) : "Sans date"}</b></span><button class="btn alt sm" data-go="affaire-${o.id}">Ouvrir l'affaire</button></div>`).join("") || `<p class="muted">Aucune tâche ici. Tout est fait.</p>`}</div></div></div>`;
}

/* ---------- Statistics ---------- */
function viewStats() {
  const yr = S.sYear, inYear = live().filter((d) => d.start.slice(0, 4) === yr), signed = inYear.filter((d) => d.stage >= 4);
  const lostN = S.deals.filter((d) => d.status === "Perdu" && d.start.slice(0, 4) === yr).length, asked = inYear.length + lostN;
  const total = signed.reduce((s, d) => s + d.amount, 0), cashed = signed.reduce((s, d) => s + received(d), 0), nightsN = signed.reduce((s, d) => s + nights(d.start, d.end), 0);
  const byMonth = MONTHS.map((_, i) => signed.filter((d) => Number(d.start.slice(5, 7)) === i + 1).reduce((s, d) => s + d.amount, 0)), maxM = Math.max(1, ...byMonth);
  const group = (key) => { const m = new Map(); inYear.forEach((d) => m.set(d[key], (m.get(d[key]) ?? 0) + d.amount)); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  const hbars = (rows, fmt) => { const max = Math.max(1, ...rows.map((r) => r[1]));
    return rows.length ? `<div class="hbars">${rows.map(([l, v]) => `<div class="hb" title="${esc(l)} : ${fmt(v)}"><span class="hl">${esc(l)}</span><span class="ht"><i style="width:${v ? Math.max(2, v / max * 100) : 0}%"></i></span><b class="num">${fmt(v)}</b></div>`).join("")}</div>` : `<span class="muted">Aucune affaire sur cette année.</span>`; };
  const tile = (icon, l, v, sub) => `<div class="card kpi"><span class="kh"><span class="ic">${ico(icon, "m")}</span><span class="l">${l}</span></span><span class="v num">${v}</span><span class="ks">${sub}</span></div>`;
  const card = (title, sub, body, wide = false) => `<section class="card setcard ${wide ? "wide" : ""}"><h3 class="h">${title}</h3><p class="help">${sub}</p>${body}</section>`;
  const years = [...new Set(S.deals.map((d) => d.start.slice(0, 4)))].sort();
  const count = (n) => `${n} affaire${n > 1 ? "s" : ""}`;
  return topbar("Statistiques", "") + `<div class="content">
    <div class="tray"><strong>Séjours de l'année</strong><select id="s-year" aria-label="Année des séjours">${years.map((y) => `<option ${y === yr ? "selected" : ""}>${y}</option>`).join("")}</select></div>
    <div class="kpis">${tile("euro", "Chiffre signé", eur(total), count(signed.length) + " signée" + (signed.length > 1 ? "s" : ""))}
      ${tile("bank", "Encaissé", eur(cashed), total ? `${Math.round(cashed / total * 100)} % du chiffre signé` : "Rien à encaisser")}
      ${tile("home", "Nuits réservées", String(nightsN), signed.length ? `Panier moyen : ${eur(Math.round(total / signed.length))}` : "Aucun séjour signé")}
      ${tile("check", "Taux de transformation", asked ? `${Math.round(signed.length / asked * 100)} %` : "0 %", `${signed.length} signée${signed.length > 1 ? "s" : ""} sur ${asked} demande${asked > 1 ? "s" : ""}, ${lostN} perdue${lostN > 1 ? "s" : ""}`)}</div>
    <div class="statgrid">
      ${card("Chiffre signé par mois de séjour", `Année ${yr}, en milliers d'euros`, `<div class="cols12" role="img" aria-label="Chiffre signé par mois de séjour en ${yr}">${byMonth.map((v, i) => `<div class="cm" title="${MONTHS[i]} ${yr} : ${eur(v)}"><span class="cv num">${v ? (v / 1000).toFixed(1).replace(".", ",") + " k" : ""}</span><i style="height:${v / maxM * 82}%"></i><span class="cl">${MONTHS_SHORT[i]}</span></div>`).join("")}</div>`, true)}
      ${card("Affaires par étape", "Nombre d'affaires en cours à chaque étape", hbars(STAGES.map((s, i) => [s, inYear.filter((d) => d.stage === i).length]), count))}
      ${card("Montant par type", "Toutes étapes confondues, hors affaires perdues", hbars(group("kind"), eur))}
      ${card("Montant par source", "D'où viennent les demandes", hbars(group("source"), eur))}
      ${card("Affaires perdues", "Raison donnée au moment de la perte", (() => { const m = new Map(); S.deals.filter((d) => d.status === "Perdu" && d.start.slice(0, 4) === yr).forEach((d) => { const k = (d.lostReason || "Raison non précisée").split(" : ")[0]; m.set(k, (m.get(k) ?? 0) + 1); }); return m.size ? hbars([...m.entries()], count) : `<span class="muted">Aucune affaire perdue sur cette année.</span>`; })())}
    </div></div>`;
}

/* ---------- Settings ---------- */
const stepper = (minus, plus, label, lo, hi) => `<div class="stepper"><button data-a="${minus}" aria-label="Diminuer" ${lo ? "disabled" : ""}>−</button><b class="num">${label}</b><button data-a="${plus}" aria-label="Augmenter" ${hi ? "disabled" : ""}>+</button></div>`;
function viewSettings() {
  if (!isAdmin()) return topbar("Réglages", "") + `<div class="content"><div class="card lockcard"><span class="nic">${ico("lock", "s")}</span><div><b>Réglages réservés aux administrateurs</b><p class="muted">Vous utilisez l'application avec le rôle Équipe. Les étapes, l'échéancier, les calendriers, la banque et les utilisateurs se modifient avec un compte administrateur.</p></div><button class="btn alt" data-a="role" data-role="admin">Revenir en administrateur</button></div></div>`;
  const card = (title, sub, body) => `<section class="card setcard"><h3 class="h">${title}</h3>${sub ? `<p class="help">${sub}</p>` : ""}${body}</section>`;
  const srow = (main, sub, right = "") => `<div class="srow"><span class="grow"><b>${main}</b>${sub ? `<small>${sub}</small>` : ""}</span>${right}</div>`;
  const sim = (label, msg) => `<button class="link" data-a="sim" data-msg="${esc(msg)}">${label}</button>`;
  return topbar("Réglages", "") + `<div class="content"><div class="setgrid">
    ${card("Étapes du pipeline", "Une affaire avance de gauche à droite. À partir de l'option, ses dates sont bloquées dans le calendrier.", STAGES.map((s, i) => { const n = live().filter((d) => d.stage === i).length; return srow(`${i + 1}. ${s}`, i < 2 ? "Dates souhaitées, rien n'est bloqué" : i < 4 ? "Option : les dates sont bloquées" : "Réservation ferme, échéancier créé", `<span class="mini num">${n} affaire${n > 1 ? "s" : ""}</span>`); }).join(""))}
    ${card("Échéancier par défaut", "Appliqué à la signature. Les affaires déjà signées gardent leur échéancier.", srow("Acompte à la signature", `${TERMS.deposit} % du montant`, stepper("dep-minus", "dep-plus", `${TERMS.deposit} %`, TERMS.deposit <= 10, TERMS.deposit >= 50))
      + srow("Solde", "Deux mois avant l'arrivée", `<span class="mini">Fixe</span>`) + srow("Caution", "Empreinte de carte, levée après le départ", stepper("hold-minus", "hold-plus", eur(TERMS.hold), TERMS.hold <= 0, TERMS.hold >= 5000)))}
    ${card("Ménage entre deux séjours", "Une réservation plus rapprochée reste possible, avec une confirmation notée dans l'historique.", srow("Délai minimal", "Entre un départ et l'arrivée suivante", stepper("buf-minus", "buf-plus", `${S.buffer} jours`, S.buffer <= 0, S.buffer >= 7)))}
    ${card("Calendriers importés", "Leurs réservations bloquent les dates, ménage compris.", S.sources.map((s) => srow(`${esc(s.kind)}, ${esc(s.name)}`, `${s.last ? "Lu le " + esc(when(s.last)) : "Pas encore lu"} · ${esc(s.url)}`, `<button class="link" data-a="src-sync" data-id="${s.id}">Synchroniser</button><button class="iconbtn" data-a="src-del" data-id="${s.id}" aria-label="Retirer le calendrier ${esc(s.name)}">${ico("trash", "s")}</button>`)).join("") + `<button class="btn alt sm" data-a="ics-new">Ajouter un calendrier</button>`
      + srow("Mon calendrier, pour Airbnb ou Booking", "Collez ce lien dans la plateforme : elle bloquera chez elle les dates réservées ici. Il ne montre que « Réservé » et les dates.", `<button class="btn alt sm" data-a="ical-copy">${ico("copy", "s")}Copier le lien</button>`))}
    ${card("Banque", "Importez le relevé de votre banque (CSV avec les colonnes Date, Description, Amount). Seuls les encaissements sont gardés, puis rapprochés des échéances : même montant, nom du locataire dans le libellé.",
      srow("Relevé importé", S.bankStatement.length ? `${S.bankStatement.length} encaissement${S.bankStatement.length > 1 ? "s" : ""}, du ${fr(S.bankStatement.reduce((m, t) => (t.on < m ? t.on : m), "9999"))} au ${fr(S.bankStatement.reduce((m, t) => (t.on > m ? t.on : m), "0000"))} · importé ${esc(S.lastBank)}` : "Aucun relevé pour l'instant", S.bankStatement.length ? `<button class="btn alt sm" data-a="sync-all">${ico("sync", "s")}Rapprocher</button>` : "")
      + `<label class="fld"><span>Importer un relevé</span><input id="bank-file" class="inp filein" type="file" accept=".csv,text/csv"></label>`)}
    ${card("Bailleur", "Ces informations sont reprises dans les contrats, en français comme en anglais. Elles restent dans l'application : elles ne sont écrites nulle part dans son code.",
      LESSOR_FIELDS.map(([k, label]) => ["ls-" + k, k, label])
        .map(([id, k, label]) => `<label class="fld"><span>${label}</span><input id="${id}" class="inp" value="${esc(S.draft[id] ?? S.lessor[k] ?? "")}"></label>`).join("") + `<div class="srow"><span class="grow"></span><button class="btn sm" data-a="lessor-save">Enregistrer</button></div>`)}
    ${card("Google Drive", "Une fois connecté, « Créer » sur un contrat ou une caution fabrique un vrai document Google Docs, rempli depuis l'affaire et modifiable dans le panneau. L'application ne voit que les documents qu'elle crée. Ils sont privés : partagez le dossier avec les personnes qui doivent y accéder.",
      S.drive.on ? srow(`Connecté${S.drive.email ? " : " + esc(S.drive.email) : ""}`, "Un dossier par affaire dans « Les jardins de Campagne » : dans « Prospects » dès sa création, déplacé dans « Clients » à la signature.", `${S.drive.folder ? `<a class="btn alt sm" href="https://drive.google.com/drive/folders/${encodeURIComponent(S.drive.folder)}" target="_blank" rel="noopener">Ouvrir le dossier</a>` : ""}<button class="btn alt sm" data-a="drive-off">Déconnecter</button>`)
        : srow("Non connecté", "Les documents créés restent pour l'instant dans l'application.", `<a class="btn sm" href="/auth/drive">Connecter Google Drive</a>`))}
    ${card("Sauvegarde", "Une copie de toutes les données est faite chaque jour sur le serveur, et les 30 dernières sont gardées. Téléchargez-en une de temps en temps pour la ranger ailleurs.", srow("Dernière copie automatique", S.admin && S.admin.lastBackup ? `le ${fr(S.admin.lastBackup)}` : "pas encore faite", `<a class="btn alt sm" href="/api/backup" download>${ico("down", "s")}Télécharger</a>`))}
    ${card("Modèles de documents", "Le bouton « Créer » d'un document manquant part de ces modèles.", SLOTS.map((s) => srow(s.label, KLBL[s.k], sim("Ouvrir le modèle", `Dans l'application : le modèle « ${s.label} » s'ouvre dans Google Docs.`))).join(""))}
    ${card("Importer un planning", "Un fichier JSON : une ligne par séjour, ou une saison complète (paiements, documents, e-mails) préparée pour l'audit. Réimporter le même fichier met les séjours à jour.", `<label class="fld"><span>Fichier</span><input id="imp-file" class="inp filein" type="file" accept=".json,application/json"></label>`)}
    ${card("Utilisateurs", "L'équipe ne voit ni les documents confidentiels ni les réglages.", S.users.map((u, i) => srow(esc(u.name) + (i === 0 ? " (vous)" : ""), esc(u.email) + (u.pending ? " · invitation envoyée" : ""), i === 0 ? `<span class="mini t-blue">Admin</span>`
      : `<select class="inp auto" data-urole="${i}" aria-label="Rôle de ${esc(u.name)}">${["Équipe", "Admin"].map((o) => `<option ${u.role === o ? "selected" : ""}>${o}</option>`).join("")}</select><button class="iconbtn" data-udel="${i}" aria-label="Retirer ${esc(u.name)}">${ico("trash", "s")}</button>`)).join("") + `<button class="btn alt sm" data-a="user-new">Inviter un utilisateur</button>`)}
    ${card("Pennylane", "Devis et factures sont préparés ici et enregistrés dans Pennylane. À la finalisation ils sont numérotés et deviennent des PDF qui ne se modifient plus.", srow("Compte", "Le Domaine", `<span class="mini t-green">Connecté</span>`)
      + srow("Prochains numéros", `Devis D-2026-${String(S.plSeq.D + 1).padStart(3, "0")} · Facture F-2026-${String(S.plSeq.F + 1).padStart(3, "0")}`, `<button class="btn alt sm" data-a="sim" data-msg="Pennylane : devis et factures sont à jour.">${ico("sync", "s")}Synchroniser</button>`))}
    ${card("Signature électronique", "Contrat, devis et caution se signent en ligne. Le document est figé en PDF avant l'envoi, puis verrouillé une fois signé.", srow("Service de signature", "Signature horodatée, PDF signé rangé dans l'affaire", `<span class="mini t-green">Connecté</span>`))}
    ${card("Messagerie", "Les e-mails et les messages WhatsApp échangés avec un client se rangent dans son affaire.", srow("Gmail", "Envoi et réception", `<span class="mini t-green">Connecté</span>`) + srow("WhatsApp Business", "+33 6 00 00 00 00", `<span class="mini t-green">Connecté</span>`))}
  </div></div>`;
}

/* ---------- Documents page: folders per deal, or one cross-deal list once filtered ---------- */
const NONE = "Non classé", ALL = { kind: "Tous les documents", year: "Toutes les années", deal: "Toutes les affaires", status: "Tous les statuts" };
const kindOf = (x) => (SLOTS.find((s) => s.key === x.slot) ?? SLOTS.find((s) => x.t.toLowerCase().includes(s.hint)))?.label ?? "Autre";
const everyDoc = () => [...S.deals.flatMap((d) => d.docs.map((x, i) => ({ x, ref: `${d.id}:${i}`, from: d.title }))), ...S.library.map((x, i) => ({ x, ref: `lib:${i}`, from: NONE }))];
const docFiltered = () => S.dq !== "" || S.dKind !== ALL.kind || S.dYear !== ALL.year || S.dDeal !== ALL.deal || S.dStatus !== ALL.status;
function filteredDocs() {
  const q = S.dq.toLowerCase();
  return everyDoc().filter(({ x, from }) => (S.dKind === ALL.kind || kindOf(x) === S.dKind) && (S.dYear === ALL.year || x.d.slice(0, 4) === S.dYear)
    && (S.dDeal === ALL.deal || from === S.dDeal) && (S.dStatus === ALL.status || (x.st ?? "Brouillon") === S.dStatus) && (x.t + " " + from).toLowerCase().includes(q));
}
function viewDocuments() {
  const every = everyDoc(), flat = S.dView === "flat" || docFiltered(), all = filteredDocs();
  const SHORT = { [ALL.kind]: "Type", [ALL.year]: "Année", [ALL.deal]: "Affaire", [ALL.status]: "Statut" };
  const sel = (id, label, cur, list) => `<select id="${id}" class="${cur === list[0] ? "" : "on"}" aria-label="${label}">${list.map((o) => `<option value="${esc(o)}" ${cur === o ? "selected" : ""}>${esc(SHORT[o] ?? o)}</option>`).join("")}</select>`;
  const years = [...new Set(every.map((e) => e.x.d.slice(0, 4)))].sort().reverse();
  const folder = (id, title, sub, body, warn) => `<section class="folder ${S.openFolders[id] ? "open" : ""}"><button class="fh" data-folder="${id}" aria-expanded="${Boolean(S.openFolders[id])}">
      <span class="fi">${ico("folder", "m")}</span><span class="grow"><b>${esc(title)}</b><small>${sub}</small></span>${warn ? `<span class="mini t-orange">${warn}</span>` : `<span class="mini t-green">Complet</span>`}<span class="chevr">${ico("chev", "m")}</span></button>
      ${S.openFolders[id] ? `<div class="docs">${body}</div>` : ""}</section>`;
  const folders = S.deals.map((d) => { const need = slotsFor(d), have = need.filter((sl) => d.docs.some((x) => x.slot === sl.key)).length, miss = need.length - have;
      return folder(d.id, d.title, `${d.kind} · ${range(d.start, d.end)} · ${have} sur ${need.length} document${need.length > 1 ? "s" : ""}`, dealDocs(d, true), miss ? `${miss} manquant${miss > 1 ? "s" : ""}` : ""); }).join("")
    + (S.library.length ? folder("lib", NONE, `${S.library.length} fichiers à rattacher à une affaire`, S.library.map((x, i) => docCard(x, `lib:${i}`, "", kindOf(x))).join(""), "À classer") : "");
  return topbar("Documents", `<button class="btn" data-a="doc">${ico("doc", "s")}Ajouter un document</button>`) + `<div class="content"><div class="tray"><div class="tl"><strong class="num">${flat ? `${all.length} document${all.length > 1 ? "s" : ""}` : `${S.deals.length} dossiers`}</strong>
      <input id="dq" class="search" type="search" placeholder="Rechercher un document ou une affaire" value="${esc(S.dq)}" aria-label="Rechercher un document">
      ${sel("d-kind", "Filtrer par type de document", S.dKind, [ALL.kind, ...SLOTS.map((s) => s.label), "Autre"])}${sel("d-year", "Filtrer par année", S.dYear, [ALL.year, ...years])}${sel("d-deal", "Filtrer par affaire", S.dDeal, [ALL.deal, ...new Set(every.map((e) => e.from))])}${sel("d-status", "Filtrer par statut", S.dStatus, [ALL.status, ...Object.keys(DOC_ST)])}${docFiltered() ? `<button class="link" data-a="doc-reset">Réinitialiser</button>` : ""}</div><div class="tr">
      <div class="seg" role="group" aria-label="Affichage"><button class="${flat ? "" : "on"}" data-dview="folders" ${docFiltered() ? "disabled" : ""}>${ico("folder", "s")}Dossiers</button><button class="${flat ? "on" : ""}" data-dview="flat">${ico("list", "s")}Liste</button></div>
      ${flat ? `<button class="btn" data-a="export" ${all.length ? "" : "disabled"}>${ico("down", "s")}Exporter (${all.length})</button>` : ""}</div></div>
    ${S.exportMsg && flat ? `<p class="exportmsg" role="status">${esc(S.exportMsg)}</p>` : ""}
    ${!flat ? `<div class="folders">${folders}</div>` : all.length ? `<div class="docs">${all.map(({ x, ref, from }) => docCard(x, ref, from, kindOf(x))).join("")}</div>` : `<p class="muted">Aucun document ne correspond à ces filtres.</p>`}</div>`;
}

const BADGE = { file: "FICH", pl: "PL", pdf: "PDF", gdoc: "DOC", xls: "XLS", img: "IMG" }, KLBL = { pl: "Facturation", file: "Fichier", pdf: "PDF", gdoc: "Document", xls: "Tableur", img: "Image" };
const SOURCES = ["Site web", "Recommandation", "Téléphone", "Salon du mariage", "Airbnb"];
// Where a document stands, each with the tint of its pill (a draft stays neutral grey).
const DOC_ST = { Brouillon: "", Reçu: "t-blue", Finalisé: "t-teal", Envoyé: "t-blue", "À signer": "t-orange", Signé: "t-green" };
const initials = (n) => n.split(/\s+/).map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
const stamp = () => fr(TODAY) + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
/* ---------- Documents: the six a booking must hold, portrait cards, preview ---------- */
// What every dossier is expected to contain, in the order the estate asks for them.
const SLOTS = [
  { key: "devis", label: "Devis", k: "pl", hint: "devis", from: 0 },
  { key: "contrat", label: "Contrat de location", k: "gdoc", hint: "contrat", from: 2 },
  { key: "acompte", label: "Facture d'acompte", k: "pl", hint: "acompte", from: 4 },
  { key: "solde", label: "Facture de solde", k: "pl", hint: "solde", from: 4 },
  { key: "caution", label: "Caution", k: "gdoc", hint: "caution", from: 4 },
  { key: "assurance", label: "Assurance", k: "pdf", hint: "assurance", from: 4 },
];
// One line per document, everywhere: a coloured badge for its kind, its name, where it stands.
function docCard(x, ref, dealTitle, cap) {
  return `<button class="drow" data-doc="${ref}" aria-label="Aperçu : ${esc(x.t)}"><span class="kb ${x.k}" title="${KLBL[x.k]}">${BADGE[x.k]}</span>
    <span class="grow"><b>${esc(x.t)}</b><small class="num">${cap ? esc(cap) + " · " : ""}${dealTitle ? esc(dealTitle) + " · " : ""}${fr(x.d)}${x.admin ? " · Admin" : ""}</small></span><span class="mini st ${DOC_ST[x.st ?? "Brouillon"]}">${x.st ?? "Brouillon"}</span>${ico("right", "s")}</button>`;
}
// The six expected documents first, present or missing, then anything else filed on the deal.
function dealDocs(d, inFolder = false) {
  const used = new Set(), todo = [];
  const cards = slotsFor(d).map((sl) => { const i = d.docs.findIndex((x) => x.slot === sl.key); if (i < 0) { todo.push(sl); return ""; } used.add(i); return docCard(d.docs[i], `${d.id}:${i}`, "", sl.label); }).join("")
    + d.docs.map((x, i) => (used.has(i) ? "" : docCard(x, `${d.id}:${i}`, "", "Autre document"))).join("");
  // Only the next document to prepare carries the main button: the order is quote, contract, then the rest.
  const row = (sl, n) => { const main = n === 0 ? "btn sm" : "btn alt sm";
    const acts = inFolder ? `<button class="btn alt sm" data-go="affaire-${d.id}">Ouvrir l'affaire</button>`
      : `${sl.k === "pdf" ? `<button class="${main}" data-a="doc" data-slot="${sl.key}" data-file="1">Importer</button>` : `<button class="${main}" data-a="slot-create" data-slot="${sl.key}" ${S.creating ? "disabled" : ""}>${S.creating === sl.key ? "Création dans Drive" : "Créer"}</button>`}<button class="link" data-a="slot-pick" data-slot="${sl.key}">Récupérer</button>`;
    return `<div class="mrow"><span class="kb ${sl.k} todo" title="${KLBL[sl.k]}, à préparer">${BADGE[sl.k]}</span><span class="grow"><b>${sl.label}</b><small>${SLOT_HINT[sl.key]}</small></span>${acts}</div>`; };
  return cards + (todo.length ? `<div class="mdocs"><span class="eyebrow">À préparer à cette étape</span>${todo.map(row).join("")}</div>` : "");
}
const SLOT_HINT = { devis: "Brouillon, lignes modifiables", contrat: "Depuis le modèle, modifiable ici", acompte: "Facture, montant de l'échéancier", solde: "Facture, montant de l'échéancier", caution: "Depuis le modèle, modifiable ici", assurance: "Attestation fournie par le locataire" };
// What the document says, written from the deal's own data so the preview follows every edit.
const fileBody = (x) => (x.k === "pdf" ? `<iframe class="fileview" src="/api/files/${x.fileId}" title="${esc(x.t)}"></iframe>` : x.k === "img" ? `<img class="fileimg" src="/api/files/${x.fileId}" alt="${esc(x.t)}">`
  : `<h1>${esc(x.t)}</h1><p class="c">Fichier importé</p><p>Ce type de fichier ne s'affiche pas ici : ouvrez-le avec le bouton en bas du panneau.</p>`);
// What the rental agreement says about one stay, in the deal's language. Every value is escaped and
// marked here, so the template only places them.
const LANGS = { fr: "Français", en: "English" };
const LESSOR_FIELDS = [["name", "Société"], ["legal", "Forme, capital, SIRET, RCS"], ["address", "Adresse du bailleur"], ["phone", "Téléphone"], ["email", "E-mail"], ["signer", "Gérant (signataire)"], ["place", "Adresse du bien loué"], ["reception", "Téléphone de l'accueil"], ["city", "Ville de signature"],
  ["regno", "Numéro d'enregistrement du meublé de tourisme"], ["tax", "Taxe de séjour (tarif à indiquer au contrat)"], ["mediator", "Médiateur de la consommation (nom, adresse, site)"]];
const NATURE = { fr: { Mariage: "Mariage et séjour de vacances", Séjour: "Séjour de vacances", Séminaire: "Séminaire", Anniversaire: "Anniversaire et séjour de vacances", Retraite: "Retraite", Famille: "Séjour" },
  en: { Mariage: "Wedding and vacation", Séjour: "Vacation", Séminaire: "Seminar", Anniversaire: "Birthday and vacation", Retraite: "Retreat", Famille: "Stay" } };
function contractValues(d) {
  const en = d.lang === "en", none = en ? "to be completed" : "à compléter", tbd = en ? "to be defined" : "à définir", L = S.lessor ?? {};
  const m = (v) => `<mark>${esc(v === "" || v == null || v === "à compléter" ? none : v)}</mark>`;
  const utc = (iso) => new Date(Date.parse(iso)), loc = en ? "en-GB" : "fr-FR";
  const day = (iso) => (iso ? `${new Intl.DateTimeFormat(loc, { weekday: "long", timeZone: "UTC" }).format(utc(iso))} ${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : tbd);
  const date = (iso) => (iso ? new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(utc(iso)) : tbd);
  const money = (n) => (en ? "€" + new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(n) : eur2(n));
  const hour = (t) => { if (!en) return t; const [h, mn] = t.split(":").map(Number); return `${h % 12 || 12}${mn ? ":" + String(mn).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`; };
  const pay = (id) => d.payments.find((p) => p.id === id), dep = pay("dep")?.amount ?? Math.round(d.amount * TERMS.deposit / 100), hold = d.payments.find((p) => p.hold)?.amount ?? TERMS.hold, n = nights(d.start, d.end);
  const two = d.start ? (() => { const t = utc(d.start); t.setUTCMonth(t.getUTCMonth() - 2); return t.toISOString().slice(0, 10); })() : "";
  const ev = Math.min(d.eventPart ?? 0, d.amount);
  return { legal: m(L.legal), regno: m(L.regno), mediator: m(L.mediator), tax: m(L.tax), split: ev > 0, stayPart: m(money(d.amount - ev)), eventPart: m(money(ev)),
    brand: esc(L.brand || "Les Jardins de Campagne"), lessor: m(L.name), lessorAddress: m(L.address), lessorPhone: m(L.phone), lessorEmail: m(L.email), place: m(L.place || L.address), reception: m(L.reception || L.phone), signer: m(L.signer), city: m(L.city),
    tenants: m(d.tenants.filter(Boolean).join(en ? " and " : " et ") || d.contact.name), email: m(d.contact.email), phone: m(d.contact.phone), address: m(d.contact.address), guests: m(d.guests || ""), occupants: m(d.sleeping || 22),
    nature: m((en ? NATURE.en : NATURE.fr)[d.kind] ?? d.kind), nights: m(d.start ? `${n} ${en ? (n > 1 ? "nights" : "night") : n > 1 ? "nuits" : "nuit"}` : ""), start: m(day(d.start)), end: m(day(d.end)), arrival: m(hour(d.arrival)), departure: m(hour(d.departure)),
    amount: m(money(d.amount)), pct: m(d.amount ? `${Math.round(dep / d.amount * 100)} %` : `${TERMS.deposit} %`), deposit: m(money(dep)), balance: m(money(Math.max(0, d.amount - dep))), balanceDue: m(date(pay("bal")?.due ?? two)), hold: m(money(hold)), holdDue: m(date(d.start ? addDays(d.start, -2) : "")) };
}
// A file kept in Google Drive is shown by Drive itself, inside the panel: its viewer for a PDF or an
// image, the Google Docs editor for a document that is neither signed nor finalised.
const driveId = (u) => (/\/d\/([\w-]{10,})/.exec(u ?? "") ?? [])[1] ?? "";
const inDraft = (x) => (x.st ?? "Brouillon") === "Brouillon";
const driveLive = (x) => x.k === "gdoc" && inDraft(x);
function docBody(d, x) {
  if (x.url) { const id = driveId(x.url);
    return id ? `<iframe class="fileview" src="https://${x.k === "gdoc" ? "docs.google.com/document" : "drive.google.com/file"}/d/${id}/${driveLive(x) ? "edit" + ((q) => (q ? "?" + q : ""))([S.docBare ? "rm=minimal" : "", x.stamp ? "ts=" + hash(x.stamp) : ""].filter(Boolean).join("&")) : "preview"}" title="${esc(x.t)}" referrerpolicy="no-referrer" allow="clipboard-read; clipboard-write"></iframe>`
      : `<h1>${esc(x.t)}</h1><p class="c">Rangé dans Google Drive</p><p>Ce document s'ouvre dans Google Drive avec le bouton en bas du panneau.</p>`; }
  if (x.fileId) return fileBody(x);
  if (x.body) return x.body;
  if (!d) return `<h1>${esc(x.t)}</h1><p class="c">Document non classé</p><p>Ce document n'est rattaché à aucune affaire. Ouvrez une affaire puis utilisez « Récupérer » sur le document manquant pour le classer.</p>`;
  const m = (v) => `<mark>${esc(v)}</mark>`, title = x.t.toLowerCase(), who = d.tenants.filter(Boolean).join(" et ");
  const dep = d.payments.find((p) => p.id === "dep")?.amount ?? Math.round(d.amount * TERMS.deposit / 100), n = nights(d.start, d.end);
  const slot = x.slot ?? (title.includes("facture") ? "acompte" : title.includes("devis") ? "devis" : title.includes("contrat") ? "contrat" : "");
  if (x.k === "xls") {
    const names = ["Famille proche", "Témoins", "Amis d'enfance", "Collègues", "Cousins", "Voisins"];
    return `<h1>${esc(x.t)}</h1><p class="c">${esc(d.title)}, ${d.guests} invités</p><table><tr><th>Table</th><th>Groupe</th><th class="r">Couverts</th></tr>
      ${names.map((g, i) => `<tr><td>${i + 1}</td><td>${g}</td><td class="r">${Math.max(2, Math.round(d.guests / names.length))}</td></tr>`).join("")}</table>`;
  }
  if (slot === "acompte" || slot === "solde") {
    const ttc = slot === "acompte" ? dep : d.amount - dep, ht = ttc / 1.1;
    return `<h1>${esc(x.t)}</h1><p class="c">Émise le ${fr(x.d)}, règlement ${slot === "acompte" ? "à réception" : "deux mois avant l'arrivée"}</p>
      <p>${m(who)}<br>${m(d.contact.address)}</p>
      <table><tr><th>Désignation</th><th class="r">TVA</th><th class="r">Montant HT</th></tr>
      <tr><td>${slot === "acompte" ? "Acompte" : "Solde"}, séjour du ${range(d.start, d.end)}</td><td class="r">10 %</td><td class="r">${ht.toFixed(2).replace(".", ",")} €</td></tr>
      <tr><td><b>Total TTC</b></td><td></td><td class="r"><b>${m(eur(ttc))}</b></td></tr></table>`;
  }
  if (slot === "devis") {
    const q = quoteOf(d);
    return `<h1>Devis</h1><p class="c">Valable 30 jours</p><p>Pour ${m(d.contact.name)}, ${m(d.kind.toLowerCase())} du ${m(range(d.start, d.end))}.</p>
      <table><tr><th>Prestation</th><th class="r">Qté</th><th class="r">Montant</th></tr>
      ${q.map((r) => `<tr><td>${esc(r.l)}</td><td class="r">${r.q}</td><td class="r">${eur(r.q * r.p)}</td></tr>`).join("")}
      <tr><td><b>Total TTC</b></td><td></td><td class="r"><b>${m(eur(quoteTotal(q)))}</b></td></tr></table>`;
  }
  if (slot === "caution") {
    return `<h1>Caution</h1><p class="c">Empreinte de carte bancaire</p><p>${m(who)} dépose une caution de ${m(eur(TERMS.hold))} par empreinte de carte bancaire, au plus tard le ${m(longDay(d.start))}.</p>
      <p>Aucune somme n'est débitée. L'empreinte est levée dans les 15 jours suivant le départ, déduction faite des éventuels dégâts constatés à l'état des lieux de sortie.</p>
      <div class="sign"><span>Le bailleur</span><span>Le locataire</span></div>`;
  }
  if (slot === "assurance") {
    return `<h1>Attestation d'assurance</h1><p class="c">Responsabilité civile, événement</p><p>Assuré : ${m(who)}</p>
      <p>Événement : ${m(d.kind.toLowerCase())} de ${m(d.guests)} invités au domaine.</p><p>Période garantie : du ${m(longDay(d.start))} au ${m(longDay(d.end))}.</p>
      <p>L'attestation doit couvrir toute la durée du séjour. Elle est fournie par le locataire avant la remise des clés.</p>`;
  }
  if (slot === "contrat") return CONTRACT[d.lang === "en" ? "en" : "fr"](contractValues(d));
  return `<h1>${esc(x.t)}</h1><p class="c">${esc(d.title)}</p><p>Document libre rattaché à cette affaire.</p>`;
}
function previewed() {
  if (!S.preview) return null;
  if (S.preview.sheet) { const sd = deal(S.preview.sheet); return sd ? { d: sd, x: { t: "Fiche événement", k: "gdoc", d: TODAY }, sheet: true } : null; }
  const d = S.preview.lib === undefined ? deal(S.preview.deal) : null, x = d ? d.docs[S.preview.i] : S.library[S.preview.lib];
  return x ? { d, x } : null;
}
/* ---------- Windows: add a document, lose a deal, task, calendar, user, search ---------- */
const shell = (title, body, foot, cls = "") => `<div class="scrim ${cls.includes("top") ? "top" : ""}" data-a="close-modal"></div>
    <div class="modal ${cls}" role="dialog" aria-modal="true" aria-labelledby="m-title">
      <header><h2 id="m-title">${title}</h2><button class="iconbtn" data-a="close-modal" aria-label="Fermer">${ico("close", "m")}</button></header>
      <div class="mbody">${body}${S.modalErr ? `<p class="err full" role="alert">${esc(S.modalErr)}</p>` : ""}</div>
      <footer><button class="btn alt" data-a="close-modal">Annuler</button>${foot}</footer>
    </div>`;
const dval = (k, dflt = "") => S.draft[k] ?? dflt;
const opts = (k, list, dflt) => list.map((o) => `<option ${dval(k, dflt) === o ? "selected" : ""}>${esc(o)}</option>`).join("");
function docNewModal() {
  if (S.modal !== "doc-new") return "";
  const to = deal(dval("dn-deal")), taken = (k) => Boolean(to) && to.docs.some((x) => x.slot === k), src = dval("dn-src", "model"), sl = SLOTS.find((s) => s.key === dval("dn-slot"));
  return shell("Ajouter un document", `
    <label class="fld"><span>Affaire</span><select id="dn-deal" class="inp"><option value="">Non classé</option>${S.deals.map((o) => `<option value="${o.id}" ${dval("dn-deal") === o.id ? "selected" : ""}>${esc(o.title)}</option>`).join("")}</select></label>
    <label class="fld"><span>Type de document</span><select id="dn-slot" class="inp"><option value="">Autre document</option>${SLOTS.map((s) => `<option value="${s.key}" ${dval("dn-slot") === s.key ? "selected" : ""} ${taken(s.key) ? "disabled" : ""}>${s.label}${taken(s.key) ? " (déjà présent)" : ""}</option>`).join("")}</select></label>
    <div class="fld full"><span>Origine</span><div class="seg full" role="group" aria-label="Origine du document"><button class="${src === "model" ? "on" : ""}" data-src="model">Créer depuis un modèle</button><button class="${src === "file" ? "on" : ""}" data-src="file">Importer un fichier</button></div></div>
    <label class="fld full"><span>Nom (facultatif)</span><input id="dn-name" class="inp" value="${esc(dval("dn-name"))}" placeholder="${sl ? sl.label : "Document libre"}"></label>
    <p class="hint full">${src === "model" ? (S.drive.on && to && (!sl || sl.k === "gdoc") ? "Le document est créé dans Google Drive, dans le dossier de l'affaire, rempli avec ses informations. Il se modifie ensuite ici." : "Le document est créé en brouillon, rempli avec les informations de l'affaire. Il se modifie ensuite ici.") : "PDF, image, Word, Excel ou texte, 25 Mo au maximum."}</p>${src === "file" ? `<label class="fld full"><span>Fichier</span><input id="dn-file" class="inp filein" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.txt,.csv"></label>` : ""}`,
    `<button class="btn" data-a="doc-add" ${S.uploading || S.creating ? "disabled" : ""}>${S.uploading ? "Envoi en cours" : S.creating ? "Création dans Drive" : "Ajouter le document"}</button>`);
}
const LOST = ["Dates indisponibles", "Budget", "A choisi un autre lieu", "Sans réponse", "Projet annulé", "Autre"];
function lostModal() {
  if (S.modal !== "lost") return ""; const d = deal(ctx().id); if (!d) return "";
  return shell("Marquer l'affaire comme perdue", `<p>« ${esc(d.title)} » quitte le tableau${d.stage >= 2 ? ` et libère les dates du ${range(d.start, d.end)}` : ""}. Elle reste consultable dans l'onglet « Perdues » et peut être rouverte.</p>
    <label class="fld"><span>Raison</span><select id="ls-reason" class="inp">${opts("ls-reason", LOST, LOST[0])}</select></label>
    <label class="fld"><span>Précision (facultatif)</span><input id="ls-note" class="inp" value="${esc(dval("ls-note"))}"></label>`,
    `<button class="btn red" data-a="lost-ok">Marquer comme perdue</button>`, "small");
}
function taskModal() {
  if (S.modal !== "task") return "";
  return shell("Nouvelle tâche", `
    <label class="fld full"><span>Que faut-il faire ?</span><input id="tk-text" class="inp" value="${esc(dval("tk-text"))}" placeholder="Ex. Rappeler pour la visite"></label>
    <label class="fld full"><span>Affaire</span><select id="tk-deal" class="inp">${live().map((o) => `<option value="${o.id}" ${dval("tk-deal") === o.id ? "selected" : ""}>${esc(o.title)}</option>`).join("")}</select></label>
    <label class="fld"><span>Type</span><select id="tk-type" class="inp">${opts("tk-type", TASK_TYPES, "Rappel")}</select></label>
    <label class="fld"><span>Échéance</span><input id="tk-due" class="inp" type="date" value="${esc(dval("tk-due"))}"></label>`,
    `<button class="btn" data-a="task-add">Ajouter la tâche</button>`);
}
function icsModal() {
  if (S.modal !== "ics") return "";
  return shell("Ajouter un calendrier", `
    <label class="fld"><span>Plateforme</span><select id="ic-kind" class="inp">${opts("ic-kind", ["Airbnb", "Booking", "Abritel", "Google Agenda", "Autre"], "Airbnb")}</select></label>
    <label class="fld"><span>Nom du logement</span><input id="ic-name" class="inp" value="${esc(dval("ic-name"))}" placeholder="Ex. Mas des Oliviers"></label>
    <label class="fld full"><span>Adresse du calendrier (lien iCal)</span><input id="ic-url" class="inp" value="${esc(dval("ic-url"))}" placeholder="https://"></label>
    <p class="hint full">Le lien se copie depuis la plateforme, dans les réglages de disponibilité de l'annonce. Les réservations importées bloquent les dates ici et ne se modifient que sur la plateforme.</p>`,
    `<button class="btn" data-a="ics-add">Ajouter le calendrier</button>`);
}
function userModal() {
  if (S.modal !== "user") return "";
  return shell("Inviter un utilisateur", `
    <label class="fld full"><span>Adresse Google de la personne</span><input id="iv-email" class="inp" type="email" value="${esc(dval("iv-email"))}" placeholder="prenom@exemple.fr"></label>
    <label class="fld full"><span>Rôle</span><select id="iv-role" class="inp">${opts("iv-role", ["Équipe", "Admin"], "Équipe")}</select></label>
    <p class="hint full">La personne se connecte avec son compte Google. L'équipe ne voit ni les documents confidentiels ni les réglages.</p>`,
    `<button class="btn" data-a="user-add">Envoyer l'invitation</button>`);
}
function extModal() {
  if (S.modal !== "ext") return ""; const f = S.feeds[S.ext]; if (!f) return "";
  return `<div class="scrim" data-a="close-modal"></div>
    <div class="modal small" role="dialog" aria-modal="true" aria-labelledby="m-title">
      <header><h2 id="m-title">${esc(f.title)}</h2><button class="iconbtn" data-a="close-modal" aria-label="Fermer">${ico("close", "m")}</button></header>
      <div class="mbody"><p><b>${range(f.start, f.end)}</b>, ${nights(f.start, f.end)} nuits. Ménage prévu jusqu'au ${fr(addDays(f.end, S.buffer))}.</p>
        <p class="muted">Cette réservation vient d'un calendrier importé : elle bloque les dates ici, mais se modifie sur la plateforme d'origine.</p></div>
      <footer><button class="btn alt" data-a="close-modal">Fermer</button><button class="btn" data-a="sim" data-msg="Dans l'application : la réservation s'ouvre sur la plateforme d'origine.">Ouvrir sur la plateforme</button></footer>
    </div>`;
}
// One search across deals, contacts and documents, opened from the rail or with Ctrl K.
function searchModal() {
  if (S.modal !== "search") return "";
  const q = dval("gq").trim().toLowerCase(), hit = (...v) => v.some((s) => String(s).toLowerCase().includes(q));
  const row = (attr, badge, cls, main, sub) => `<button class="pick" ${attr}><span class="kb ${cls}">${badge}</span><span class="grow"><b>${esc(main)}</b><small>${esc(sub)}</small></span></button>`;
  const grp = (t, rows) => (rows.length ? `<h4>${t}</h4>${rows.join("")}` : "");
  const found = q === "" ? "" : grp("Affaires", S.deals.filter((d) => hit(d.title, d.kind, d.source)).slice(0, 5).map((d) => row(`data-go="affaire-${d.id}"`, ico(KIND_ICON[d.kind], "s"), "", d.title, `${d.kind} · ${range(d.start, d.end)} · ${d.status === "Perdu" ? "Perdue" : STAGES[d.stage]}`)))
    + grp("Contacts", contacts().filter(({ c }) => hit(c.name, c.email, c.phone)).slice(0, 5).map(({ c, deals }) => row(`data-go="contact-${deals[0].id}"`, initials(c.name), "", c.name, `${c.email} · ${c.phone}`)))
    + grp("Documents", everyDoc().filter(({ x }) => hit(x.t)).slice(0, 6).map(({ x, ref, from }) => row(`data-doc="${ref}"`, BADGE[x.k], x.k, x.t, `${from} · ${fr(x.d)}`)));
  return `<div class="scrim" data-a="close-modal"></div>
    <div class="modal searchm" role="dialog" aria-modal="true" aria-label="Recherche">
      <div class="pbody"><input id="gq" class="inp" type="search" placeholder="Rechercher une affaire, un contact, un document" value="${esc(dval("gq"))}" aria-label="Rechercher partout">
        <div class="picklist">${q === "" ? `<p class="muted">Tapez un nom, un e-mail, un numéro de téléphone ou le titre d'un document.</p>` : found || `<p class="muted">Aucun résultat pour « ${esc(dval("gq"))} ».</p>`}</div></div>
      <footer><span class="hint">Entrée ouvre le premier résultat, Échap ferme</span></footer>
    </div>`;
}
// Fetch a missing document from everything already stored: unfiled Drive files first, then the
// documents of other deals. The ones whose name matches what is missing are listed on top.
function pickerModal() {
  if (S.modal !== "pick") return "";
  const r = ctx(), d = deal(r.id), sl = SLOTS.find((s) => s.key === S.pickSlot); if (!d || !sl) return "";
  const q = (S.draft["pick-q"] ?? "").toLowerCase();
  const pool = [...S.library.map((x, i) => ({ x, ref: `lib:${i}`, from: "Non classé" })), ...S.deals.filter((o) => o.id !== d.id).flatMap((o) => o.docs.map((x, i) => ({ x, ref: `deal:${o.id}:${i}`, from: o.title })))]
    .filter((it) => (it.x.t + " " + it.from).toLowerCase().includes(q))
    .map((it) => ({ ...it, hit: it.x.t.toLowerCase().includes(sl.hint) })).sort((a, b) => Number(b.hit) - Number(a.hit));
  return `<div class="scrim" data-a="close-modal"></div>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
      <header><h2 id="m-title">Récupérer : ${sl.label}</h2><button class="iconbtn" data-a="close-modal" aria-label="Fermer">${ico("close", "m")}</button></header>
      <div class="pbody"><input id="pick-q" class="inp" type="search" placeholder="Rechercher parmi tous les documents" value="${esc(S.draft["pick-q"] ?? "")}" aria-label="Rechercher un document">
        <div class="picklist">${pool.map((it) => `<button class="pick" data-pick="${it.ref}"><span class="kb ${it.x.k}">${BADGE[it.x.k]}</span><span class="grow"><b>${esc(it.x.t)}</b><small>${esc(it.from)} · ${fr(it.x.d)}</small></span>${it.hit ? `<span class="mini t-blue">Suggestion</span>` : ""}<span class="mini ${DOC_ST[it.x.st ?? "Brouillon"]}">${it.x.st ?? "Brouillon"}</span></button>`).join("") || `<p class="muted">Aucun document ne correspond.</p>`}</div></div>
      <footer><span class="hint">Le document choisi est rattaché à « ${esc(d.title)} ».</span><button class="btn alt" data-a="close-modal">Annuler</button></footer>
    </div>`;
}

/* ---------- Choosing a stay's dates on a calendar that shows what is taken ---------- */
function miniMonth(ym, p, exceptId) {
  const [y, m] = ym.split("-").map(Number), off = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7, days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const held = bookings(exceptId), cleaning = new Set();
  held.forEach((b) => { for (let k = 1; k <= S.buffer; k++) cleaning.add(addDays(b.end, k)); });
  let cells = "<span></span>".repeat(off);
  for (let n = 1; n <= days; n++) {
    const iso = `${ym}-${String(n).padStart(2, "0")}`, bk = held.find((b) => iso >= b.start && iso <= b.end), clean = !bk && cleaning.has(iso);
    const inSel = p.a && (p.b ? iso >= p.a && iso <= p.b : iso === p.a), edge = iso === p.a || iso === p.b;
    const state = bk ? `occupé par ${bk.title}` : clean ? "jour de ménage" : "libre";
    cells += `<button class="pd ${bk ? "taken " + bk.cls : clean ? "clean" : "free"} ${inSel ? "sel" : ""} ${edge ? "edge" : ""} ${iso === TODAY ? "today" : ""}" data-day="${iso}" ${bk ? "disabled" : ""} aria-label="${n} ${MONTHS[m - 1]} ${y}, ${esc(state)}">${n}</button>`;
  }
  return `<div class="pm"><h4>${MONTHS[m - 1]} ${y}</h4><div class="grid7 pdow">${["L", "M", "M", "J", "V", "S", "D"].map((x) => `<span>${x}</span>`).join("")}</div><div class="grid7 pgrid">${cells}</div></div>`;
}
// What the chosen range is worth: free, too close to another stay, or across one.
function pickVerdict(pd, a, b) {
  if (!a || !b) return { kind: "wait", text: a ? "Choisissez maintenant le jour de départ." : "Choisissez le jour d'arrivée, puis le jour de départ." };
  const taken = overlap(a, b, pd.id);
  if (taken) return { kind: "bad", text: `Ces dates chevauchent « ${taken.title} » (${range(taken.start, taken.end)}).` };
  const close = bufferClash(a, b, pd.id);
  if (close) return { kind: "warn", text: `Moins de ${S.buffer} jours de ménage avec « ${close.title} » (${range(close.start, close.end)}). Une confirmation sera demandée.`, close };
  return { kind: "ok", text: "Ces dates sont libres, ménage compris." };
}
function datesModal() {
  if (S.modal !== "dates" || !S.pick) return "";
  const p = S.pick, pd = deal(p.id); if (!pd) return "";
  const [y, m] = p.month.split("-").map(Number), next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7), last = new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10);
  const v = pickVerdict(pd, p.a, p.b);
  const around = bookings(pd.id).filter((b) => b.end >= p.month + "-01" && b.start <= last).sort((a, b) => (a.start < b.start ? -1 : 1));
  return `<div class="scrim" data-a="close-modal"></div>
    <div class="modal wide" role="dialog" aria-modal="true" aria-labelledby="m-title">
      <header><h2 id="m-title">Dates du séjour</h2><button class="iconbtn" data-a="close-modal" aria-label="Fermer">${ico("close", "m")}</button></header>
      <div class="pkbody">
        <div class="pknav"><button class="iconbtn" data-pm="-1" aria-label="Mois précédents">${ico("left", "m")}</button><div class="legend inline"><span class="mini lg-free">Libre</span><span class="mini t-green">Ferme</span><span class="mini t-orange">Option</span><span class="mini t-purple">Airbnb</span><span class="mini hatch">Ménage</span></div><button class="iconbtn" data-pm="1" aria-label="Mois suivants">${ico("right", "m")}</button></div>
        <div class="pmonths">${miniMonth(p.month, p, pd.id)}${miniMonth(next, p, pd.id)}</div>
        <div class="pkinfo"><div><b>${p.a && p.b ? `${range(p.a, p.b)} · ${nights(p.a, p.b)} nuits` : p.a ? `Arrivée le ${fr(p.a)}` : "Aucune date choisie"}</b><p class="verdict ${v.kind}" role="status">${esc(v.text)}</p></div>
          <div class="pkbusy"><span class="cap">Déjà pris sur ces deux mois</span>${around.map((b) => `<span class="busy"><i class="mini ${b.cls === "firm" ? "t-green" : b.cls === "option" ? "t-orange" : "t-purple"}">${b.cls === "firm" ? "Ferme" : b.cls === "option" ? "Option" : "Airbnb"}</i>${esc(b.title)}, ${range(b.start, b.end)}</span>`).join("") || `<span class="muted">Rien de réservé.</span>`}</div></div>
      </div>
      <footer><span class="hint">${esc(pd.title)} · ${HOLD[hold(pd)]}</span><button class="btn alt" data-a="close-modal">Annuler</button><button class="btn ${v.kind === "warn" ? "red" : ""}" data-a="dates-ok" ${v.kind === "ok" || v.kind === "warn" ? "" : "disabled"}>${v.kind === "warn" ? "Valider malgré le ménage" : "Valider ces dates"}</button></footer>
    </div>`;
}

/* ---------- New deal ---------- */
function newDealModal() {
  if (S.modal !== "new") return "";
  const v = (k) => esc(S.draft[k] ?? "");
  const opt = (k, list, dflt) => list.map((o) => `<option ${(S.draft[k] ?? dflt) === o ? "selected" : ""}>${o}</option>`).join("");
  return `<div class="scrim" data-a="close-modal"></div>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
      <header><h2 id="m-title">Nouvelle affaire</h2><button class="iconbtn" data-a="close-modal" aria-label="Fermer">${ico("close", "m")}</button></header>
      <div class="mbody">
        <label class="fld full"><span>Nom de l'affaire</span><input id="n-title" class="inp" value="${v("n-title")}" placeholder="Ex. Camille & Louis Martin"></label>
        <label class="fld full"><span>Note</span><textarea id="n-note" class="inp" rows="3" placeholder="Ce qu'on vous a dit au téléphone, à compléter plus tard. Aucun champ n'est obligatoire.">${v("n-note")}</textarea></label>
        <label class="fld"><span>Type</span><select id="n-kind" class="inp">${opt("n-kind", Object.keys(KIND), "Mariage")}</select></label>
        <label class="fld"><span>Source</span><select id="n-source" class="inp">${opt("n-source", SOURCES, "Site web")}</select></label>
        <label class="fld full"><span>Langue des documents</span><select id="n-lang" class="inp">${Object.entries(LANGS).map(([k, l]) => `<option value="${k}" ${(S.draft["n-lang"] ?? "fr") === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="fld"><span>Arrivée souhaitée</span><input id="n-start" class="inp" type="date" value="${v("n-start")}"></label>
        <label class="fld"><span>Départ souhaité</span><input id="n-end" class="inp" type="date" value="${v("n-end")}"></label>
        ${(() => { const a = S.draft["n-start"], b = S.draft["n-end"]; if (!a || !b || b < a) return ""; const taken = overlap(a, b), close = taken ? null : bufferClash(a, b);
          return taken ? `<p class="hint full warn">Ces dates sont déjà prises par « ${esc(taken.title)} ». La demande peut être créée, mais pas réservée.</p>` : close ? `<p class="hint full warn">Dates libres, mais à moins de ${S.buffer} jours de ménage de « ${esc(close.title)} ».</p>` : `<p class="hint full ok">Ces dates sont libres, ménage compris.</p>`; })()}
        <label class="fld"><span>Invités</span><input id="n-guests" class="inp" type="number" min="1" value="${v("n-guests")}" placeholder="40"></label>
        <label class="fld"><span>Couchages (22 au maximum)</span><input id="n-sleeping" class="inp" type="number" min="1" max="22" value="${v("n-sleeping")}" placeholder="22"></label>
        <label class="fld full"><span>Montant estimé, en euros</span><input id="n-amount" class="inp" type="number" min="0" step="50" value="${v("n-amount")}" placeholder="9000"></label>
        <h3 class="full">Contact</h3>
        <label class="fld"><span>Nom</span><input id="n-contact" class="inp" value="${v("n-contact")}"></label>
        <label class="fld"><span>Téléphone</span><input id="n-phone" class="inp" value="${v("n-phone")}"></label>
        <label class="fld full"><span>E-mail</span><input id="n-email" class="inp" type="email" value="${v("n-email")}"></label>
        ${S.modalErr ? `<p class="err full" role="alert">${esc(S.modalErr)}</p>` : ""}
      </div>
      <footer><button class="btn alt" data-a="close-modal">Annuler</button><button class="btn" data-a="create">Créer l'affaire</button></footer>
    </div>`;
}
function createDeal() {
  // Nothing is required: a request can be noted in a few seconds and completed later. A single date
  // given stands for both, and a deal without a name takes the contact's, or the start of the note.
  const g = (k) => (S.draft[k] ?? "").trim(), start = g("n-start") || g("n-end"), end = g("n-end") || g("n-start");
  const title = (g("n-title") || g("n-contact") || g("n-note").split("\n")[0].slice(0, 60) || "Nouvelle demande").slice(0, 80);
  if (start && end && end < start) return "Le départ doit suivre l'arrivée.";
  if (g("n-email") && !/^\S+@\S+\.\S+$/.test(g("n-email"))) return "Adresse e-mail invalide.";
  const guests = Number(g("n-guests") || 0), sleeping = Math.min(22, Number(g("n-sleeping") || Math.min(guests, 22))), note = g("n-note");
  const id = "n" + Date.now();
  const known = deal(S.draft["n-from"]);
  const contact = known ? known.contact : { name: g("n-contact") || title, email: g("n-email") || "à compléter", phone: g("n-phone") || "à compléter", address: "à compléter" };
  const d = mk(id, title, S.draft["n-kind"] ?? "Mariage", 0, Number(g("n-amount") || 0), start, end, guests, sleeping, S.draft["n-source"] ?? "Site web", contact, { signed: TODAY, emails: [], unread: {} });
  d.history = [{ type: "Modification", t: "Affaire créée", at: stamp(), by: me().name }];
  d.lang = LANGS[S.draft["n-lang"]] ? S.draft["n-lang"] : "fr";
  if (note) d.pinned.unshift({ t: "Note de la demande", body: note.slice(0, 2000), at: fr(TODAY), by: me().name });
  S.deals.unshift(d);
  S.modal = null; S.draft = {}; location.hash = "affaire-" + id;
  return "";
}

/* ---------- Conversations: e-mail and WhatsApp ---------- */
const REPLIES = {
  mail: ["Merci pour votre message, c'est bien noté de notre côté. Bien à vous.", "Parfait, nous revenons vers vous d'ici demain avec les éléments demandés.", "Bien reçu, merci beaucoup pour ces précisions."],
  wa: ["Super, merci !", "D'accord, c'est noté.", "Parfait, à très vite."],
};
function waTab(d) {
  return `<div class="wa"><header><span class="av">${initials(d.contact.name)}</span><div class="grow"><b>${esc(d.contact.name)}</b><small>${esc(d.contact.phone)} · WhatsApp Business</small></div></header>
    <div class="chat" id="chat">${d.wa.map((w) => `<div class="bub ${w.from === "me" ? "out" : ""}"><p>${esc(w.body)}</p><time>${esc(w.at)}${w.sim ? " · simulé" : ""}</time></div>`).join("") || `<span class="hint">Aucun message pour l'instant. Écrivez le premier.</span>`}</div>
    <div class="wainput"><input id="wa-body" class="inp" placeholder="Écrire un message" value="${esc(S.draft["wa-body"] ?? "")}" aria-label="Message WhatsApp"><button class="btn" data-a="wa-send" aria-label="Envoyer le message">${ico("send", "s")}</button></div></div>`;
}
// The prototype answers on the client's behalf a moment later, so a conversation can be tried out.
function simulateReply(d, channel, subject) {
  const arrive = () => {
    if (S.edit || S.payEdit || S.modal || S.menu) { setTimeout(arrive, 800); return; }
    const pool = REPLIES[channel], body = pool[(channel === "mail" ? d.emails.length : d.wa.length) % pool.length];
    if (channel === "mail") { d.emails.push({ from: "them", subject: subject.startsWith("Re: ") ? subject : "Re: " + subject, body, at: stamp(), sim: true }); log(d, "E-mail", `E-mail reçu de ${d.contact.name}`, body); d.unread.mail = true; }
    else { d.wa.push({ from: "them", body, at: stamp().slice(-5), sim: true }); log(d, "WhatsApp", `WhatsApp reçu de ${d.contact.name}`, body); d.unread.wa = true; }
    render();
  };
  setTimeout(arrive, 1600);
}

/* ---------- Rich text: one toolbar for the e-mail editor and for editable documents ---------- */
// Whatever comes out of an editable area goes through this list of allowed tags before it is
// stored or shown again: formatting only, no script, no style, no event attribute.
const RICH_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "A", "UL", "OL", "LI", "BR", "P", "DIV", "SPAN", "H1", "H2", "H3", "TABLE", "TBODY", "THEAD", "TR", "TD", "TH", "MARK", "SMALL"]);
function clean(html) {
  const t = document.createElement("template"); t.innerHTML = html;
  const walk = (node) => { [...node.children].forEach((el) => {
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META"].includes(el.tagName)) { el.remove(); return; }
    walk(el);
    if (!RICH_TAGS.has(el.tagName)) { el.replaceWith(...el.childNodes); return; }
    [...el.attributes].forEach((a) => { const keep = a.name === "class" || a.name === "colspan" || (a.name === "href" && el.tagName === "A" && /^(https?:|mailto:)/i.test(a.value)); if (!keep) el.removeAttribute(a.name); });
    if (el.tagName === "A") { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
  }); };
  walk(t.content); return t.innerHTML;
}
const textToHtml = (t) => t.split("\n\n").filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
const htmlText = (h) => { const t = document.createElement("div"); t.innerHTML = h.replace(/<\/(p|li|h3)>|<br>/g, "$&\n"); return t.textContent.replace(/\n{3,}/g, "\n\n").trim(); };
const rteBar = () => [["bold", "B", "Gras"], ["italic", "I", "Italique"], ["underline", "U", "Souligné"]].map(([c, l, t]) => `<button class="tb ${c}" data-cmd="${c}" title="${t}" aria-label="${t}">${l}</button>`).join("")
  + `<i class="tsep"></i><button class="tb" data-cmd="formatBlock" data-arg="h3" title="Titre" aria-label="Titre">T</button><button class="tb" data-cmd="insertUnorderedList" title="Liste à puces" aria-label="Liste à puces">${ico("list", "s")}</button><button class="tb" data-cmd="insertOrderedList" title="Liste numérotée" aria-label="Liste numérotée">1.</button><button class="tb" data-cmd="removeFormat" title="Effacer la mise en forme" aria-label="Effacer la mise en forme">${ico("close", "s")}</button>`;
let savedRange = null, mailRange = null;
// The toolbar keeps the caret where it is: pressing a button must not move focus out of the text.
document.addEventListener("mousedown", (e) => { if (e.target.closest("[data-cmd]") && !e.target.matches("input")) e.preventDefault(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-cmd]"); if (!b) return;
  const cmd = b.dataset.cmd, sel = getSelection(), box = b.closest(".rte").querySelector(".linkbox");
  if (cmd === "link") { savedRange = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null; box.hidden = !box.hidden; if (!box.hidden) box.querySelector("input").focus(); return; }
  if (cmd === "linkok") { const url = box.querySelector("input").value.trim(); box.hidden = true; box.querySelector("input").value = "";
    if (savedRange && /^(https?:\/\/|mailto:)\S+$/i.test(url)) { sel.removeAllRanges(); sel.addRange(savedRange); document.execCommand(savedRange.collapsed ? "insertHTML" : "createLink", false, savedRange.collapsed ? `<a href="${esc(url)}">${esc(url)}</a>` : url); } }
  else document.execCommand(cmd, false, b.dataset.arg ?? null);
  const area = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement)?.closest("[contenteditable]");
  if (area) area.dispatchEvent(new Event("input", { bubbles: true }));
});
// Pasted text arrives without the formatting of where it was copied from.
document.addEventListener("paste", (e) => { if (e.target.closest && e.target.closest("[contenteditable]")) { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); } });
const keepMailRange = (e) => { const box = document.getElementById("mail-body"), sl = getSelection(); if (box && e.target === box && sl.rangeCount && box.contains(sl.anchorNode)) mailRange = sl.getRangeAt(0).cloneRange(); };
for (const ev of ["keyup", "mouseup", "focusout"]) document.addEventListener(ev, keepMailRange);
document.addEventListener("selectionchange", () => { const s = getSelection(), box = document.getElementById("mail-body"); if (box && s.rangeCount && box.contains(s.anchorNode)) mailRange = s.getRangeAt(0).cloneRange(); });
function insertInMail(text) {
  const el = document.getElementById("mail-body"); if (!el) return; el.focus(); const s = getSelection();
  if (mailRange && el.contains(mailRange.startContainer)) { s.removeAllRanges(); s.addRange(mailRange); } else { s.selectAllChildren(el); s.collapseToEnd(); }
  document.execCommand("insertText", false, text); S.draft["mail-body"] = clean(el.innerHTML);
}

/* ---------- E-mail: templates and the deal's own information ---------- */
const signOff = () => `<p>Bien cordialement,<br>${esc(me().name)}<br>Les jardins de Campagne</p>`;
const firstName = (d) => d.contact.name.split(" ")[0];
const owed = (d) => income(d).filter((p) => p.status === "due").reduce((s, p) => s + p.amount, 0);
const MAIL_TPL = {
  "Réponse à une demande": (d) => [`Votre demande pour le ${range(d.start, d.end)}`, `<p>Bonjour ${esc(firstName(d))},</p><p>Merci pour votre message. Le domaine est <b>${overlap(d.start, d.end, d.id) ? "déjà réservé" : "libre"}</b> du ${range(d.start, d.end)}.</p><p>Pour avancer, je vous propose :</p><ul><li>une visite du domaine, en semaine ou le samedi matin ;</li><li>un devis détaillé sous 48 heures.</li></ul>`],
  "Envoi du devis": (d) => [`Votre devis, ${d.kind.toLowerCase()} du ${range(d.start, d.end)}`, `<p>Bonjour ${esc(firstName(d))},</p><p>Vous trouverez en pièce jointe notre devis de <b>${eur(d.amount)}</b> pour ${nights(d.start, d.end)} nuits et ${d.guests} invités.</p><p>Il est valable 30 jours. Les dates sont réservées dès la signature du contrat et le versement de l'acompte.</p>`],
  "Relance de paiement": (d) => { const p = income(d).find(late) ?? income(d).find((x) => x.status === "due"); return [`Rappel : ${p ? p.kind.toLowerCase() : "paiement"} pour votre séjour du ${range(d.start, d.end)}`, `<p>Bonjour ${esc(firstName(d))},</p><p>Sauf erreur de notre part, nous n'avons pas encore reçu ${p ? `${p.kind === "Acompte" ? "l'acompte" : "le " + esc(p.kind.toLowerCase())} de <b>${eur(p.amount)}</b>, attendu le ${fr(p.due)}` : "votre règlement"}.</p><p>Pouvez-vous nous indiquer la date de votre virement ?</p>`]; },
  "Informations d'arrivée": (d) => [`Votre arrivée au domaine le ${fr(d.start)}`, `<p>Bonjour ${esc(firstName(d))},</p><p>Nous vous attendons le <b>${longDay(d.start)} à partir de ${d.arrival}</b>.</p><ul><li>Remise des clés et état des lieux à l'arrivée.</li><li>Départ le ${longDay(d.end)} au plus tard à ${d.departure}.</li><li>${d.sleeping} couchages préparés.</li></ul>`],
};
const MAIL_VARS = { "Prénom": firstName, "Dates du séjour": (d) => range(d.start, d.end), "Montant": (d) => eur(d.amount), "Reste à payer": (d) => eur(owed(d)), "Heure d'arrivée": (d) => d.arrival, "Nombre d'invités": (d) => String(d.guests) };
function mailTab(d) {
  const last = d.emails[d.emails.length - 1];
  const subject = S.draft["mail-subject"] ?? (last ? (last.subject.startsWith("Re: ") ? last.subject : "Re: " + last.subject) : "");
  const pick = (id, label, first, list) => `<select id="${id}" class="inp sm auto" aria-label="${label}"><option value="">${first}</option>${list.map((o) => `<option>${o}</option>`).join("")}</select>`;
  return `<div class="thread" id="thread">${d.emails.map((e) => `<article class="mail ${e.from === "me" ? "out" : ""}">
      <header><span class="av">${e.from === "me" ? "JM" : initials(d.contact.name)}</span><div class="grow"><b>${e.from === "me" ? `${e.by ? "Agent " + esc(e.by) : esc(me().name)}, le Domaine` : esc(d.contact.name)}</b><small>${e.from === "me" ? "à " : ""}${esc(d.contact.email)}</small></div><time>${esc(e.at)}</time></header>
      <h4>${esc(e.subject)}</h4>${e.html ? `<div class="rich">${e.html}</div>` : `<p>${esc(e.body)}</p>`}${e.att ? `<span class="mini att">${ico("clip", "xs")}${esc(e.att)}</span>` : ""}${e.sim ? `<span class="mini">Réponse simulée</span>` : ""}</article>`).join("") || `<span class="hint">Aucun e-mail échangé avec ${esc(d.contact.name)} pour l'instant.</span>`}</div>
    <input id="mail-subject" class="inp" value="${esc(subject)}" placeholder="Objet" aria-label="Objet">
    <div class="editor"><div class="rte" role="toolbar" aria-label="Mise en forme du message">${rteBar()}<button class="tb" data-cmd="link" title="Lien" aria-label="Insérer un lien">${ico("link", "s")}</button><span class="linkbox" hidden><input class="inp sm" placeholder="https://" aria-label="Adresse du lien"><button class="btn sm" data-cmd="linkok">OK</button></span>
        <span class="sp"></span>${pick("mail-tpl", "Partir d'un modèle", "Modèles", Object.keys(MAIL_TPL))}${pick("mail-var", "Insérer une information de l'affaire", "Insérer", Object.keys(MAIL_VARS))}</div>
      <div id="mail-body" class="rich edit" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Message" data-ph="Écrire à ${esc(d.contact.name)}">${S.draft["mail-body"] ?? ""}</div></div>
    <div class="attach">${ico("clip", "s")}<select id="mail-att" class="inp" aria-label="Joindre un document de l'affaire"><option value="">Joindre un document de l'affaire</option>${d.docs.filter((x) => !x.admin || isAdmin()).map((x) => `<option ${S.draft["mail-att"] === x.t ? "selected" : ""}>${esc(x.t)}</option>`).join("")}</select></div>
    <div class="cfoot"><span class="hint">Envoyé depuis votre boîte Gmail, à ${esc(d.contact.email)}</span><button class="btn sm" data-a="mail-send">${ico("send", "s")}Envoyer</button></div>`;
}

/* ---------- Documents: what a deal needs at its stage, Pennylane, signature ---------- */
// A request only needs a quote. The contract joins at the option, the rest at the signature.
// A stay imported already signed never had its quote filed here: it is not asked for afterwards.
const slotsFor = (d) => SLOTS.filter((s) => (d.stage >= s.from && !(s.key === "devis" && d.src && d.stage >= 4)) || d.docs.some((x) => x.slot === s.key));
const stageDocNote = (d) => (d.stage < 2 ? "À cette étape, seul le devis est attendu. Le contrat s'ajoute à l'option ; les factures, la caution et l'assurance à la signature."
  : d.stage < 4 ? "Devis et contrat à ce stade. Les factures, la caution et l'assurance s'ajoutent à la signature." : "");
const newSlotDoc = (sl) => ({ t: sl.label, k: sl.k, d: TODAY, st: "Brouillon", slot: sl.key, ...(sl.k === "pl" ? { pl: { num: null, final: false } } : {}) });
const plNum = (kind) => `${kind}-2026-${String(++S.plSeq[kind]).padStart(3, "0")}`;
const SIGNABLE = new Set(["contrat", "devis", "caution"]);
const isSigned = (x) => (x.sig ? x.sig.state === "signed" : x.st === "Signé");
// The state that decides what the panel lets you do with a document.
const docMode = (x) => (x.url ? "file" : isSigned(x) ? "signed" : x.sig ? "signing" : x.fileId ? "file" : x.pl ? (x.pl.final ? "final" : "pldraft") : x.k === "gdoc" ? (inDraft(x) ? "edit" : "locked") : "file");
const quoteLines = (d) => { const q = quoteOf(d);
  return `<div class="qt"><div class="qh"><span>Prestation</span><span>Qté</span><span>Prix unitaire</span><span>Total</span><span></span></div>
    ${q.map((r, i) => `<div class="qr"><input id="ql-${i}-l" class="inp" value="${esc(r.l)}" placeholder="Prestation" aria-label="Prestation ${i + 1}"><input id="ql-${i}-q" class="inp" type="number" min="0" value="${r.q}" aria-label="Quantité, ligne ${i + 1}"><input id="ql-${i}-p" class="inp" type="number" min="0" step="10" value="${r.p}" aria-label="Prix unitaire, ligne ${i + 1}"><b class="num" id="qt-${i}">${eur(r.q * r.p)}</b><button class="iconbtn" data-qdel="${i}" aria-label="Retirer la ligne ${i + 1}" ${q.length > 1 ? "" : "disabled"}>${ico("close", "s")}</button></div>`).join("")}
    <div class="qf"><button class="link" data-a="q-add">+ Ajouter une ligne</button><span class="sp"></span><span>Total TTC</span><b class="num big" id="q-total">${eur(quoteTotal(q))}</b></div></div>`; };
function quoteTab(d) {
  const q = quoteOf(d), x = d.docs.find((y) => y.slot === "devis");
  const state = !x ? "Aucun devis pour l'instant." : x.pl && !x.pl.final ? "Devis en brouillon." : `Devis ${x.pl?.num ?? ""} ${isSigned(x) ? "accepté et signé" : "finalisé"}.`;
  return `<div class="qt">${q.map((r) => `<div class="er"><span class="grow"><b>${esc(r.l || "Ligne sans libellé")}</b><small class="num">${r.q} × ${eur(r.p)}</small></span><b class="num">${eur(r.q * r.p)}</b></div>`).join("")}
    <div class="qf"><span class="sp"></span><span>Total TTC</span><b class="num big">${eur(quoteTotal(q))}</b></div></div>
    <div class="cfoot"><span class="hint">${state} Les lignes se modifient dans le document, tant qu'il n'est pas finalisé.</span><button class="btn sm" data-a="quote-open">${x ? "Ouvrir le devis" : "Créer le devis"}</button></div>`;
}
// A deal opened from the calendar: its whole page, in a panel, with the same slide as documents.
function peekPanel() {
  if (!S.peek) return ""; const d = deal(S.peek); if (!d) return "";
  return `<div class="scrim fade ${S.peekOut ? "out" : ""}" data-a="peek-close"></div>
    <aside class="drawer wide peek ${S.peekOut ? "out" : ""}" role="dialog" aria-modal="true" aria-label="Fiche de l'affaire ${esc(d.title)}"><div class="peekbody">${viewAffaire(d.id, true)}</div></aside>`;
}
function closePeek() {
  if (!S.peek || S.peekOut) return;
  S.peekOut = true;
  setTimeout(() => { S.peek = null; S.peekOut = false; S.edit = S.payEdit = null; render(); }, PANEL_OUT_MS);
}
// The panel slides in from the right when it opens (CSS, on insertion) and slides back out before it
// is removed: closing first marks it as leaving, then drops it once the movement is over.
const PANEL_OUT_MS = 190;
function closePanel() {
  if (!S.preview || S.previewOut) return;
  S.previewOut = true;
  setTimeout(() => { S.preview = null; S.previewOut = false; S.docEdit = false; render(); }, PANEL_OUT_MS);
}
function previewPanel() {
  const cur = previewed(); if (!cur) return "";
  const { d, x, sheet } = cur, locked = Boolean(x.admin) && !isAdmin(), plain = !sheet && !locked, mode = plain ? docMode(x) : "";
  const slotFree = (k) => !d || !d.docs.some((y) => y !== x && y.slot === k), fixed = mode === "signed" || mode === "signing";
  // A Drive file takes the whole panel: its type and its deal were set by the import.
  const meta = plain && !x.url ? `<div class="dmeta"><label><span>Type de document</span><select class="inp" data-doctype aria-label="Type de document" ${fixed ? "disabled" : ""}><option value="">Autre document</option>${SLOTS.map((s) => `<option value="${s.key}" ${x.slot === s.key ? "selected" : ""} ${slotFree(s.key) ? "" : "disabled"}>${s.label}${slotFree(s.key) ? "" : " (déjà présent)"}</option>`).join("")}</select></label>
      <label><span>Affaire</span><select class="inp" data-docdeal aria-label="Affaire du document" ${fixed ? "disabled" : ""}><option value="">Non classé</option>${S.deals.map((o) => `<option value="${o.id}" ${d === o ? "selected" : ""}>${esc(o.title)}</option>`).join("")}</select></label></div>` : "";
  const paid = d && x.pl && (x.slot === "acompte" || x.slot === "solde") && d.payments.find((p) => p.id === (x.slot === "acompte" ? "dep" : "bal"))?.status === "paid";
  const say = (msg) => `data-a="doc-toast" data-msg="${esc(msg)}"`;
  const newer = d && plain && !inDraft(x) && SLOTS.some((sl) => sl.key === x.slot && sl.k === "gdoc") ? `<button class="btn alt" data-a="doc-newver" title="Garde ce document tel quel et repart d'un brouillon">Nouvelle version</button>` : "";
  const state = { "": "",
    edit: `<div class="dstate"><div class="rte" role="toolbar" aria-label="Mise en forme du document">${rteBar()}</div><span class="sp"></span><span>${x.body ? "Modifié à la main" : "Rempli depuis l'affaire"}, enregistré automatiquement</span>${x.body ? `<button class="link" data-a="doc-reset-body">Rétablir le modèle</button>` : ""}</div>`,
    pldraft: `<div class="dstate"><span class="mini t-teal">Facturation</span><span>Brouillon, pas encore numéroté. ${x.slot === "devis" ? "Modifiez les lignes ci-dessous." : "Le montant vient de l'échéancier, dans Finance."}</span></div>${x.slot === "devis" && d ? `<div class="dlines">${quoteLines(d)}<label class="hint"><input id="q-sync" type="checkbox" checked> À la finalisation, mettre aussi le montant de l'affaire à ce total</label></div>` : ""}`,
    final: `<div class="dstate"><span class="mini t-teal">Facturation</span><span><b>${esc(x.pl?.num ?? "")}</b> · finalisé, PDF non modifiable${paid ? " · " : ""}</span>${paid ? `<span class="mini t-green">Payée</span>` : ""}<span class="sp"></span>${x.slot === "devis" ? `<button class="link" data-a="quote-new">Nouvelle version</button>` : ""}<button class="link" ${say("Dans l'application : le document s'ouvre dans Pennylane.")}>Ouvrir dans Pennylane</button></div>`,
    signing: `<div class="dstate"><ol class="sigsteps"><li class="done">Figé en PDF</li><li class="done">Envoyé le ${esc(x.sig?.sentAt ?? "")}</li><li class="${x.sig?.opened ? "done" : ""}">${x.sig?.opened ? "Ouvert par le client" : "Pas encore ouvert"}</li><li>Signé</li></ol><span class="sp"></span><button class="link" data-a="sig-remind">Relancer</button><button class="link danger" data-a="sig-cancel">Retirer la demande</button></div>`,
    locked: `<div class="dstate"><span class="mini ${DOC_ST[x.st] ?? ""}">${esc(x.st)}</span><span>Ce document n'est plus un brouillon : il ne se modifie plus. ${x.st === "Signé" ? "Pour le changer, créez une nouvelle version." : "Repassez-le en brouillon pour le modifier, ou créez une nouvelle version."}</span></div>`,
    signed: `<div class="dstate"><span class="mini t-green">Signé</span><span>${x.sig ? `Signé électroniquement par ${esc(x.sig.by)} le ${esc(x.sig.at)}.` : "Document signé."} PDF verrouillé : il ne se modifie plus.</span></div>`,
    // A Drive file speaks for itself in its own viewer: no line above it.
    file: x.url ? "" : `<div class="dstate"><span class="mini">${BADGE[x.k]}</span><span>${x.k === "xls" ? "Tableur généré depuis l'affaire" : "Fichier importé"}, non modifiable ici.</span></div>` }[mode];
  const stampBox = mode === "signed" && x.sig ? `<div class="sigstamp">Signé électroniquement par ${esc(x.sig.by)} le ${esc(x.sig.at)}. Contresigné par le bailleur. Chaque signature est horodatée et jointe au PDF.</div>` : "";
  const body = locked ? `<div class="lockmsg">${ico("lock")}<b>Document réservé aux administrateurs</b><span>Il contient des numéros de pièce d'identité. Demandez à un administrateur de vous le transmettre.</span></div>`
    : `${x.admin ? `<div class="admnote">Document réservé aux administrateurs : il contient des numéros de pièce d'identité.</div>` : ""}<div class="paper ${x.k}" ${mode === "edit" ? `id="doc-edit" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Contenu du document"` : ""}>${sheet ? sheetBody(d) : docBody(d, x)}${stampBox}</div>`;
  const del = mode === "signing" || (mode === "signed" && !isAdmin()) ? "" : `<button class="btn alt danger" data-a="doc-del">${ico("trash", "s")}Supprimer</button>`;
  const pdf = `<button class="btn alt" data-a="doc-pdf">${ico("down", "s")}PDF</button>`, mail = (cls) => (d ? `<button class="btn ${cls}" data-a="doc-mail">${ico("mail", "s")}Envoyer</button>` : "");
  const sign = d && (SIGNABLE.has(x.slot) || !x.slot) ? `<button class="btn" data-a="sig-new">${ico("pen", "s")}Envoyer pour signature</button>` : "";
  const acts = sheet ? `<button class="btn" data-a="doc-print">Imprimer la fiche</button>` : locked ? "" : {
    edit: del + pdf + (sign ? mail("alt") + sign : mail("")),
    locked: del + newer + pdf + mail(""),
    pldraft: del + `<button class="btn" data-a="pl-final">Finaliser : numéroter et figer en PDF</button>`,
    final: del + pdf + (x.slot === "devis" && sign ? mail("alt") + sign : mail("")),
    signing: pdf + `<button class="btn" data-a="sig-view">Simuler la signature du client</button>`,
    signed: del + newer + pdf + mail("alt") + `<button class="btn" data-a="doc-open">Ouvrir dans Drive</button>`,
    file: del + (x.url ? `${newer}${driveLive(x) ? `<button class="btn alt" data-a="doc-bare" title="${S.docBare ? "Revenir à l'éditeur Google Docs complet" : "N'afficher que la page, sans barre d'outils ni onglets"}">${S.docBare ? "Éditeur complet" : "Page seule"}</button>` : ""}<a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener">Ouvrir dans Google Drive</a>` : x.fileId ? `<a class="btn" href="/api/files/${x.fileId}" target="_blank" rel="noopener">Ouvrir le fichier</a>` : pdf) }[mode];
  // A signed document keeps its status for good: the way on is a new version.
  const pill = mode === "pldraft" || mode === "final" || fixed || x.st === "Signé";
  return `<div class="scrim fade ${S.previewOut ? "out" : ""}" data-a="close-preview"></div>
    <aside class="drawer ${x.url && !sheet ? "wide" : ""} ${S.previewOut ? "out" : ""}" role="dialog" aria-modal="true" aria-label="Aperçu du document">
      <header><span class="kb ${x.k}">${BADGE[x.k]}</span><div class="grow">${S.docEdit && plain && !fixed && mode !== "final" ? `<div class="rename"><input id="doc-name" class="inp" value="${esc(x.t)}" aria-label="Nom du document"><button class="btn green sm" data-a="doc-rename-ok">Enregistrer</button></div>` : `<b>${esc(x.t)}${plain && !fixed && mode !== "final" ? `<button class="iconbtn inline" data-a="doc-rename" title="Renommer" aria-label="Renommer le document">${ico("pen", "s")}</button>` : ""}</b>`}<small>${KLBL[x.k]} · ${fr(x.d)} · ${d ? esc(d.title) : "Non classé"}</small></div>${plain ? (pill ? `<span class="tag ${DOC_ST[x.st ?? "Brouillon"]}">${x.st ?? "Brouillon"}</span>` : `<span class="status"><select data-docstatus aria-label="Statut du document">${Object.keys(DOC_ST).map((o) => `<option ${(x.st ?? "Brouillon") === o ? "selected" : ""}>${o}</option>`).join("")}</select></span>`) : ""}<button class="iconbtn" id="close-preview" data-a="close-preview" aria-label="Fermer l'aperçu">${ico("close", "m")}</button></header>
      ${meta}${state}
      <div class="stage">${body}</div>
      <footer><span class="msg" aria-live="polite">${esc(S.toast || (plain && x.did ? (x.gone ? "Ce document a été supprimé dans Google Drive." : !driveLive(x) ? "" : x.edited ? "Modifié dans Google Docs : il ne suit plus la fiche de l'affaire." : "Suit la fiche : il se met à jour quand l'affaire change.") : ""))}</span>${plain && x.did && x.edited && driveLive(x) && !x.gone ? `<button class="btn alt" data-a="doc-resync">Remettre à jour depuis la fiche</button>` : ""}${acts}</footer>
    </aside>`;
}
function sigReqModal() {
  if (S.modal !== "sigreq") return ""; const cur = previewed(); if (!cur || !cur.d) return "";
  const { d, x } = cur, who = d.tenants.filter(Boolean);
  return shell("Envoyer pour signature", `<p class="full"><b>${esc(x.t)}</b> sera envoyé à ${esc(d.contact.email)}. ${who.length > 1 ? "Signataires" : "Signataire"} : ${who.map(esc).join(" et ")}, puis contresignature du bailleur.</p>
    <label class="fld full"><span>Message d'accompagnement</span><input id="sg-msg" class="inp" value="${esc(dval("sg-msg"))}"></label>
    <p class="hint full warn">${x.k === "pdf" ? "Le PDF part tel quel." : "Le document est d'abord figé en PDF : une fois envoyé, il ne se modifie plus. Pour le corriger, il faudra retirer la demande."}</p>`,
    `<button class="btn" data-a="sig-send">${x.k === "pdf" ? "Envoyer pour signature" : "Figer en PDF et envoyer"}</button>`, "top");
}
function signModal() {
  if (S.modal !== "sign") return ""; const cur = previewed(); if (!cur || !cur.d || !cur.x.sig) return "";
  const { d, x } = cur;
  return `<div class="scrim top" data-a="close-modal"></div>
    <div class="modal wide top" role="dialog" aria-modal="true" aria-labelledby="m-title">
      <header><h2 id="m-title">Ce que voit le signataire</h2><button class="iconbtn" data-a="close-modal" aria-label="Fermer">${ico("close", "m")}</button></header>
      <div class="signview"><div class="signdoc"><div class="paper pdf">${docBody(d, x)}</div></div>
        <aside class="signside"><span class="mini t-orange">Simulation</span><b>${esc(x.t)}</b>
          <p class="muted">Le client reçoit un lien par e-mail (${esc(d.contact.email)}), lit le document, saisit son nom et signe. La signature est horodatée et le PDF signé revient dans l'affaire.</p>
          <label class="fld"><span>Nom du signataire</span><input id="sg-name" class="inp" value="${esc(dval("sg-name", d.tenants.filter(Boolean).join(" et ")))}"></label>
          <label class="hint"><input id="sg-ok" type="checkbox"> J'ai lu et j'accepte ce document</label>
          ${S.modalErr ? `<p class="err" role="alert">${esc(S.modalErr)}</p>` : ""}
          <button class="btn green" data-a="sig-done">Signer le document</button></aside></div>
    </div>`;
}

/* ---------- Open Space: agents, each with one job, on a canvas ---------- */
const TOOLS = { gmail: ["Gmail", "mail"], wa: ["WhatsApp", "send"], bank: ["Banque", "bank"], penny: ["Pennylane", "euro"], cal: ["Calendrier", "cal"], docs: ["Documents", "doc"] };
const TRIGGERS = ["À la demande", "À chaque nouvel e-mail", "Chaque matin à 9 h", "À chaque changement d'étape", "À chaque nouveau relevé bancaire"];
const AGENT_KINDS = {
  accueil: { name: "Accueil", icon: "mail", role: "Répond aux nouvelles demandes", mission: "Lire chaque nouvelle demande, vérifier si les dates sont libres et préparer une réponse avec une proposition de visite.", trigger: TRIGGERS[1], tools: ["gmail", "cal"], hue: "blue" },
  relances: { name: "Relances", icon: "bell", role: "Suit les paiements en retard", mission: "Repérer les échéances dépassées et préparer un rappel courtois au locataire.", trigger: TRIGGERS[2], tools: ["bank", "gmail"], hue: "orange" },
  dossiers: { name: "Dossiers", icon: "folder", role: "Prépare les documents", mission: "Vérifier que chaque affaire a les documents attendus à son étape et préparer les brouillons qui manquent.", trigger: TRIGGERS[3], tools: ["docs", "penny"], hue: "purple" },
  banque: { name: "Rapprochement", icon: "bank", role: "Rapproche la banque", mission: "Retrouver sur le relevé les paiements attendus et les marquer comme reçus.", trigger: TRIGGERS[4], tools: ["bank", "penny"], hue: "green" },
  options: { name: "Options", icon: "clock", role: "Surveille les options", mission: "Prévenir avant qu'une option n'expire et demander au client de confirmer.", trigger: TRIGGERS[2], tools: ["cal", "wa"], hue: "teal" },
  libre: { name: "Agent libre", icon: "star", role: "Mission à écrire", mission: "", trigger: TRIGGERS[0], tools: [], hue: "blue" },
};
const HUE = { blue: "#2F80ED", orange: "#F2994A", purple: "#BB6BD9", green: "#27AE60", teal: "#0E8F8F" };
const SPOTS = [[200, 52], [456, 76], [200, 248], [456, 272], [200, 444], [456, 468]];
const mkAgent = (kind, i, extra = {}) => { const k = AGENT_KINDS[kind]; return { id: "ag" + i + Date.now().toString(36), kind, name: k.name, role: k.role, mission: k.mission, trigger: k.trigger, tools: [...k.tools], hue: k.hue, mode: "propose", paused: false, busy: false, log: [], x: SPOTS[i % SPOTS.length][0], y: SPOTS[i % SPOTS.length][1], ...extra }; };
S.agents = [];
const selAgent = () => S.agents.find((a) => a.id === S.agentSel) ?? null;
// What an agent would do right now, read from the deals themselves. Each finding carries the
// action it would take, so validating it really changes the deal.
function agentFinds(a) {
  const out = [], push = (key, t, sub, run) => { const k = a.id + key; if (!S.ignored.has(k) && !S.props.some((p) => p.key === k)) out.push({ key: k, agent: a.id, t, sub, run }); };
  const mailOut = (d, [subject, html]) => { const text = htmlText(html); d.emails.push({ from: "me", subject, body: text, html: html + signOff(), at: stamp(), by: a.name }); log(d, "E-mail", `E-mail envoyé par l'agent ${a.name} : ${subject}`, text); };
  if (a.kind === "accueil") live().filter((d) => d.unread.mail && d.stage === 0).forEach((d) => { const taken = overlap(d.start, d.end, d.id);
    push("rep" + d.id, `Répondre à ${d.contact.name}`, `${d.title} · dates ${taken ? "déjà prises : proposer d'autres week-ends" : "libres : proposer une visite et un devis"}`, () => { mailOut(d, MAIL_TPL["Réponse à une demande"](d)); d.unread.mail = false; return `a répondu à ${d.contact.name}`; }); });
  if (a.kind === "relances") live().forEach((d) => income(d).filter(late).forEach((p) => push("late" + d.id + p.id, `Relancer ${d.contact.name} : ${p.kind.toLowerCase()} de ${eur(p.amount)}`, `${d.title} · en retard depuis le ${fr(p.due)}`, () => { mailOut(d, MAIL_TPL["Relance de paiement"](d)); return `a relancé ${d.contact.name} pour ${p.kind === "Acompte" ? "l'acompte" : "le " + p.kind.toLowerCase()}`; })));
  if (a.kind === "dossiers") live().filter((d) => d.stage >= 2 && d.stage <= 4).forEach((d) => { const miss = slotsFor(d).filter((sl) => sl.k !== "pdf" && !d.docs.some((x) => x.slot === sl.key)); if (!miss.length) return;
    push("docs" + d.id + d.stage, `Préparer ${miss.length} document${miss.length > 1 ? "s" : ""} pour ${d.title}`, miss.map((s) => s.label).join(", "), () => { miss.forEach((sl) => { if (!d.docs.some((x) => x.slot === sl.key)) d.docs.push(newSlotDoc(sl)); }); log(d, "Document", `Brouillons préparés par l'agent ${a.name} : ${miss.map((s) => s.label).join(", ")}`); return `a préparé ${miss.length} brouillon${miss.length > 1 ? "s" : ""} pour ${d.title}`; }); });
  if (a.kind === "banque") { const n = live().flatMap((d) => income(d).filter((p) => !p.bank && S.bankStatement.some((t) => !t.used && t.amount === p.amount))).length;
    if (n) push("bank" + n, `Rapprocher ${n} paiement${n > 1 ? "s" : ""} avec le relevé`, "Même montant et nom du locataire dans le libellé du virement", () => { live().filter((d) => d.payments.length).forEach(syncBank); S.sync = ""; return "a relu le relevé et rapproché les paiements retrouvés"; }); }
  if (a.kind === "options") live().filter((d) => (d.stage === 2 || d.stage === 3) && dayDiff(TODAY, d.optionUntil) <= 21).forEach((d) => push("opt" + d.id + d.optionUntil, `Demander à ${d.contact.name} de confirmer son option`, `${d.title} · option jusqu'au ${fr(d.optionUntil)}`, () => { const body = `Bonjour ${firstName(d)}, votre option pour le ${range(d.start, d.end)} se termine le ${fr(d.optionUntil)}. Souhaitez-vous la confirmer ?`; d.wa.push({ from: "me", body, at: stamp().slice(-5) }); log(d, "WhatsApp", `WhatsApp envoyé par l'agent ${a.name}`, body); return `a écrit à ${d.contact.name} pour son option`; }));
  return out;
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function runAgent(a) {
  if (a.paused || a.busy) return; a.busy = true; render();
  setTimeout(() => { a.busy = false; const found = agentFinds(a);
    if (!found.length) a.log.unshift({ t: a.kind === "libre" ? "A relu sa mission : aucune action automatique n'est encore branchée" : "A tout vérifié : rien à signaler", at: stamp() });
    else if (a.mode === "auto") found.forEach((p) => a.log.unshift({ t: cap(p.run()), at: stamp() }));
    else { S.props.push(...found); a.log.unshift({ t: `${found.length} proposition${found.length > 1 ? "s" : ""} à valider`, at: stamp() }); }
    if (route().name === "openspace" && !S.modal) render(); }, 1400);
}
// Wires from each source to the agents that use it. Redrawn while a card is being dragged.
function drawWires() {
  const svg = document.getElementById("wires"); if (!svg) return;
  const src = Object.keys(TOOLS);
  svg.innerHTML = S.agents.flatMap((a) => a.tools.map((k) => { const y1 = 56 + src.indexOf(k) * 76 + 22, x1 = 156, x2 = a.x - 1, y2 = a.y + 35, mid = (x1 + x2) / 2, on = a.id === S.agentSel;
    return `<path class="${a.busy ? "live" : ""}" d="M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}" fill="none" stroke="${HUE[a.hue]}" stroke-width="${on || a.busy ? 2.2 : 1.4}" stroke-opacity="${a.paused ? 0.15 : on || a.busy ? 0.95 : 0.38}" stroke-linecap="round"/>`; })).join("");
}
const agentCard = (a) => `<article class="agent h-${a.hue} ${S.agentSel === a.id ? "sel" : ""} ${a.paused ? "paused" : ""} ${a.busy ? "busy" : ""}" data-agent="${a.id}" style="left:${a.x}px;top:${a.y}px" aria-label="Agent ${esc(a.name)}">
    <header data-drag="${a.id}" title="Glisser pour déplacer"><span class="aav">${ico(AGENT_KINDS[a.kind].icon, "m")}</span><span class="grow"><b>${esc(a.name)}</b><small>${esc(a.role)}</small></span><span class="adot" title="${a.paused ? "En pause" : a.busy ? "Au travail" : "Actif"}"></span></header>
    <p class="alast">${a.busy ? "Au travail : lit les affaires" : a.paused ? "En pause" : esc(a.log[0]?.t ?? "Pas encore lancé")}</p>
    <div class="atools">${a.tools.map((k) => `<span class="mini">${TOOLS[k][0]}</span>`).join("")}<span class="mini ${a.mode === "auto" ? "t-green" : "t-blue"}">${a.mode === "auto" ? "Agit seul" : "Propose"}</span></div>
    <footer><button class="btn alt sm" data-agent-open="${a.id}">Régler</button><button class="btn sm" data-agent-run="${a.id}" ${a.paused || a.busy ? "disabled" : ""}>${ico("send", "s")}Lancer</button></footer></article>`;
function viewOpenSpace() {
  const a = selAgent(), active = S.agents.filter((x) => !x.paused).length, done = S.agents.reduce((s, x) => s + x.log.length, 0);
  const props = S.props.map((p) => { const ag = S.agents.find((x) => x.id === p.agent); return `<article class="prop h-${ag ? ag.hue : "blue"}"><div><b>${esc(p.t)}</b><small>${esc(p.sub)}</small><small>Proposé par l'agent ${esc(ag ? ag.name : "supprimé")}</small></div><div class="pacts"><button class="btn green sm" data-prop-ok="${p.key}">Valider</button><button class="btn alt sm" data-prop-no="${p.key}">Ignorer</button></div></article>`; }).join("");
  const dock = a ? `<div class="dhead h-${a.hue}"><span class="aav">${ico(AGENT_KINDS[a.kind].icon, "m")}</span><div class="grow"><input id="ag-name" class="inp" value="${esc(a.name)}" aria-label="Nom de l'agent"></div><button class="iconbtn" data-a="agent-close" aria-label="Fermer les réglages de l'agent">${ico("close", "m")}</button></div>
      <label class="fld"><span>Mission</span><textarea id="ag-mission" class="inp area" placeholder="Décrivez en une ou deux phrases ce que l'agent doit faire">${esc(a.mission)}</textarea></label>
      <label class="fld"><span>Déclencheur</span><select id="ag-trigger" class="inp">${TRIGGERS.map((o) => `<option ${a.trigger === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>
      <div class="fld"><span>Outils auxquels il a accès</span><div class="chips">${Object.keys(TOOLS).map((k) => `<button class="tchip ${a.tools.includes(k) ? "on" : ""}" data-tool="${k}" aria-pressed="${a.tools.includes(k)}">${TOOLS[k][0]}</button>`).join("")}</div></div>
      <div class="fld"><span>Autonomie</span><div class="seg full" role="group" aria-label="Autonomie"><button class="${a.mode === "propose" ? "on" : ""}" data-a="agent-mode" data-mode="propose">Propose, vous validez</button><button class="${a.mode === "auto" ? "on" : ""}" data-a="agent-mode" data-mode="auto">Agit seul</button></div></div>
      <div class="arow"><button class="btn sm" data-agent-run="${a.id}" ${a.paused || a.busy ? "disabled" : ""}>${ico("send", "s")}Lancer</button><button class="btn alt sm" data-a="agent-pause">${a.paused ? "Réactiver" : "Mettre en pause"}</button><button class="btn alt sm danger" data-a="agent-del">${ico("trash", "s")}Supprimer</button></div>
      <h4>Journal</h4>${a.log.length ? `<ol class="alog">${a.log.slice(0, 8).map((l) => `<li><b>${esc(l.t)}</b><small>${esc(l.at)}</small></li>`).join("")}</ol>` : `<span class="muted">Cet agent n'a encore rien fait.</span>`}`
    : `<h3>À valider <span class="count num">${S.props.length}</span></h3>${props || `<p class="muted">Rien à valider. Lancez un agent : il lit les affaires et propose ici ce qu'il ferait.</p>`}${S.props.length > 1 ? `<button class="btn alt sm" data-a="props-all">Tout valider</button>` : ""}
      <p class="docnote">Un agent réglé sur « Propose » ne fait rien sans votre accord. Réglé sur « Agit seul », il exécute et l'écrit dans son journal et dans l'historique de l'affaire.</p>`;
  return topbar("Open Space", `<button class="btn alt" data-a="agents-run">${ico("send", "s")}Lancer tous les agents</button><button class="btn" data-a="agent-new">${ico("spark", "s")}Créer un agent</button>`, "", "Chaque agent a une mission. Il propose, vous validez.")
    + `<div class="ospace"><div class="omain"><div class="ostats"><span class="tag"><b class="num">${S.agents.length}</b> agent${S.agents.length > 1 ? "s" : ""}</span><span class="tag t-green"><b class="num">${active}</b> actif${active > 1 ? "s" : ""}</span><span class="tag ${S.props.length ? "t-orange" : ""}"><b class="num">${S.props.length}</b> à valider</span><span class="tag"><b class="num">${done}</b> action${done > 1 ? "s" : ""} au journal</span></div>
      <div class="oscroll"><div class="ocanvas" id="ocanvas"><svg class="wires" id="wires" aria-hidden="true"></svg><span class="olane" style="left:24px">Sources</span><span class="olane" style="left:202px">Agents</span>
        ${Object.keys(TOOLS).map((k, i) => `<div class="osrc" style="top:${56 + i * 76}px">${ico(TOOLS[k][1], "s")}<span>${TOOLS[k][0]}</span></div>`).join("")}${S.agents.map(agentCard).join("")}</div></div>
      <p class="docnote">Glissez une carte pour ranger votre open space. Les traits montrent les outils que chaque agent utilise.</p></div>
      <aside class="odock" aria-label="${a ? "Réglages de l'agent" : "Propositions à valider"}">${dock}</aside></div>`;
}
function agentModal() {
  if (S.modal !== "agent") return "";
  return shell("Créer un agent", `<div class="fld full"><span>Partir d'un rôle</span><div class="kgal">${Object.entries(AGENT_KINDS).map(([k, v]) => `<button class="kcard h-${v.hue} ${dval("an-kind") === k ? "on" : ""}" data-kind="${k}"><span class="aav">${ico(v.icon, "m")}</span><b>${v.name}</b><small>${v.role}</small></button>`).join("")}</div></div>
    <label class="fld full"><span>Nom de l'agent</span><input id="an-name" class="inp" value="${esc(dval("an-name"))}" placeholder="Ex. Accueil des mariages"></label>
    <label class="fld full"><span>Sa mission, en une ou deux phrases</span><textarea id="an-mission" class="inp area" placeholder="Ex. Envoyer les informations d'arrivée une semaine avant chaque séjour.">${esc(dval("an-mission"))}</textarea></label>
    <label class="fld full"><span>Déclencheur</span><select id="an-trigger" class="inp">${opts("an-trigger", TRIGGERS, TRIGGERS[0])}</select></label>
    <p class="hint full">L'agent est créé en mode « Propose » : il ne fait rien sans votre accord. Ses outils et son autonomie se règlent ensuite sur sa carte.</p>`,
    `<button class="btn" data-a="agent-add">Créer l'agent</button>`);
}
let drag = null, justDragged = false;
document.addEventListener("pointerdown", (e) => { const h = e.target.closest ? e.target.closest("[data-drag]") : null; if (!h || e.button) return;
  const a = S.agents.find((x) => x.id === h.dataset.drag); if (a) drag = { a, sx: e.clientX, sy: e.clientY, ox: a.x, oy: a.y, el: h.closest(".agent"), moved: false }; });
document.addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return; drag.moved = true;
  const box = document.getElementById("ocanvas"), W = box ? box.clientWidth : 900, H = box ? box.clientHeight : 660;
  drag.a.x = Math.round(Math.max(180, Math.min(W - 246, drag.ox + dx))); drag.a.y = Math.round(Math.max(44, Math.min(H - 180, drag.oy + dy)));
  drag.el.style.left = drag.a.x + "px"; drag.el.style.top = drag.a.y + "px"; drag.el.classList.add("dragging"); drawWires(); });
document.addEventListener("pointerup", () => { if (!drag) return; if (drag.moved) { drag.el.classList.remove("dragging"); justDragged = true; setTimeout(() => { justDragged = false; }, 0); } drag = null; });

/* ---------- Season view: the estate's own 2027 planning, read from its spreadsheet, as a trial ---------- */
// One entry per coloured block of the sheet. k is the sheet's colour: resa (pink), autre (orange,
// "Autres" in its legend), vert (green, meaning still to be confirmed), famille (grey).
// The stays of the season on screen: deals from the option on, then the imported calendars.
let REAL27 = [];
const seasonKind = (d) => ({ Mariage: "resa", Séjour: "vert", Famille: "famille" }[d.kind] ?? "autre");
function seasonItems() {
  const y = S.month.slice(0, 4), a = `${y}-04-01`, b = `${y}-10-31`;
  return [...live().filter((d) => d.stage >= 2 && d.end >= a && d.start <= b).map((d) => ({ id: d.id, n: d.title, a: d.start, b: d.end, g: d.guests, tag: d.kind, k: seasonKind(d), opt: d.stage < 4 })),
    ...S.feeds.map((f, i) => ({ ext: i, n: f.title, a: f.start, b: f.end, k: "famille" })).filter((f) => f.b >= a && f.a <= b)].sort((p, q) => (p.a < q.a ? -1 : 1));
}
const seasonMonths = () => ["04", "05", "06", "07", "08", "09", "10"].map((m) => `${S.month.slice(0, 4)}-${m}`);
const REAL_KIND = { resa: "Mariage", vert: "Séjour", autre: "Autre événement", famille: "Famille ou calendrier importé" };
// Full days between a departure and the next arrival: 0 when the next guests arrive the day after.
const realGaps = () => REAL27.map((r, i) => (i ? dayDiff(REAL27[i - 1].b, r.a) - 1 : null));
const span = (a, b) => (a === b ? longDay(a) : range(a, b));
const calSeg = () => `<div class="seg" role="group" aria-label="Vue du calendrier"><button class="${S.calView === "month" ? "on" : ""}" data-calview="month">${ico("cal", "s")}Mois</button><button class="${S.calView === "year" ? "on" : ""}" data-calview="year">${ico("grid", "s")}Année</button><button class="${S.calView === "season" ? "on" : ""}" data-calview="season">${ico("list", "s")}Frise</button></div>`;
function viewSeason() {
  REAL27 = seasonItems();
  const SEASON = seasonMonths(), gaps = realGaps(), busy = new Set(), first = SEASON[0] + "-01", last = SEASON[6] + "-31";
  REAL27.forEach((r) => { for (let t = r.a; t <= r.b; t = addDays(t, 1)) busy.add(t); });
  const free = []; let run = null;
  for (let t = first; t <= last; t = addDays(t, 1)) { if (!busy.has(t)) { run = run ?? { a: t, b: t }; run.b = t; } else if (run) { free.push(run); run = null; } }
  if (run) free.push(run);
  const turns = gaps.filter((g) => g !== null), tight = turns.filter((g) => g < S.buffer).length, zero = turns.filter((g) => g === 0).length;
  const total = dayDiff(first, last) + 1, guests = REAL27.reduce((s, r) => s + (r.g ?? 0), 0);
  // The part of [a, b] that falls in a month, as grid columns (one column per day of the month).
  const seg = (a, b, ym, days) => { const f = ym + "-01", l = `${ym}-${String(days).padStart(2, "0")}`; if (b < f || a > l) return null; return { c1: Number((a < f ? f : a).slice(8)), c2: Number((b > l ? l : b).slice(8)) + 1, contL: a < f, contR: b > l }; };
  const row = (ym) => { const [y, m] = ym.split("-").map(Number), days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = Array.from({ length: 31 }, (_, k) => { if (k + 1 > days) return `<span class="sc void"></span>`; const wd = new Date(Date.UTC(y, m - 1, k + 1)).getUTCDay(); return `<span class="sc ${wd === 0 || wd === 6 ? "we" : ""}">${"DLMMJVS"[wd]}</span>`; }).join("");
    const holes = free.map((f) => { const g = seg(f.a, f.b, ym, days); if (!g) return ""; const len = dayDiff(f.a, f.b) + 1, w = g.c2 - g.c1;
      return `<button class="sfree" style="grid-column:${g.c1}/${g.c2}" data-newday="${f.a < ym + "-01" ? ym + "-01" : f.a}" title="Libre : ${span(f.a, f.b)}, ${len} jour${len > 1 ? "s" : ""}. Cliquez pour créer une affaire." aria-label="Libre : ${span(f.a, f.b)}, créer une affaire">${w >= 3 ? `Libre · ${len} j` : w === 2 ? `${len} j` : ""}</button>`; }).join("");
    const bars = REAL27.map((r, i) => { const g = seg(r.a, r.b, ym, days); if (!g) return ""; const sub = [r.g ? r.g + " pers" : "", r.tag ?? ""].filter(Boolean).join(" · ");
      return `<button class="sbar k-${r.k ?? "resa"} ${r.opt ? "opt" : ""} ${!g.contL && gaps[i] !== null && gaps[i] < S.buffer ? "tight" : ""} ${g.contL ? "contl" : ""} ${g.contR ? "contr" : ""}" style="grid-column:${g.c1}/${g.c2}" ${r.id ? `data-go="affaire-${r.id}"` : `data-ext="${r.ext}"`} title="${esc(r.n)}, ${range(r.a, r.b)}${sub ? ", " + esc(sub) : ""}"><span><b>${g.contL ? "‹ " : ""}${esc(r.n)}${g.contR ? " ›" : ""}</b><small>${esc(sub) || "&nbsp;"}</small></span></button>`; }).join("");
    const occ = [...busy].filter((t) => t.startsWith(ym)).length;
    return `<div class="srow"><button class="smon" data-seemonth="${ym}" title="Voir ${MONTHS[m - 1]} en détail"><b>${MONTHS[m - 1]}</b><small class="num">${occ} jours sur ${days}</small></button><div class="sgrid"><div class="scells">${cells}</div><div class="sbars">${holes}${bars}</div></div></div>`; };
  const sw = (k) => `<span class="sleg1"><i class="swatch k-${k}"></i>${REAL_KIND[k]}</span>`;
  return topbar("Calendrier des réservations", calSeg() + `<button class="btn" data-a="new">${ico("cal", "s")}Nouvelle réservation</button>`, "", `Saison ${S.month.slice(0, 4)}, d'avril à octobre`)
    + `<div class="content"><div class="monthnav"><button class="iconbtn" data-year="-1" aria-label="Année précédente">${ico("left", "m")}</button><span class="lbl">${S.month.slice(0, 4)}</span><button class="iconbtn" data-year="1" aria-label="Année suivante">${ico("right", "m")}</button></div>
      <div class="ostats"><span class="tag"><b class="num">${REAL27.length}</b> séjour${REAL27.length > 1 ? "s" : ""}</span><span class="tag"><b class="num">${busy.size}</b> jours occupés sur ${total} (${Math.round(busy.size / total * 100)} %)</span><span class="tag"><b class="num">${guests}</b> invités annoncés</span><span class="tag ${tight ? "t-orange" : "t-green"}"><b class="num">${tight}</b> enchaînement${tight > 1 ? "s" : ""} à moins de ${S.buffer} jours, dont ${zero} le lendemain d'un départ</span></div>
      <div class="sleg">${Object.keys(REAL_KIND).map(sw).join("")}<span class="sleg1"><i class="swatch k-autre opt"></i>À confirmer</span><span class="sleg1"><i class="dia"></i>Arrivée à moins de ${S.buffer} jours du départ précédent</span><span class="sleg1"><i class="swatch freesw"></i>Libre, cliquable</span></div>
      <div class="scrollx"><div class="inner season"><div class="shead"><span></span><div class="snums num">${Array.from({ length: 31 }, (_, k) => `<span>${k + 1}</span>`).join("")}</div></div>${SEASON.map(row).join("")}</div></div>
      <p class="docnote">Une ligne par mois, une colonne par jour : la lettre est le jour de la semaine, les week-ends sont grisés. Cliquez sur un séjour pour son détail, sur un créneau libre pour créer une affaire.</p></div>`;
}

/* ---------- Router and events ---------- */
const PAGES = ["connexion", "openspace", "affaires", "reservations", "contacts", "documents", "audit", "messages", "taches", "statistiques", "reglages"];
// The deal a click or a field belongs to: the one of the page, or the one shown in the panel opened
// from the calendar. Drawing the page still follows the address alone (route).
function ctx() { return S.peek && deal(S.peek) ? { name: "affaire", id: S.peek } : route(); }
function route() {
  const h = (location.hash || "#affaires").slice(1);
  if (h.startsWith("affaire-")) return { name: "affaire", id: h.slice(8) };
  if (h.startsWith("contact-")) return { name: "contact", id: h.slice(8) };
  if (h.startsWith("connexion")) return { name: "connexion" };
  return { name: PAGES.includes(h) ? h : "affaires" };
}
const VIEWS = { affaire: (r) => viewAffaire(r.id), contact: (r) => viewContact(r.id), affaires: viewAffaires, reservations: viewReservations, contacts: viewContacts, documents: viewDocuments, messages: viewMessages, taches: viewTasks, statistiques: viewStats, reglages: viewSettings, openspace: viewOpenSpace, audit: viewAudit };
// The whole page is redrawn after each action. What is being typed lives in S (S.q, S.draft), so
// a redraw never loses it, and the caret goes back where it was.
let shownModal = null;
// Where signing out leads. Signing in is Google's own screen, so nothing is typed here.
function viewLogin() {
  return `<div class="login"><div class="card logincard"><div class="biglogo" aria-hidden="true">J</div><h1>Les jardins de Campagne</h1><p class="muted">Affaires, réservations, documents et encaissements du domaine.</p>
    ${S.loginErr ? `<p class="err" role="alert">Connexion refusée : ${esc(S.loginErr)}.</p>` : ""}
    <a class="btn" href="/auth/google">Se connecter avec Google</a><p class="help">Seules les adresses invitées peuvent entrer.</p></div></div>`;
}
function render() {
  const a = document.activeElement, keep = a && a.id ? { id: a.id, start: a.selectionStart, end: a.selectionEnd } : null;
  const r = route();
  if (r.name === "connexion" || !S.user) { document.getElementById("app").className = "app"; document.getElementById("app").innerHTML = viewLogin(); shownModal = null; return; }
  const active = r.name === "affaire" ? "affaires" : r.name === "contact" ? "contacts" : r.name;
  // The page first: opening a conversation marks it read, and the rail counts what is unread.
  const body = VIEWS[r.name](r);
  document.getElementById("app").className = "app" + (S.railOpen ? " wide" : "");
  paint(rail(active) + `<main class="main">${S.stale ? `<div class="notice stale" role="status">${ico("sync", "s")}<span>Une nouvelle version de l'application est en ligne. Ce que vous êtes en train de saisir n'est pas perdu tant que vous restez sur cette page.</span><button class="btn sm" data-a="reload">Recharger</button></div>` : ""}${S.notice ? `<div class="notice" role="alert">${ico("alert", "s")}<span>${esc(S.notice)}</span></div>` : ""}${S.flash ? `<div class="flash" role="status">${ico("check", "s")}<span>${esc(S.flash.text)}</span>${S.flash.undo ? `<button class="link" data-a="undo">Annuler</button>` : ""}</div>` : ""}${body}</main>`
    + menus() + peekPanel() + previewPanel() + newDealModal() + pickerModal() + datesModal() + docNewModal() + lostModal() + taskModal() + icsModal() + userModal() + extModal() + searchModal() + agentModal() + sigReqModal() + signModal() + bufferModal() + confirmModal());
  queueSave();
  if (r.name === "openspace") drawWires();
  for (const id of ["thread", "chat"]) { const el = document.getElementById(id); if (el) el.scrollTop = el.scrollHeight; }
  // Focus goes, in order: where an action asked for it, into a window that just opened, or back
  // where it was before the redraw.
  const opened = S.modal !== shownModal && S.modal ? document.querySelector(".modal input:not([type=checkbox]), .modal select") : null;
  shownModal = S.modal;
  const want = S.focus ? document.getElementById(S.focus) : null; S.focus = null;
  const el = want ?? opened ?? (keep ? document.getElementById(keep.id) : null);
  if (el) { el.focus({ preventScroll: !want }); if (el.isContentEditable) { const sl = getSelection(); sl.selectAllChildren(el); sl.collapseToEnd(); } try { if (el === want) el.setSelectionRange(el.value.length, el.value.length); else if (keep && el.id === keep.id && keep.start != null) el.setSelectionRange(keep.start, keep.end); } catch (_) { /* this kind of field has no caret to restore */ } }
}
function syncBank(d) {
  const tokens = d.tenants.concat(d.contact.name).join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z]+/).filter((w) => w.length >= 4);
  let matched = 0, confirmed = 0;
  income(d).filter((p) => !p.bank).forEach((p) => {
    const fits = S.bankStatement.filter((t) => !t.used && t.amount === p.amount && tokens.some((w) => t.label.toLowerCase().includes(w)));
    if (fits.length !== 1) return; const t = fits[0]; t.used = true; p.bank = t.label;
    if (p.status === "due") { p.status = "paid"; p.paidOn = t.on; matched++; log(d, "Paiement", `${p.kind} retrouvé sur le relevé : ${eur(p.amount)}`); } else { confirmed++; log(d, "Paiement", `${p.kind} confirmé par le relevé bancaire`); }
  });
  const say = (n, verb) => (n === 1 ? `1 paiement ${verb} par le relevé.` : `${n} paiements ${verb}s par le relevé.`);
  S.sync = matched || confirmed ? [matched ? say(matched, "retrouvé") : "", confirmed ? say(confirmed, "confirmé") : ""].join(" ").trim() : "Rien de nouveau sur le relevé.";
}
const SEL = ["go", "tab", "view", "edit", "a", "toggle", "pay", "hist", "comp", "done", "stage", "month", "doc", "jump", "pick", "folder", "dview", "day", "pm", "menu", "sort", "newday", "ext", "mtab", "ttab", "qdel", "pvdel", "rmdel", "unpin", "udel", "src", "agent", "agent-open", "agent-run", "prop-ok", "prop-no", "tool", "kind", "calview", "real", "seemonth", "year", "ayear", "atab", "aopen", "aok", "bskip"].map((k) => `[data-${k}]`).join(",");
// Ask before anything that removes something. The action itself runs only on "confirm-yes".
function ask(title, body, more, cta, run, link = null) { S.modal = "confirm"; S.confirm = { title, body, more, cta, run, link }; }
function openLost() { S.modal = "lost"; S.modalErr = ""; S.draft = { "ls-reason": LOST[0] }; }
document.addEventListener("click", (e) => {
  const t = e.target.closest(SEL);
  // A click outside an open menu closes it; a click on a line of the menu closes it and acts.
  if (S.menu && !e.target.closest("[data-menu]")) { if (e.target.closest(".pop") && !t) return; S.menu = null; if (!t) { render(); return; } }
  if (!t) return;
  if (justDragged && t.closest(".agent")) return;
  const r = ctx(), d = r.name === "affaire" || r.name === "contact" ? deal(r.id) : null, ds = t.dataset;
  // From the calendar, a stay opens in a panel: the calendar stays where it was underneath.
  if (ds.go && ds.go.startsWith("affaire-") && route().name === "reservations" && !S.peek && deal(ds.go.slice(8))) { S.peek = ds.go.slice(8); S.peekOut = false; S.edit = S.payEdit = S.menu = null; render(); return; }
  if (ds.a === "peek-close") { closePeek(); render(); return; }
  if (ds.a === "reload") { persist().finally(() => location.reload()); return; }
  const flash = S.flash; S.flash = null; S.notice = "";
  if (ds.menu) { S.menu = S.menu === ds.menu ? null : ds.menu; render(); return; }
  if (ds.a === "undo" && flash && flash.undo) flash.undo();
  if (ds.a === "confirm-yes" && S.confirm) { const c = S.confirm; S.modal = null; S.confirm = null; c.run(); }
  if (ds.a === "sim") { S.flash = { text: ds.msg }; S.modal = null; }
  if (ds.a === "search") { S.modal = "search"; S.preview = null; S.draft.gq = ""; }
  if (ds.a === "role") { S.role = ds.role; S.preview = null; S.flash = { text: ds.role === "admin" ? "Vous voyez l'application comme un administrateur." : "Vous voyez l'application comme un membre de l'équipe : documents confidentiels et réglages sont verrouillés." }; }
  if (ds.a === "logout") { fetch("/auth/logout", { method: "POST" }).finally(() => { S.user = null; S.deals = []; location.hash = "connexion"; render(); }); return; }

  /* Cleaning buffer and default terms */
  if (ds.a === "buffer-cancel") { S.modal = S.pending && S.pending.back === "dates" ? "dates" : null; S.pending = null; }
  if (ds.a === "buffer-force" && S.pending) { const p = S.pending, pd = deal(p.id); S.modal = null; S.pending = null; S.pick = null;
    if (pd && p.stage !== undefined) setStage(pd, p.stage, true);
    else if (pd) { pd.start = p.a; pd.end = p.b; S.edit = null; log(pd, "Modification", `Dates modifiées, délai de ménage forcé (séjour voisin : ${p.other})`); } }
  if (ds.a === "buf-minus") S.buffer = Math.max(0, S.buffer - 1);
  if (ds.a === "buf-plus") S.buffer = Math.min(7, S.buffer + 1);
  if (ds.a === "dep-minus") TERMS.deposit = Math.max(10, TERMS.deposit - 5);
  if (ds.a === "dep-plus") TERMS.deposit = Math.min(50, TERMS.deposit + 5);
  if (ds.a === "hold-minus") TERMS.hold = Math.max(0, TERMS.hold - 500);
  if (ds.a === "hold-plus") TERMS.hold = Math.min(5000, TERMS.hold + 500);

  /* Lists: tabs, sorting, filters */
  if (ds.folder) S.openFolders[ds.folder] = !S.openFolders[ds.folder];
  if (ds.dview) S.dView = ds.dview;
  if (ds.mtab) S.mTab = ds.mtab;
  if (ds.ttab) S.tTab = ds.ttab;
  if (ds.sort) S.sort = S.sort && S.sort.k === ds.sort ? (S.sort.dir > 0 ? { k: ds.sort, dir: -1 } : null) : { k: ds.sort, dir: 1 };
  if (ds.a === "kpi-signed") S.tab = "signed";
  if (ds.a === "kpi-late") { S.tab = "all"; S.lateOnly = true; S.view = "list"; }
  if (ds.a === "late-off") S.lateOnly = false;
  if (ds.a === "kpi-coming") { const nx = live().filter((x) => x.start > TODAY && x.stage >= 2).sort((a, b) => (a.start < b.start ? -1 : 1))[0]; S.month = (nx ? nx.start : TODAY).slice(0, 7); location.hash = "reservations"; return; }
  if (ds.a === "export") { const rows = filteredDocs(), text = ["Document\tType\tAffaire\tDate\tStatut", ...rows.map(({ x, from }) => [x.t, kindOf(x), from, fr(x.d), x.st ?? "Brouillon"].join("\t"))].join("\n");
    S.exportMsg = `${rows.length} document${rows.length > 1 ? "s" : ""} : la liste est copiée, collez-la dans un tableur. Dans l'application, ce bouton téléchargera aussi les fichiers dans une archive.`;
    try { navigator.clipboard.writeText(text).catch(() => { S.exportMsg = `${rows.length} documents sélectionnés. Dans l'application, ce bouton téléchargera la liste et les fichiers dans une archive.`; render(); }); } catch (_) { /* no clipboard here: the message above still stands */ } }

  /* Navigation */
  if (ds.go) { S.edit = S.payEdit = S.preview = S.modal = S.peek = null; S.sync = ""; if (ds.comp) S.composer = ds.comp;
    if (location.hash === "#" + ds.go) { render(); return; } location.hash = ds.go; return; }

  /* Documents */
  if (ds.doc) { const [id, i] = ds.doc.split(":"); S.preview = id === "lib" ? { lib: Number(i) } : { deal: id, i: Number(i) }; S.toast = ""; S.docEdit = false; if (S.modal === "search") S.modal = null; }
  if (ds.a === "slot-create" && d) { const sl = SLOTS.find((x) => x.key === ds.slot);
    // With Drive connected, a contract or a deposit form becomes a real Google Docs file, filled from the deal.
    if (sl && sl.k === "gdoc" && S.drive.on) driveCreate(d, newSlotDoc(sl), `${sl.label} - ${d.title}`.slice(0, 120));
    else if (sl) { const local = () => { d.docs.push(newSlotDoc(sl)); log(d, "Document", `${sl.label} créé ${sl.k === "pl" ? "en brouillon" : "depuis un modèle"}`); S.preview = { deal: d.id, i: d.docs.length - 1 }; S.toast = sl.k === "pl" ? "Brouillon créé." : "Créé en brouillon à partir du modèle : modifiez-le directement ici."; };
      // An administrator who has not connected Drive is told so: the real Google Docs file is one click away.
      if (sl.k === "gdoc" && isAdmin()) ask("Google Drive n'est pas connecté", "Pour que « Créer » fabrique un vrai document Google Docs, privé et modifiable dans le panneau, connectez d'abord Google Drive (une seule fois).", "Sans connexion, le document reste un brouillon interne à l'application.", "Créer dans l'application", () => { local(); render(); }, { href: "/auth/drive", label: "Connecter Google Drive" });
      else local(); } }
  if (ds.a === "doc") { const first = d ? slotsFor(d).find((x) => !d.docs.some((y) => y.slot === x.key)) : null; S.modal = "doc-new"; S.modalErr = ""; S.draft = { "dn-deal": d ? d.id : "", "dn-slot": ds.slot ?? (first ? first.key : ""), "dn-src": ds.file ? "file" : "model" }; }
  if (ds.src) S.draft["dn-src"] = ds.src;
  if (ds.a === "doc-add" && S.draft["dn-src"] === "file") { const el = document.getElementById("dn-file"), f = el && el.files[0], to = deal(S.draft["dn-deal"]), sl = SLOTS.find((s) => s.key === S.draft["dn-slot"]);
    if (!f) S.modalErr = "Choisissez un fichier.";
    else if (sl && to && to.docs.some((x) => x.slot === sl.key)) S.modalErr = `Cette affaire a déjà un document « ${sl.label} ». Supprimez-le d'abord, ou choisissez « Autre document ».`;
    else if (!S.uploading) { S.uploading = true; S.modalErr = ""; const name = (S.draft["dn-name"] ?? "").trim() || f.name.replace(/\.[^.]+$/, "");
      uploadFile(f, to ? to.id : "").then((up) => { S.uploading = false;
        const x = { t: name, k: up.mime === "application/pdf" ? "pdf" : up.mime.startsWith("image/") ? "img" : "file", d: TODAY, st: "Reçu", slot: sl ? sl.key : undefined, fileId: up.id, size: up.size };
        if (to) { to.docs.push(x); log(to, "Document", `${x.t} importé`); S.preview = { deal: to.id, i: to.docs.length - 1 }; } else { S.library.push(x); S.preview = { lib: S.library.length - 1 }; }
        S.modal = null; S.draft = {}; S.toast = "Fichier importé."; render(); }, (e) => { S.uploading = false; S.modalErr = e.message; render(); }); }
    render(); return; }
  if (ds.a === "doc-add") { const to = deal(S.draft["dn-deal"]), sl = SLOTS.find((s) => s.key === S.draft["dn-slot"]), file = S.draft["dn-src"] === "file";
    if (sl && to && to.docs.some((x) => x.slot === sl.key)) S.modalErr = `Cette affaire a déjà un document « ${sl.label} ». Supprimez-le d'abord, ou choisissez « Autre document ».`;
    else { const x = { t: (S.draft["dn-name"] ?? "").trim() || (sl ? sl.label : "Document libre"), k: file ? "pdf" : sl ? sl.k : "gdoc", d: TODAY, st: file ? "Envoyé" : "Brouillon", slot: sl ? sl.key : undefined };
      if (x.k === "pl") x.pl = { num: null, final: false };
      if (to && x.k === "gdoc" && S.drive.on) { S.modalErr = ""; driveCreate(to, x, ((S.draft["dn-name"] ?? "").trim() || `${x.t} - ${to.title}`).slice(0, 120)); render(); return; }
      if (to) { to.docs.push(x); log(to, "Document", `${x.t} ${file ? "importé" : "créé depuis un modèle"}`); S.preview = { deal: to.id, i: to.docs.length - 1 }; } else { S.library.push(x); S.preview = { lib: S.library.length - 1 }; }
      S.modal = null; S.draft = {}; S.toast = file ? "Fichier importé (simulé dans ce prototype)." : "Créé en brouillon à partir du modèle."; } }
  if (ds.a === "slot-pick" && d) { S.modal = "pick"; S.pickSlot = ds.slot; S.draft = {}; }
  if (ds.pick && d) { const [kind, a, b] = ds.pick.split(":"), src = kind === "lib" ? S.library.splice(Number(a), 1)[0] : deal(a)?.docs[Number(b)];
    if (src) { d.docs.push({ ...src, slot: S.pickSlot }); log(d, "Document", `${src.t} rattaché depuis ${kind === "lib" ? "les documents non classés" : deal(a).title}`); } S.modal = null; S.pickSlot = null; }
  if (ds.a === "close-preview") closePanel();
  if (ds.a === "doc-pdf" || ds.a === "doc-print") { S.toast = "Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF »."; render(); window.print(); return; }
  if (ds.a === "doc-open") S.toast = "Dans l'application : le document s'ouvre dans Google Drive.";
  
  if (ds.a === "doc-rename") { S.docEdit = true; S.focus = "doc-name"; }
  if (ds.a === "doc-rename-ok") { const cur = previewed(), name = val("doc-name").trim();
    if (cur && name.length >= 2) { if (cur.d && name !== cur.x.t) log(cur.d, "Document", `${cur.x.t} renommé en « ${name} »`); cur.x.t = name; S.docEdit = false; } else S.focus = "doc-name"; }
  if (ds.a === "doc-del") { const cur = previewed(), pv = S.preview;
    if (cur && !cur.sheet) { const list = cur.d ? cur.d.docs : S.library, at = cur.d ? pv.i : pv.lib, sl = SLOTS.find((s) => s.key === cur.x.slot);
      ask("Supprimer ce document ?", `« ${esc(cur.x.t)} » sera retiré ${cur.d ? `de l'affaire « ${esc(cur.d.title)} »` : "des documents non classés"}.${cur.d && sl ? ` L'emplacement « ${sl.label} » redeviendra manquant.` : ""}`,
        "Le fichier part dans la corbeille de Google Drive, où il reste récupérable pendant 30 jours.", "Supprimer le document", () => {
          list.splice(at, 1); S.preview = null; if (cur.d) log(cur.d, "Document", `${cur.x.t} supprimé`);
          S.flash = { text: `« ${cur.x.t} » est supprimé.`, undo: () => { list.splice(at, 0, cur.x); if (cur.d) log(cur.d, "Document", `${cur.x.t} restauré`); } }; }); } }
  if (ds.a === "doc-mail") { const cur = previewed();
    if (cur && cur.d) { S.preview = null; S.composer = "E-mail"; S.draft["mail-att"] = cur.x.t; S.focus = "mail-body"; if (location.hash !== "#affaire-" + cur.d.id) { location.hash = "affaire-" + cur.d.id; return; } } }
  if (ds.a === "sheet" && d) { S.preview = { sheet: d.id }; S.toast = ""; }

  if (ds.a === "ical-copy") { const url = S.admin ? S.admin.icalUrl : ""; S.flash = { text: "Lien copié : collez-le dans Airbnb ou Booking, à l'endroit « importer un calendrier »." };
    try { navigator.clipboard.writeText(url).catch(() => { S.flash = null; S.notice = "Copie impossible ici. Le lien : " + url; render(); }); } catch (_) { S.flash = null; S.notice = "Copie impossible ici. Le lien : " + url; } }
  if (ds.a === "rail") { S.railOpen = !S.railOpen; try { localStorage.setItem("rail", S.railOpen ? "1" : "0"); } catch (_) { /* the preference is simply not kept */ } }
  if (ds.a === "doc-reset") { S.dq = ""; S.dKind = ALL.kind; S.dYear = ALL.year; S.dDeal = ALL.deal; S.dStatus = ALL.status; S.exportMsg = ""; }
  if (ds.a === "doc-toast") S.toast = ds.msg;
  if (ds.a === "doc-reset-body") { const cur = previewed(); if (cur) { delete cur.x.body; S.toast = "Modèle rétabli à partir de l'affaire."; } }

  /* Pennylane: quotes and invoices */
  if (ds.a === "invoice" && d) { const sl = SLOTS.find((x) => x.key === ds.slot); let i = d.docs.findIndex((x) => x.slot === ds.slot); S.toast = "";
    if (i < 0 && sl) { d.docs.push(newSlotDoc(sl)); i = d.docs.length - 1; log(d, "Document", `${sl.label} créée en brouillon`); S.toast = "Facture créée en brouillon."; }
    if (i >= 0) S.preview = { deal: d.id, i }; }
  if (ds.a === "quote-open" && d) { let i = d.docs.findIndex((x) => x.slot === "devis"); S.toast = "";
    if (i < 0) { d.docs.push(newSlotDoc(SLOTS[0])); i = d.docs.length - 1; log(d, "Document", "Devis créé en brouillon"); }
    S.preview = { deal: d.id, i }; }
  if (ds.a === "quote-new") { const cur = previewed();
    if (cur && cur.d) { cur.x.slot = undefined; cur.x.t += " (version précédente)"; cur.d.quote = cur.d.quote ?? quoteOf(cur.d); cur.d.docs.push(newSlotDoc(SLOTS[0])); S.preview = { deal: cur.d.id, i: cur.d.docs.length - 1 };
      log(cur.d, "Document", "Nouvelle version du devis en brouillon"); S.toast = "Nouvelle version en brouillon. L'ancienne reste dans les documents."; } }
  if (ds.a === "pl-final") { const cur = previewed();
    if (cur && cur.d && cur.x.pl && !cur.x.pl.final) { const pd = cur.d, x = cur.x, isQuote = x.slot === "devis";
      if (isQuote) { pd.quote = pd.quote ?? quoteOf(pd); const total = quoteTotal(pd.quote); if (document.getElementById("q-sync")?.checked && total !== pd.amount) { log(pd, "Modification", `Montant : ${eur(pd.amount)} → ${eur(total)}`); pd.amount = total; } }
      x.pl.num = plNum(isQuote ? "D" : "F"); if (!isQuote) x.t = `${x.t} n° ${x.pl.num}`; x.d = TODAY; x.body = docBody(pd, x); x.pl.final = true; x.k = "pdf"; x.st = "Finalisé";
      log(pd, "Document", `${x.t} finalisé (${x.pl.num})`); S.toast = `Numéro ${x.pl.num} attribué. Le document ne se modifie plus.`; } }

  /* Signature */
  if (ds.a === "sig-new") { const cur = previewed(); if (cur && cur.d) { S.modal = "sigreq"; S.modalErr = ""; S.draft["sg-msg"] = "Bonjour, voici le document à signer en ligne. Bien cordialement, " + me().name; } }
  if (ds.a === "sig-send") { const cur = previewed();
    if (cur && cur.d) { const pd = cur.d, x = cur.x;
      x.body = x.body ?? docBody(pd, x); if (x.k !== "pdf") { x.k0 = x.k; x.k = "pdf"; }
      x.sig = { state: "sent", sentAt: stamp(), opened: "", by: "", at: "" }; x.st = "À signer"; S.modal = null; S.docEdit = false;
      pd.emails.push({ from: "me", subject: `À signer : ${x.t}`, body: S.draft["sg-msg"] ?? "", at: stamp(), att: x.t });
      log(pd, "Document", `${x.t} figé en PDF et envoyé pour signature à ${pd.contact.email}`); S.toast = "Envoyé pour signature. Le document est maintenant un PDF.";
      setTimeout(() => { if (x.sig && x.sig.state === "sent") { x.sig.opened = stamp(); if (!S.modal && !S.edit) render(); } }, 2500); } }
  if (ds.a === "sig-remind") { const cur = previewed(); if (cur && cur.d) { log(cur.d, "Document", `Relance de signature envoyée : ${cur.x.t}`); S.toast = `Relance envoyée à ${cur.d.contact.email}.`; } }
  if (ds.a === "sig-cancel") { const cur = previewed();
    if (cur && cur.x.sig) ask("Retirer la demande de signature ?", `Le lien envoyé pour « ${esc(cur.x.t)} » ne fonctionnera plus.`, cur.x.k0 ? "Le document redevient un brouillon que vous pouvez modifier." : "Le PDF reste dans l'affaire.", "Retirer la demande", () => {
      const x = cur.x; delete x.sig; if (x.k0) { x.k = x.k0; delete x.k0; x.st = "Brouillon"; } else x.st = x.pl ? "Finalisé" : "Brouillon"; if (cur.d) log(cur.d, "Document", `Demande de signature retirée : ${x.t}`); S.toast = "Demande retirée."; }); }
  if (ds.a === "sig-view") { S.modal = "sign"; S.modalErr = ""; delete S.draft["sg-name"]; }
  if (ds.a === "sig-done") { const cur = previewed(), name = val("sg-name").trim();
    if (cur && cur.d && cur.x.sig) { if (!document.getElementById("sg-ok")?.checked) S.modalErr = "Cochez la case pour pouvoir signer."; else if (name.length < 2) S.modalErr = "Saisissez le nom du signataire.";
      else { const pd = cur.d, x = cur.x; x.sig.state = "signed"; x.sig.at = stamp(); x.sig.by = name; x.sig.opened = x.sig.opened || stamp(); x.st = "Signé"; S.modal = null; S.modalErr = "";
        log(pd, "Document", `${x.t} signé électroniquement par ${name}`); S.toast = "Document signé. Le PDF signé est rangé dans l'affaire et ne se modifie plus.";
        if (x.slot === "contrat" && pd.stage < 4 && pd.status !== "Perdu") setStage(pd, 4); } } }

  /* Open Space */
  if (ds.agent) S.agentSel = ds.agent;
  if (ds.agentOpen) S.agentSel = ds.agentOpen;
  if (ds.agentRun) { const a = S.agents.find((x) => x.id === ds.agentRun); if (a) { runAgent(a); return; } }
  if (ds.a === "agents-run") { const on = S.agents.filter((a) => !a.paused && !a.busy); if (on.length) { on.forEach(runAgent); return; } S.notice = "Tous les agents sont en pause."; }
  if (ds.a === "agent-close") S.agentSel = null;
  if (ds.tool) { const a = selAgent(); if (a) a.tools = a.tools.includes(ds.tool) ? a.tools.filter((k) => k !== ds.tool) : [...a.tools, ds.tool]; }
  if (ds.a === "agent-mode") { const a = selAgent(); if (a) a.mode = ds.mode; }
  if (ds.a === "agent-pause") { const a = selAgent(); if (a) a.paused = !a.paused; }
  if (ds.a === "agent-del") { const a = selAgent();
    if (a) ask("Supprimer cet agent ?", `« ${esc(a.name)} » quitte l'open space, avec son journal et ses propositions en attente.`, "Ce qu'il a déjà fait reste dans l'historique des affaires.", "Supprimer l'agent", () => {
      const at = S.agents.indexOf(a); S.agents.splice(at, 1); S.props = S.props.filter((x) => x.agent !== a.id); S.agentSel = null; S.flash = { text: `Agent « ${a.name} » supprimé.`, undo: () => S.agents.splice(at, 0, a) }; }); }
  if (ds.a === "agent-new") { S.modal = "agent"; S.modalErr = ""; S.draft = { "an-kind": "libre", "an-trigger": TRIGGERS[0] }; }
  if (ds.kind) { const k = AGENT_KINDS[ds.kind]; if (k) { S.draft["an-kind"] = ds.kind; S.draft["an-name"] = ds.kind === "libre" ? "" : k.name; S.draft["an-mission"] = k.mission; S.draft["an-trigger"] = k.trigger; S.modalErr = ""; } }
  if (ds.a === "agent-add") { const name = (S.draft["an-name"] ?? "").trim(), mission = (S.draft["an-mission"] ?? "").trim(), kind = S.draft["an-kind"] ?? "libre";
    if (name.length < 2) S.modalErr = "Donnez un nom à l'agent."; else if (mission.length < 10) S.modalErr = "Décrivez sa mission en une phrase au moins.";
    else { const used = new Set(S.agents.map((x) => x.x + ":" + x.y)), spot = SPOTS.findIndex(([x, y]) => !used.has(x + ":" + y));
      const a = mkAgent(kind, spot < 0 ? S.agents.length : spot, { name, mission, trigger: S.draft["an-trigger"] ?? TRIGGERS[0], role: kind === "libre" ? "Mission sur mesure" : AGENT_KINDS[kind].role });
      if (spot < 0) { a.x = 330; a.y = 60 + (S.agents.length % 6) * 44; }
      S.agents.push(a); S.agentSel = a.id; S.modal = null; S.draft = {}; S.flash = { text: `Agent « ${name} » créé. Réglez ses outils, puis lancez-le.` }; } }
  const doProp = (pr) => { const ag = S.agents.find((x) => x.id === pr.agent), done = pr.run(); S.props = S.props.filter((x) => x !== pr); if (ag) ag.log.unshift({ t: cap(done), at: stamp() }); return `${ag ? ag.name : "L'agent"} ${done}`; };
  if (ds.propOk) { const pr = S.props.find((x) => x.key === ds.propOk); if (pr) S.flash = { text: `Fait : ${doProp(pr)}.` }; }
  if (ds.propNo) { S.ignored.add(ds.propNo); S.props = S.props.filter((x) => x.key !== ds.propNo); }
  if (ds.a === "props-all") { const n = S.props.length; [...S.props].forEach(doProp); S.flash = { text: `${n} actions validées.` }; }

  if (ds.calview) S.calView = ds.calview;
  if (ds.year) S.month = `${Number(S.month.slice(0, 4)) + Number(ds.year)}${S.month.slice(4)}`;
  if (ds.seemonth) { S.month = ds.seemonth; S.calView = "month"; }

  /* Windows */
  if (ds.a === "close-modal") { S.modal = null; S.pick = null; S.confirm = null; S.modalErr = ""; }
  if (ds.a === "new") { S.modal = "new"; S.modalErr = ""; S.draft = {}; const from = deal(ds.contact); if (from) S.draft = { "n-from": from.id, "n-contact": from.contact.name, "n-email": from.contact.email, "n-phone": from.contact.phone, "n-source": "Recommandation" }; }
  if (ds.newday) { S.modal = "new"; S.modalErr = ""; S.draft = { "n-start": ds.newday, "n-end": addDays(ds.newday, 2) }; }
  if (ds.a === "create") { S.modalErr = createDeal(); if (!S.modalErr) return; }
  if (ds.ext !== undefined) { S.modal = "ext"; S.ext = Number(ds.ext); }
  if (ds.a === "ics-new") { S.modal = "ics"; S.modalErr = ""; S.draft = { "ic-kind": "Airbnb" }; }
  if (ds.a === "ics-add") { const name = (S.draft["ic-name"] ?? "").trim(), url = (S.draft["ic-url"] ?? "").trim();
    if (name.length < 2) S.modalErr = "Donnez un nom au logement."; else if (!/^https:\/\/\S+\.\S+/.test(url)) S.modalErr = "Collez le lien iCal complet : il commence par https://";
    else { S.sources.push({ id: "s" + Date.now(), kind: S.draft["ic-kind"] ?? "Airbnb", name, url, last: "" }); S.modal = null; S.draft = {}; S.flash = { text: "Calendrier ajouté : lecture en cours." }; render(); persist().then(syncFeeds); return; } }
  if (ds.a === "src-sync") { syncFeeds(); return; }
  if (ds.a === "doc-newver") { const cur = previewed(), sl = cur && SLOTS.find((o) => o.key === cur.x.slot);
    if (cur && cur.d && sl) { const d0 = cur.d, old = cur.x; old.slot = undefined; old.t = `${old.t} (version du ${fr(old.d)})`.slice(0, 120); log(d0, "Document", `${sl.label} : nouvelle version, l'ancienne est conservée`);
      if (S.drive.on) { S.preview = null; driveCreate(d0, newSlotDoc(sl), `${sl.label} - ${d0.title}`.slice(0, 120)); }
      else { d0.docs.push(newSlotDoc(sl)); S.preview = { deal: d0.id, i: d0.docs.length - 1 }; S.toast = "Nouvelle version créée en brouillon."; } } }
  if (ds.a === "doc-resync") { const cur = previewed(); if (cur && cur.d) ask("Remettre ce document à jour ?", "Son contenu sera remplacé par le modèle, rempli avec la fiche de l'affaire.", "Ce qui a été tapé à la main dans Google Docs sera perdu.", "Remplacer le contenu", () => driveDocsSync(cur.d, cur.x)); }
  if (ds.a === "doc-bare") { S.docBare = !S.docBare; try { localStorage.setItem("docBare", S.docBare ? "1" : "0"); } catch (_) { /* private window: the choice lasts for this visit only */ } }
  if (ds.a === "lessor-save" && isAdmin()) { S.lessor = Object.fromEntries(LESSOR_FIELDS.map(([k]) => k).map((k) => { const v = val("ls-" + k).trim().slice(0, 160); delete S.draft["ls-" + k]; return [k, v]; })); S.flash = { text: "Bailleur enregistré : les contrats en cours le reprennent." }; S.deals.forEach((o) => driveDocsSync(o)); }
  if (ds.a === "drive-off") ask("Déconnecter Google Drive ?", "Les documents déjà créés restent dans Drive et dans les affaires.", "« Créer » refera des documents internes à l'application.", "Déconnecter", () => { api("DELETE", "/api/drive").then((r) => { if (r.status === 200) S.drive = { on: false }; else S.notice = "Déconnexion refusée."; render(); }); });
  if (ds.a === "src-del") { const s = S.sources.find((x) => x.id === ds.id);
    if (s) ask("Retirer ce calendrier ?", `Les réservations importées de « ${esc(s.kind)}, ${esc(s.name)} » disparaîtront du calendrier, et leurs dates redeviendront libres ici.`, "Rien n'est modifié sur la plateforme d'origine.", "Retirer le calendrier", () => {
      const at = S.sources.indexOf(s), gone = S.feeds.filter((f) => f.src === s.id); S.sources.splice(at, 1); S.feeds = S.feeds.filter((f) => f.src !== s.id);
      S.flash = { text: "Calendrier retiré.", undo: () => { S.sources.splice(at, 0, s); S.feeds.push(...gone); } }; }); }
  if (ds.a === "user-new") { S.modal = "user"; S.modalErr = ""; S.draft = { "iv-role": "Équipe" }; }
  if (ds.a === "user-add") { const email = (S.draft["iv-email"] ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) S.modalErr = "Adresse e-mail invalide."; else if (S.users.some((u) => u.email === email)) S.modalErr = "Cette personne a déjà un accès.";
    else { S.users.push({ name: email.split("@")[0], email, role: S.draft["iv-role"] ?? "Équipe", pending: true }); S.modal = null; S.draft = {}; S.flash = { text: `Invitation envoyée à ${email}.` }; } }
  if (ds.udel !== undefined) { const i = Number(ds.udel), u = S.users[i];
    if (u) ask("Retirer cet utilisateur ?", `${esc(u.name)} (${esc(u.email)}) ne pourra plus se connecter.`, "Ce qu'il ou elle a saisi reste dans l'historique des affaires.", "Retirer l'accès", () => { S.users.splice(i, 1); S.flash = { text: `${u.name} n'a plus accès.`, undo: () => S.users.splice(i, 0, u) }; }); }
  if (ds.a === "task-new") { S.modal = "task"; S.modalErr = ""; S.draft = { "tk-deal": d ? d.id : live()[0]?.id ?? "", "tk-type": "Rappel", "tk-due": addDays(TODAY, 2) }; }
  if (ds.a === "task-add") { const to = deal(S.draft["tk-deal"]), text = (S.draft["tk-text"] ?? "").trim();
    if (text.length < 2) S.modalErr = "Décrivez ce qu'il faut faire."; else if (!to) S.modalErr = "Choisissez une affaire.";
    else { to.todos.push({ id: "t" + Date.now(), t: text, type: S.draft["tk-type"] ?? "Rappel", due: S.draft["tk-due"] || TODAY, at: fr(TODAY), by: me().name }); S.modal = null; S.draft = {}; S.flash = { text: `Tâche ajoutée à « ${to.title} ».` }; } }

  /* Conversations */
  if (ds.a === "mail-send" && d) { const subject = val("mail-subject").trim() || "(sans objet)", box = document.getElementById("mail-body"), body = box ? box.innerText.trim() : "", html = box ? clean(box.innerHTML) : "", att = S.draft["mail-att"] || "";
    if (body) { d.emails.push({ from: "me", subject, body, html, at: stamp(), att }); log(d, "E-mail", `E-mail envoyé : ${subject}`, body + (att ? `\n\nPièce jointe : ${att}` : ""));
      const sent = att ? d.docs.find((x) => x.t === att) : null; if (sent && !sent.sig && ["Brouillon", "Finalisé"].includes(sent.st ?? "Brouillon")) { log(d, "Document", `${sent.t} : ${sent.st ?? "Brouillon"} → Envoyé`); sent.st = "Envoyé"; }
      delete S.draft["mail-body"]; delete S.draft["mail-subject"]; delete S.draft["mail-att"]; simulateReply(d, "mail", subject); } }
  if (ds.a === "wa-send" && d) { const body = val("wa-body").trim();
    if (body) { d.wa.push({ from: "me", body, at: stamp().slice(-5) }); log(d, "WhatsApp", "WhatsApp envoyé", body); delete S.draft["wa-body"]; simulateReply(d, "wa", ""); } }
  // A reminder is written for the user, who reads it and sends it: nothing leaves on its own.
  if (ds.a === "remind" && d) { const p = income(d).find(late) ?? income(d).find((x) => x.status === "due"), first = d.contact.name.split(" ")[0];
    S.composer = "E-mail"; S.focus = "mail-body";
    S.draft["mail-subject"] = p ? `Rappel : ${p.kind.toLowerCase()} pour votre séjour du ${range(d.start, d.end)}` : `Votre séjour du ${range(d.start, d.end)}`;
    S.draft["mail-body"] = p ? `Bonjour ${first},\n\nSauf erreur de notre part, nous n'avons pas encore reçu ${p.kind === "Acompte" ? "l'acompte" : "le " + p.kind.toLowerCase()} de ${eur(p.amount)}, attendu le ${fr(p.due)}.\n\nPouvez-vous nous indiquer la date de votre virement ?\n\nBien cordialement,\n${me().name}` : `Bonjour ${first},\n\n`; S.draft["mail-body"] = textToHtml(S.draft["mail-body"]); }

  if (ds.tab) S.tab = ds.tab; if (ds.view) S.view = ds.view; if (ds.hist) S.histTab = ds.hist; if (ds.comp) S.composer = ds.comp;
  if (ds.toggle) S.closed[ds.toggle] = !S.closed[ds.toggle];
  if (ds.ayear) S.auditYear = ds.ayear; if (ds.atab) S.auditTab = ds.atab; if (ds.aopen) S.auditOpen[ds.aopen] = !S.auditOpen[ds.aopen];
  if (ds.aok) { const d = deal(ds.aok); if (d) { d.auditOk = d.auditOk ?? []; const at = d.auditOk.indexOf(ds.t); if (at >= 0) d.auditOk.splice(at, 1); else d.auditOk.push(ds.t); } }
  if (ds.bskip && isAdmin()) { const t = S.bankStatement.find((x) => `${x.on}|${x.label}|${x.amount}` === ds.bskip && !x.skip); if (t) t.skip = true; }
  if (ds.month) { const [y, m] = S.month.split("-").map(Number); const n = new Date(Date.UTC(y, m - 1 + Number(ds.month), 1)); S.month = n.toISOString().slice(0, 7); }

  /* Deal: fields, dates, stage, status */
  if (ds.edit === "dates" && d) { S.modal = "dates"; S.pick = { id: d.id, a: d.start, b: d.end, month: (d.start || TODAY).slice(0, 7) }; }
  else if (ds.edit) S.edit = { key: ds.edit };
  if (ds.day && S.pick) { const pk = S.pick; if (!pk.a || pk.b || ds.day <= pk.a) { pk.a = ds.day; pk.b = null; } else pk.b = ds.day; }
  if (ds.pm && S.pick) { const [py, pmo] = S.pick.month.split("-").map(Number); S.pick.month = new Date(Date.UTC(py, pmo - 1 + Number(ds.pm), 1)).toISOString().slice(0, 7); }
  if (ds.a === "dates-ok" && S.pick) { const pk = S.pick, pd = deal(pk.id), v = pd ? pickVerdict(pd, pk.a, pk.b) : { kind: "wait" };
    if (v.kind === "warn" && pd.stage >= 2) { S.modal = "buffer"; S.pending = { id: pd.id, a: pk.a, b: pk.b, other: v.close.title, back: "dates" }; }
    else if (v.kind === "ok" || v.kind === "warn") { const was = range(pd.start, pd.end); pd.start = pk.a; pd.end = pk.b; S.modal = null; S.pick = null; if (was !== range(pd.start, pd.end)) log(pd, "Modification", `Dates : ${was} → ${range(pd.start, pd.end)}`); } }
  if (ds.stage !== undefined && d) setStage(d, Number(ds.stage));
  if (ds.a === "advance" && d && d.stage < 5) setStage(d, d.stage + 1);
  if (ds.a === "cancel") S.edit = null;
  if (ds.a === "save" && d) { const before = FIELDS[ds.key].show(d); const err = FIELDS[ds.key].save(d); if (err === HOLD_EDIT) { /* the confirmation window decides */ } else if (err) S.edit = { key: ds.key, err }; else { S.edit = null; if (FIELDS[ds.key].show(d) !== before) log(d, "Modification", `Modification : ${FIELDS[ds.key].label.toLowerCase()}`); } }
  if (ds.a === "lose" && d) openLost();
  if (ds.a === "lost-ok" && d) { const was = d.status, note = (S.draft["ls-note"] ?? "").trim();
    d.status = "Perdu"; d.lostReason = (S.draft["ls-reason"] ?? LOST[0]) + (note ? " : " + note : ""); log(d, "Modification", `Affaire perdue : ${d.lostReason}`); S.modal = null; S.draft = {};
    S.flash = { text: `« ${d.title} » est marquée comme perdue.`, undo: () => { d.status = was; d.lostReason = ""; log(d, "Modification", "Affaire rouverte"); } }; }
  if (ds.a === "reopen" && d) reopen(d);
  if (ds.a === "deal-dup" && d) { const id = "n" + Date.now(), c = mk(id, d.title + " (copie)", d.kind, 0, d.amount, d.start, d.end, d.guests, d.sleeping, d.source, d.contact, { signed: TODAY, emails: [], unread: {} });
    c.history = [{ type: "Modification", t: `Affaire créée par copie de « ${d.title} »`, at: stamp(), by: me().name }]; S.deals.unshift(c); S.flash = { text: "Copie créée à l'étape Demande : pensez à changer les dates." }; location.hash = "affaire-" + id; return; }
  if (ds.a === "deal-del" && d) ask("Supprimer cette affaire ?", `« ${esc(d.title)} » disparaît avec son historique, ses conversations et son échéancier.${d.stage >= 2 && d.status !== "Perdu" ? ` Les dates du ${range(d.start, d.end)} redeviennent libres.` : ""}`,
    "Pour garder une trace, marquez plutôt l'affaire comme perdue. Les documents restent dans Google Drive.", "Supprimer l'affaire", () => {
      const at = S.deals.indexOf(d); S.deals.splice(at, 1); S.flash = { text: `« ${d.title} » est supprimée.`, undo: () => S.deals.splice(at, 0, d) }; location.hash = "affaires"; });

  /* Deal: notes, tasks */
  if (ds.done) { const dd = d ?? deal(ds.deal), todo = dd ? dd.todos.find((x) => x.id === ds.done) : null;
    if (todo) { const at = dd.todos.indexOf(todo); dd.todos.splice(at, 1); log(dd, "Note", `Fait : ${todo.t}`); S.flash = { text: `Fait : ${todo.t}`, undo: () => dd.todos.splice(at, 0, todo) }; } }
  if (ds.a === "note" && d) { const body = val("note").trim(); if (body) { if (document.getElementById("note-pin").checked) d.pinned.unshift({ t: "Note épinglée", body, at: fr(TODAY), by: me().name }); else log(d, "Note", "Note", body); delete S.draft.note; } }
  if (ds.a === "todo" && d) { const tt = val("todo").trim(); if (tt) { d.todos.push({ id: "t" + Date.now(), t: tt, type: val("act-type") || "Rappel", due: val("act-due") || TODAY, at: fr(TODAY), by: me().name }); delete S.draft.todo; } }
  if (ds.unpin !== undefined && d) { const p = d.pinned.splice(Number(ds.unpin), 1)[0]; if (p) log(d, "Note", "Note désépinglée", p.body); }
  if (ds.a === "pin-del" && d) { const i = Number(ds.i), p = d.pinned.splice(i, 1)[0]; if (p) S.flash = { text: "Note supprimée.", undo: () => d.pinned.splice(i, 0, p) }; }

  /* Deal: payments */
  if (ds.pay && d) { const p = d.payments.find((x) => x.id === ds.id);
    if (["settle", "undo", "edit", "del"].includes(ds.pay)) S.payEdit = { id: ds.id, mode: ds.pay };
    if (ds.pay === "add") S.payEdit = { id: "new", mode: "add" };
    if (ds.pay === "cancel") S.payEdit = null;
    if (ds.pay === "confirm-settle" && p) { const day = val("pay-day") || TODAY; p.status = p.hold ? "released" : "paid"; p.paidOn = day; S.payEdit = null; log(d, "Paiement", `${p.kind} ${p.hold ? "restituée" : "marqué reçu"} à la main : ${eur(p.amount)}`); }
    if (ds.pay === "confirm-undo" && p) { const u = S.bankStatement.find((x) => x.label === p.bank); if (u) u.used = false; p.status = p.hold ? "held" : "due"; p.paidOn = null; p.bank = null; S.payEdit = null; log(d, "Paiement", `${p.kind} remis ${p.hold ? "en retenue" : "en attente"}`); }
    if (ds.pay === "confirm-edit" && p) { const n = Number(val("pay-amt")), due = val("pay-due");
      if (n > 0 && due) { if (n !== p.amount || due !== p.due) log(d, "Paiement", `${p.kind} modifié : ${eur(p.amount)} le ${fr(p.due)} → ${eur(n)} le ${fr(due)}`); p.amount = n; p.due = due; S.payEdit = null; } }
    if (ds.pay === "confirm-del" && p) { const at = d.payments.indexOf(p); d.payments.splice(at, 1); S.payEdit = null; log(d, "Paiement", `Ligne supprimée : ${p.kind}, ${eur(p.amount)}`); S.flash = { text: `Ligne « ${p.kind} » supprimée.`, undo: () => d.payments.splice(at, 0, p) }; }
    if (ds.pay === "confirm-add") { const n = Number(val("pay-amt")), due = val("pay-due"), kind = val("pay-kind").trim() || "Complément";
      if (n > 0 && due) { d.payments.push({ id: "p" + Date.now(), kind, amount: n, due, status: "due", paidOn: null, bank: null }); S.payEdit = null; log(d, "Paiement", `Ligne ajoutée : ${kind}, ${eur(n)} pour le ${fr(due)}`); } } }
  // Bring the schedule back in line with the deal's amount: the gap goes on the last line still
  // to be received, or on a new line when everything has already been paid.
  if (ds.a === "resched" && d) { const gap = d.amount - income(d).reduce((s, p) => s + p.amount, 0), last = [...income(d)].reverse().find((p) => p.status === "due");
    if (last && last.amount + gap > 0) { last.amount += gap; log(d, "Paiement", `Échéancier ajusté : ${last.kind} à ${eur(last.amount)}`); }
    else if (gap > 0) { d.payments.push({ id: "p" + Date.now(), kind: "Complément", amount: gap, due: d.start < TODAY ? TODAY : d.start, status: "due", paidOn: null, bank: null }); log(d, "Paiement", `Échéancier ajusté : complément de ${eur(gap)}`); }
    else S.notice = `Le montant reçu dépasse le nouveau montant de ${eur(-gap)} : un remboursement est à prévoir, à saisir à la main.`; }
  if (ds.a === "sync" && d) syncBank(d);
  if (ds.a === "sync-all") { S.deals.filter((x) => x.payments.length).forEach(syncBank); S.sync = ""; if (r.name === "reglages") S.flash = { text: "Relevé relu : les paiements retrouvés sont rapprochés." }; }

  /* Deal: quote and event sheet */
  const qd = (previewed() && previewed().d) || d;
  if (ds.a === "q-add" && qd) { qd.quote = qd.quote ?? quoteOf(qd); qd.quote.push({ l: "", q: 1, p: 0 }); S.focus = `ql-${qd.quote.length - 1}-l`; }
  if (ds.qdel !== undefined && qd) { qd.quote = qd.quote ?? quoteOf(qd); if (qd.quote.length > 1) qd.quote.splice(Number(ds.qdel), 1); }
  if (ds.a === "q-make" && d) { const q = d.quote = d.quote ?? quoteOf(d), total = quoteTotal(q), syncAmount = Boolean(document.getElementById("q-sync")?.checked);
    let i = d.docs.findIndex((x) => x.slot === "devis");
    if (i < 0) { d.docs.push({ t: "Devis " + d.title, k: "gdoc", d: TODAY, st: "Brouillon", slot: "devis" }); i = d.docs.length - 1; log(d, "Document", `Devis généré : ${eur(total)}`); }
    else { d.docs[i].d = TODAY; d.docs[i].st = "Brouillon"; log(d, "Document", `Devis mis à jour : ${eur(total)}`); }
    if (syncAmount && total !== d.amount) { log(d, "Modification", `Montant : ${eur(d.amount)} → ${eur(total)}`); d.amount = total; }
    S.preview = { deal: d.id, i }; S.toast = "Devis prêt : relisez-le, puis envoyez-le par e-mail."; }
  if (ds.a === "pv-add" && d) { const g = (k) => (S.draft[k] ?? "").trim(), name = g("pv-name");
    if (name) { d.providers.push({ name, role: g("pv-role") || "Prestataire", phone: g("pv-phone"), at: g("pv-at") }); log(d, "Modification", `Prestataire ajouté : ${name}`); for (const k of ["pv-name", "pv-role", "pv-phone", "pv-at"]) delete S.draft[k]; S.focus = "pv-name"; } else S.focus = "pv-name"; }
  if (ds.pvdel !== undefined && d) { const p = d.providers.splice(Number(ds.pvdel), 1)[0]; if (p) log(d, "Modification", `Prestataire retiré : ${p.name}`); }
  if (ds.a === "rm-add" && d) { const g = (k) => (S.draft[k] ?? "").trim(), name = g("rm-name"), beds = Number(g("rm-beds"));
    if (name && beds > 0) { d.rooms.push({ name, beds, note: g("rm-note") }); log(d, "Modification", `Hébergement ajouté : ${name}, ${beds} couchages`); for (const k of ["rm-name", "rm-beds", "rm-note"]) delete S.draft[k]; S.focus = "rm-name"; } else S.focus = name ? "rm-beds" : "rm-name"; }
  if (ds.rmdel !== undefined && d) { const p = d.rooms.splice(Number(ds.rmdel), 1)[0]; if (p) log(d, "Modification", `Hébergement retiré : ${p.name}`); }

  /* Calendar */
  if (ds.a === "today") S.month = TODAY.slice(0, 7);
  if (ds.a === "toggle-free") S.showFree = !S.showFree;
  if (ds.a === "free") { S.showFree = true; S.month = (freeWeekends()[0]?.start ?? TODAY).slice(0, 7); location.hash = "reservations"; return; }
  if (ds.jump) { S.month = ds.jump; S.showFree = true; }
  render();
});
const DRAFTS = ["mail-subject", "mail-body", "wa-body", "mail-att", "note", "todo"], DRAFT_RE = /^(n|dn|ic|iv|ls|tk|pv|rm|act|an|sg)-/, QUOTE_RE = /^ql-(\d+)-([lqp])$/;
const isDraft = (id) => Boolean(id) && (DRAFT_RE.test(id) || DRAFTS.includes(id));
document.addEventListener("input", (e) => { const id = e.target.id, m = QUOTE_RE.exec(id ?? "");
  if (id === "mail-body") { S.draft[id] = clean(e.target.innerHTML); return; }
  if (id === "doc-edit") { const cur = previewed(); if (cur) cur.x.body = clean(e.target.innerHTML); return; }
  if (id === "ag-name" || id === "ag-mission") { const a = selAgent(); if (a) { a[id === "ag-name" ? "name" : "mission"] = e.target.value; const b = id === "ag-name" ? document.querySelector(`.agent[data-agent="${a.id}"] header b`) : null; if (b) b.textContent = e.target.value; } return; }
  const LIVE = { q: "q", cq: "cq", dq: "dq", mq: "mq" };
  if (LIVE[id]) { S[LIVE[id]] = e.target.value; render(); }
  else if (id === "pick-q" || id === "gq") { S.draft[id] = e.target.value; render(); }
  // A quote line is stored as it is typed and its totals are rewritten in place, so the field
  // being typed in is never redrawn.
  else if (m) { const pv = previewed(), d = (pv && pv.d) || deal(ctx().id); if (!d) return; d.quote = d.quote ?? quoteOf(d); const row = d.quote[Number(m[1])]; if (!row) return;
    row[m[2]] = m[2] === "l" ? e.target.value : Number(e.target.value) || 0;
    const cell = document.getElementById("qt-" + m[1]), sum = document.getElementById("q-total"); if (cell) cell.textContent = eur(row.q * row.p); if (sum) sum.textContent = eur(quoteTotal(d.quote)); const paper = document.querySelector(".drawer .stage .paper"); if (pv && paper) paper.innerHTML = docBody(pv.d, pv.x); }
  else if (isDraft(id)) { S.draft[id] = e.target.value; if (S.modalErr) { S.modalErr = ""; render(); } } });
document.addEventListener("change", (e) => { const r = ctx(), id = e.target.id, v = e.target.value;
  if (id === "mail-tpl") { const md = deal(r.id); if (md && MAIL_TPL[v]) { const [sub, html] = MAIL_TPL[v](md); S.draft["mail-subject"] = sub; S.draft["mail-body"] = html + signOff(); S.focus = "mail-body"; render(); } return; }
  if (id === "mail-var") { const md = deal(r.id); if (md && MAIL_VARS[v]) insertInMail(MAIL_VARS[v](md)); e.target.value = ""; return; }
  if (id && id.startsWith("ag-")) { const a = selAgent(); if (a && id === "ag-trigger") a.trigger = v; return; }
  if (e.target.matches("[data-docstatus]") && S.preview) { const cur = previewed();
    if (cur && cur.x.st !== "Signé") { const x = cur.x, was = inDraft(x); if (cur.d) log(cur.d, "Document", `${x.t} : ${x.st ?? "Brouillon"} → ${v}`); x.st = v;
      // In Drive too: out of the draft state the file itself refuses edits, back to draft it accepts them again.
      if (x.did && S.drive.on && was !== inDraft(x)) api("POST", "/api/drive/docs/lock", { id: x.did, locked: !inDraft(x), reason: `${v} (Les jardins de Campagne)` }).then((r) => { if (r.status !== 200) { S.notice = `Le verrou du document dans Google Drive n'a pas pu être ${inDraft(x) ? "levé" : "posé"} : ${r.data.error || "refus"}.`; render(); } }, () => {});
      render(); } return; }
  if (e.target.matches("[data-doctype]") && S.preview) { const cur = previewed(), sl = SLOTS.find((s) => s.key === v);
    if (cur) { cur.x.slot = sl ? sl.key : undefined; if (cur.d) log(cur.d, "Document", `${cur.x.t} classé comme ${sl ? sl.label.toLowerCase() : "autre document"}`); S.toast = `Classé comme ${sl ? sl.label.toLowerCase() : "autre document"}.`; render(); } return; }
  // Moving a document to another deal, or back to the unfiled ones. It keeps its kind unless
  // the deal it arrives in already holds a document of that kind.
  if (e.target.matches("[data-docdeal]") && S.preview) { const cur = previewed(), to = deal(v);
    if (cur && !cur.sheet) { const x = cur.x;
      if (cur.d) { cur.d.docs.splice(S.preview.i, 1); log(cur.d, "Document", `${x.t} ${to ? `déplacé vers « ${to.title} »` : "remis dans les documents non classés"}`); } else S.library.splice(S.preview.lib, 1);
      if (to) { if (x.slot && to.docs.some((y) => y.slot === x.slot)) x.slot = undefined; to.docs.push(x); log(to, "Document", `${x.t} rattaché`); S.preview = { deal: to.id, i: to.docs.length - 1 }; S.toast = `Rangé dans « ${to.title} ».`; }
      else { S.library.push(x); S.preview = { lib: S.library.length - 1 }; S.toast = "Remis dans les documents non classés."; }
      render(); } return; }
  if (e.target.matches("[data-urole]")) { const u = S.users[Number(e.target.dataset.urole)]; if (u) { u.role = v; S.flash = { text: `${u.name} : rôle ${v}.` }; render(); } return; }
  const DOCF = { "d-kind": "dKind", "d-year": "dYear", "d-deal": "dDeal", "d-status": "dStatus" };
  if (DOCF[id]) { S[DOCF[id]] = v; S.exportMsg = ""; render(); return; }
  const PLAIN = { "f-kind": "kind", "c-kind": "cKind", "c-source": "cSource", "s-year": "sYear" };
  if (PLAIN[id]) { S[PLAIN[id]] = v; render(); return; }
  if (QUOTE_RE.test(id ?? "")) return;
  if (isDraft(id)) { S.draft[id] = v;
    // The windows whose content depends on what was just chosen are redrawn.
    if (id === "dn-deal") { const to = deal(v); if (to && to.docs.some((x) => x.slot === S.draft["dn-slot"])) S.draft["dn-slot"] = ""; render(); }
    if (id === "dn-slot" || id === "n-start" || id === "n-end") render();
    return; }
  if (e.target.matches("[data-status]") && r.name === "affaire") { const d = deal(r.id); S.notice = ""; S.flash = null;
    if (v === "Perdu") openLost();
    else if (d.status === "Perdu") { if (reopen(d) && v === "Gagné" && d.stage < 4) setStage(d, 4); }
    else if (v === "Gagné") setStage(d, 4);
    else S.notice = "Une affaire signée reste gagnée. Pour revenir en arrière, changez son étape.";
    render(); } });
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); S.modal = "search"; S.preview = null; S.menu = null; S.draft.gq = ""; render(); return; }
  if (e.key === "Escape" && S.preview && !S.edit && !S.payEdit && !S.modal && !S.menu) { closePanel(); render(); return; }
  if (e.key === "Escape" && S.peek && !S.edit && !S.payEdit && !S.modal && !S.menu) { closePeek(); render(); return; }
  if (e.key === "Escape" && (S.edit || S.payEdit || S.preview || S.modal || S.menu)) { if (S.modal === "confirm") { S.modal = null; S.confirm = null; } else S.edit = S.payEdit = S.preview = S.modal = S.pending = S.menu = S.pick = S.confirm = null; S.modalErr = ""; S.docEdit = false; render(); return; }
  if (e.key !== "Enter") return;
  if (e.target.id === "doc-name") { document.querySelector('[data-a="doc-rename-ok"]')?.click(); return; }
  if (e.target.id === "wa-body") { document.querySelector('[data-a="wa-send"]')?.click(); return; }
  if (e.target.id === "gq") { document.querySelector(".searchm .pick")?.click(); return; }
  if (e.target.id === "todo") { document.querySelector('[data-a="todo"]')?.click(); return; }
  if (e.target.matches(".eform input")) { e.target.closest(".eform").querySelector(".btn")?.click(); return; }
  if (e.target.matches(".payform input")) { e.target.closest(".acts").querySelector(".btn.green")?.click(); return; }
  if (e.target.matches(".modal input")) { document.querySelector(".modal > footer .btn:not(.alt)")?.click(); return; }
  if (S.edit && e.target.matches("input")) document.querySelector('[data-a="save"]')?.click(); });
// Drag a card from one column of the pipeline to another. The card is a link, so it is draggable
// in every browser (a button is not, in Firefox) and still opens the deal on a plain click.
let dragId = null;
document.addEventListener("dragstart", (e) => { const c = e.target.closest ? e.target.closest(".deal[data-id]") : null; if (!c) return;
  dragId = c.dataset.id; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId); c.classList.add("dragging"); });
document.addEventListener("dragend", () => { dragId = null; document.querySelectorAll(".col.over, .deal.dragging").forEach((x) => x.classList.remove("over", "dragging")); });
document.addEventListener("dragover", (e) => { const col = e.target.closest ? e.target.closest(".col[data-col]") : null; if (!col || !dragId) return;
  e.preventDefault(); e.dataTransfer.dropEffect = "move"; document.querySelectorAll(".col.over").forEach((x) => { if (x !== col) x.classList.remove("over"); }); col.classList.add("over"); });
document.addEventListener("drop", (e) => { const col = e.target.closest ? e.target.closest(".col[data-col]") : null; if (!col || !dragId) return;
  e.preventDefault(); const d = deal(dragId); dragId = null; S.notice = ""; if (d) setStage(d, Number(col.dataset.col)); render(); });
window.addEventListener("hashchange", () => { S.menu = null; S.peek = null; render(); window.scrollTo(0, 0); });
/* ---------- Server: load, save what changed, follow what others change ---------- */
// Features drawn by the pages but not plugged in yet: their entry points are taken out of the
// page before it is shown, so nothing on screen pretends to work.
/* ---------- Audit: is every stay of a season complete and consistent? ---------- */
// Amounts with their cents when they have some (an Airbnb share, a bank fee), whole euros otherwise.
const eur2 = (n) => (Number.isInteger(n) ? eur(n) : new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n).replace(/ /g, " ") + " €");
const AUDIT_CELLS = [["dates", "Dates"], ["contrat", "Contrat"], ["acompte", "Acompte"], ["solde", "Solde"], ["caution", "Caution"], ["assurance", "Assurance"], ["fiche", "Fiche"], ["mails", "E-mails"]];
const LVL = { bad: 3, warn: 2, info: 1, ok: 0 }, LVL_LABEL = { bad: "Bloquant", warn: "À vérifier", info: "OK", ok: "OK" }, LVL_TONE = { bad: "t-red", warn: "t-orange", info: "t-green", ok: "t-green" };
const gotOf = (p) => p.got ?? p.amount;
// The first day the imported bank statement covers: what was paid earlier cannot be checked against it.
// An export covers whole years, and only its credits are kept here: the year of the oldest one stands for its start.
const stmtStart = () => (S.bankStatement.length ? S.bankStatement.reduce((m, t) => (t.on < m ? t.on : m), "9999").slice(0, 4) + "-01-01" : "");
const bankKeys = () => { const k = new Set(); S.deals.forEach((d) => d.payments.forEach((p) => { if (p.bank && p.paidOn && !p.hold) k.add(p.paidOn + "|" + p.bank); if (p.inBank) k.add(p.inOn + "|" + p.inBank); })); return k; };
const looseLines = (yr) => { const k = bankKeys(); return S.bankStatement.filter((t) => !t.used && !t.skip && !k.has(t.on + "|" + t.label) && (yr === "all" || t.on.startsWith(yr))); };
// What the page checks for one stay. Each remark names the column it belongs to; the worst remark colours the column.
function auditDeal(d) {
  const out = [], add = (c, lvl, t) => out.push({ c, lvl, t }), src = d.src ?? {}, past = d.end < TODAY, start = stmtStart();
  const family = d.kind === "Famille", lost = d.status === "Perdu", firm = d.stage >= 4 && !lost;
  const same = (s) => s && s.start && (s.start !== d.start || s.end !== d.end);
  if (same(src.contract)) add("dates", "bad", `Dates du contrat (${range(src.contract.start, src.contract.end)}) différentes de celles du séjour (${range(d.start, d.end)}).`);
  if (same(src.fiche)) add("dates", "warn", `Dates de la fiche (${range(src.fiche.start, src.fiche.end)}) différentes de celles du séjour (${range(d.start, d.end)}).`);
  if (same(src.cal)) add("dates", "warn", `Dates du calendrier (${range(src.cal.start, src.cal.end)}) différentes de celles du séjour (${range(d.start, d.end)}).`);
  if (!lost) S.deals.filter((o) => o !== d && o.status !== "Perdu" && o.stage >= 2 && d.stage >= 2 && o.start < d.end && d.start < o.end).forEach((o) => add("dates", "bad", `Chevauchement avec « ${o.title} » (${range(o.start, o.end)}).`));
  const g = [["contrat", src.contract?.guests], ["fiche", src.fiche?.guests], ["calendrier", src.cal?.guests]].filter((x) => x[1]);
  // Once a stay is over, what can no longer be acted on is kept as a plain remark.
  if (!lost && new Set(g.map((x) => x[1])).size > 1) add("fiche", !past && src.contract?.guests && Math.max(...g.map((x) => x[1])) > src.contract.guests * 1.2 ? "warn" : "info", "Nombre d'invités différent selon la source : " + g.map((x) => `${x[0]} ${x[1]}`).join(", ") + ".");
  if (!family && d.stage >= 2) {
    if (!d.contact.email) add("mails", "warn", "Adresse e-mail du contact manquante.");
    if (!d.mails || !d.mails.threads) add("mails", "info", "Aucune conversation Gmail rattachée.");
    const has = (k) => d.docs.find((x) => x.slot === k), contract = has("contrat");
    if (d.stage >= 4 || lost) {
      if (!contract) add("contrat", d.signed ? "warn" : "bad", d.signed ? `Contrat signé le ${fr(d.signed)}, mais absent du dossier.` : "Aucun contrat dans le dossier.");
      else if (contract.st !== "Signé") add("contrat", "warn", "Le contrat du dossier n'est pas la version signée.");
      else if (!d.signed) add("contrat", "info", "Contrat signé, date de signature non relevée.");
    }
    if (firm) {
      const inc = income(d), exp = inc.reduce((s, p) => s + p.amount, 0), paid = inc.filter((p) => p.status === "paid"), rec = paid.reduce((s, p) => s + gotOf(p), 0);
      if (!d.amount) add("solde", "bad", `Montant total inconnu${rec ? ` (${eur2(rec)} déjà encaissés)` : ""}.`);
      else if (inc.length && Math.abs(exp - d.amount) > 0.005) add("solde", "warn", `L'échéancier (${eur2(exp)}) ne correspond pas au montant du contrat (${eur2(d.amount)}).`);
      if (!inc.length && d.amount) add("solde", "bad", "Aucune ligne d'encaissement.");
      inc.forEach((p) => { const c = p.id.startsWith("dep") ? "acompte" : "solde", note = p.note ? " " + p.note : "";
        if (p.status === "due") { if (p.due < TODAY) add(c, "bad", `${p.kind} non reçu : ${eur2(p.amount)}, échéance du ${fr(p.due)}.${note}`); return; }
        if (p.status !== "paid") return;
        if (Math.abs(gotOf(p) - p.amount) > 0.005) add(c, "warn", `${p.kind} : ${eur2(gotOf(p))} reçus pour ${eur2(p.amount)} prévus (écart de ${eur2(Math.abs(p.amount - gotOf(p)))}).${note}`);
        else if (p.note) add(c, "info", `${p.kind} : ${p.note}`);
        if (!p.bank) { const before = !start || !p.due || p.due < start, bill = p.proof === "facture" ? ", facture trouvée" : "";
          add(c, !start || before ? "info" : "warn", !start ? `${p.kind} (${eur2(p.amount)}) noté reçu, sans rapprochement bancaire : importez le relevé.`
            : before ? `${p.kind} (${eur2(p.amount)}) ${p.due ? `reçu avant le début du relevé (${fr(start)})` : "noté reçu, date inconnue et absent du relevé"}${bill} : non vérifiable ici.` : `${p.kind} (${eur2(p.amount)}) noté reçu mais introuvable sur le relevé${bill}.`); }
        else if (p.due && p.paidOn && dayDiff(p.due, p.paidOn) > 3) { const n = dayDiff(p.due, p.paidOn); add(c, "info", `${p.kind} payé le ${fr(p.paidOn)}, ${n} jours après l'échéance du ${fr(p.due)}.`); } });
      const bills = [["acompte", "dep", "d'acompte"], ["solde", "bal", "de solde"]].filter(([slot, id]) => inc.some((p) => p.id.startsWith(id)) && !has(slot));
      if (bills.length) add(bills[0][0], "warn", `Facture ${bills.map((x) => x[2]).join(" et facture ")} absente${bills.length > 1 ? "s" : ""} du dossier.`);
      const h = d.payments.find((p) => p.hold);
      if (!h) add("caution", past ? "info" : "warn", "Aucune caution prévue.");
      else { if (h.note) add("caution", "info", "Caution : " + h.note);
        if (h.got != null && h.got < h.amount) add("caution", "bad", `Caution : ${eur2(h.got)} obtenus${h.how ? " (" + h.how + ")" : ""} pour ${eur2(h.amount)} prévus au contrat.`);
        if (!has("caution") && !h.inOn && !h.how) add("caution", past ? "info" : "warn", `Caution de ${eur2(h.amount)} : aucune trace, ni document ni virement.`);
        if (h.inOn && !h.back && past && dayDiff(d.end, TODAY) > 14) add("caution", "bad", `Caution de ${eur2(h.got ?? h.amount)} reçue par virement le ${fr(h.inOn)} et pas encore rendue.`);
        if (h.back) add("caution", h.back.amount === (h.got ?? h.amount) ? "info" : "warn", `Caution reçue par virement${h.inOn ? " le " + fr(h.inOn) : ""}, ${eur2(h.back.amount)} rendus le ${fr(h.back.on)} (${dayDiff(d.end, h.back.on)} jours après le départ).`); }
      if (!has("assurance")) add("assurance", past ? "info" : "warn", "Attestation d'assurance absente du dossier.");
      if (!(d.sheet ?? []).length && !d.providers.length) add("fiche", past ? "info" : "warn", "Pas de fiche d'information (lieux, prestataires, besoins).");
    }
  }
  (d.refunds ?? []).forEach((r) => add("solde", "info", `Remboursement de ${eur2(r.amount)} le ${fr(r.on)}.`));
  (d.findings ?? []).forEach((f) => add(f.c ?? "note", LVL[f.lvl] !== undefined ? f.lvl : "info", f.t));
  const seen = new Set(d.auditOk ?? []); out.forEach((i) => { i.ok = seen.has(i.t); });
  const open = out.filter((i) => !i.ok), worst = open.reduce((m, i) => (LVL[i.lvl] > LVL[m] ? i.lvl : m), "ok");
  const cells = Object.fromEntries(AUDIT_CELLS.map(([k]) => [k, open.filter((i) => i.c === k).reduce((m, i) => (LVL[i.lvl] > LVL[m] ? i.lvl : m), "ok")]));
  if (family || d.stage < 2) AUDIT_CELLS.forEach(([k]) => { if (k !== "dates") cells[k] = "na"; });
  else if (!firm) ["acompte", "solde", "caution", "assurance", "fiche"].forEach((k) => { if (cells[k] === "ok") cells[k] = "na"; });
  return { items: out.sort((a, b) => LVL[b.lvl] - LVL[a.lvl]), worst, cells, bad: open.filter((i) => i.lvl === "bad").length, warn: open.filter((i) => i.lvl === "warn").length };
}
const auditYears = () => [...new Set(S.deals.map((d) => d.start.slice(0, 4)))].sort();
const auditSet = (yr) => S.deals.filter((d) => yr === "all" || d.start.startsWith(yr)).sort((a, b) => (a.start < b.start ? -1 : 1));
// The number shown in the menu: stays of the current season with something blocking.
const auditCount = () => auditSet(S.auditYear).filter((d) => auditDeal(d).worst === "bad").length;
function auditItems(d, a) {
  return `<ul class="aitems">${a.items.map((i) => `<li class="${i.lvl} ${i.ok ? "seen" : ""}"><i class="adot"></i><span>${esc(i.t)}</span>${i.lvl === "info" ? "" : `<button class="link" data-aok="${d.id}" data-t="${esc(i.t)}">${i.ok ? "Rouvrir" : "Marquer comme traité"}</button>`}</li>`).join("") || `<li class="ok"><i class="adot"></i><span>Rien à signaler.</span></li>`}</ul>`;
}
function viewAudit() {
  const years = auditYears(); if (S.auditYear !== "all" && !years.includes(S.auditYear) && years.length) S.auditYear = years.includes(TODAY.slice(0, 4)) ? TODAY.slice(0, 4) : years[years.length - 1];
  const yr = S.auditYear, all = auditSet(yr).map((d) => ({ d, a: auditDeal(d) })), kept = all.filter((x) => x.d.status !== "Perdu"), gone = all.filter((x) => x.d.status === "Perdu");
  const firm = kept.filter((x) => x.d.stage >= 4 && x.d.kind !== "Famille"), n = (lvl) => all.filter((x) => (lvl === "ok" ? LVL[x.a.worst] < 2 : x.a.worst === lvl)).length;
  const total = firm.reduce((s, x) => s + x.d.amount, 0), rec = firm.reduce((s, x) => s + income(x.d).filter((p) => p.status === "paid").reduce((t, p) => t + gotOf(p), 0), 0);
  const owed = firm.reduce((s, x) => s + income(x.d).filter((p) => p.status === "due").reduce((t, p) => t + p.amount, 0), 0), loose = looseLines(yr);
  const tab = S.auditTab, shown = all.filter((x) => tab === "all" || (tab === "ok" ? LVL[x.a.worst] < 2 : x.a.worst === tab));
  const kpi = (l, v, sub, tone = "") => `<div class="card kpi"><span class="l">${l}</span><span class="v num ${tone}">${v}</span><span class="ks">${sub}</span></div>`;
  const row = ({ d, a }) => { const openRow = Boolean(S.auditOpen[d.id]), lost = d.status === "Perdu";
    return `<div class="arow ${openRow ? "open" : ""}"><button class="ahead" data-aopen="${d.id}" aria-expanded="${openRow}">
        <span class="cell"><small class="num">${range(d.start, d.end)}${lost ? " · annulé" : ""}</small><b>${esc(d.title)}</b></span>
        <span class="mini st ${LVL_TONE[a.worst]}">${LVL_LABEL[a.worst]}</span>
        <span class="acells">${AUDIT_CELLS.map(([k, l]) => `<i class="ac ${a.cells[k]}" title="${l}">${l}</i>`).join("")}</span>
        <span class="cell r"><small>${a.bad ? `${a.bad} bloquant${a.bad > 1 ? "s" : ""}` : ""}${a.bad && a.warn ? " · " : ""}${a.warn ? `${a.warn} à vérifier` : ""}${!a.bad && !a.warn ? "rien à traiter" : ""}</small><b class="num">${d.amount ? eur2(d.amount) : d.stage >= 4 && d.kind !== "Famille" ? "montant ?" : ""}</b></span>${ico(openRow ? "chev" : "right", "s")}</button>
      ${openRow ? `<div class="abody">${auditItems(d, a)}<div class="afoot"><span class="hint">${d.mails?.threads ? `${d.mails.threads} conversation${d.mails.threads > 1 ? "s" : ""} Gmail, dernier échange le ${fr(d.mails.last)} · ` : ""}${d.docs.length} document${d.docs.length > 1 ? "s" : ""}</span><button class="btn alt sm" data-go="affaire-${d.id}">Ouvrir l'affaire</button></div></div>` : ""}</div>`; };
  const seg = `<div class="seg">${[...years, "all"].map((y) => `<button class="${yr === y ? "on" : ""}" data-ayear="${y}">${y === "all" ? "Tout" : y}</button>`).join("")}</div>`;
  const tabs = [["all", "Tous", all.length], ["bad", "Bloquants", n("bad")], ["warn", "À vérifier", n("warn")], ["ok", "OK", n("ok")]];
  return topbar("Audit", seg, "", "Chaque séjour confronté à la fiche, au calendrier, aux contrats, aux e-mails et au relevé bancaire.") + `<div class="content audit">
    ${S.bankStatement.length || !isAdmin() ? "" : `<div class="finwarn">${ico("alert", "s")}<span>Aucun relevé bancaire importé : les encaissements ne peuvent pas être vérifiés.</span><button class="link" data-go="reglages">Importer le relevé</button></div>`}
    <div class="kpis">${kpi("Séjours", all.length, `${firm.length} confirmés${gone.length ? ` · ${gone.length} annulé${gone.length > 1 ? "s" : ""}` : ""}`)}${kpi("Points bloquants", all.reduce((s, x) => s + x.a.bad, 0), `sur ${n("bad")} séjour${n("bad") > 1 ? "s" : ""}`, all.some((x) => x.a.bad) ? "red" : "green")}
      ${kpi("À vérifier", all.reduce((s, x) => s + x.a.warn, 0), `${n("ok")} séjour${n("ok") > 1 ? "s" : ""} sans remarque à traiter`)}${kpi("Encaissé", eur(rec), `sur ${eur(total)} de contrats${owed ? ` · ${eur(owed)} attendus` : ""}`)}
      ${!isAdmin() ? "" : kpi("Hors affaire", loose.length, loose.length ? `${eur(loose.reduce((s, t) => s + t.amount, 0))} reçus sans séjour rattaché` : "tous les encaissements sont rattachés", loose.length ? "orange" : "green")}</div>
    <div class="tabs">${tabs.map(([k, l, c]) => `<button class="${tab === k ? "on" : ""}" data-atab="${k}">${l} <span class="count num">${c}</span></button>`).join("")}</div>
    <div class="alist">${shown.map(row).join("") || `<span class="muted">Aucun séjour dans cette catégorie.</span>`}</div>
    ${!isAdmin() ? "" : `<section class="blk"><h3 class="h flex">Encaissements sans séjour rattaché <span class="count num">${loose.length}</span></h3>
      <p class="docnote">Lignes créditées sur le relevé ${yr === "all" ? "" : "de " + yr + " "}qu'aucune affaire ne réclame : acompte d'une saison suivante à saisir, remboursement d'un fournisseur, ou séjour oublié. Écartez celles qui ne concernent pas un séjour.</p>
      <div class="list">${loose.map((t) => `<div class="er"><span class="grow"><b>${esc(t.label)}</b><small class="num">${fr(t.on)}</small></span><span class="mini num">${eur2(t.amount)}</span>${isAdmin() ? `<button class="link" data-bskip="${esc(t.on + "|" + t.label + "|" + t.amount)}">Écarter</button>` : ""}</div>`).join("") || `<span class="muted">${S.bankStatement.length ? "Rien à rattacher." : "Importez d'abord le relevé bancaire."}</span>`}</div></section>`}</div>`;
}
// The same remarks, on the deal page.
function auditBlock(d) {
  const a = auditDeal(d); if (!a.items.length) return "";
  return `<section class="blk"><h3 class="h flex">Audit <span class="mini st ${LVL_TONE[a.worst]}">${LVL_LABEL[a.worst]}</span><button class="link" data-go="audit">Voir tout l'audit</button></h3>${auditItems(d, a)}</section>`;
}
const gmailUrl = (id) => `https://mail.google.com/mail/${S.mailbox ? "?authuser=" + encodeURIComponent(S.mailbox) : ""}#all/${encodeURIComponent(id)}`;
function mailsBlock(d) {
  const m = d.mails; if (!m || !m.threads) return "";
  return `<section class="blk"><h3 class="h flex">Conversations Gmail <span class="count num">${m.threads}</span></h3>
    <p class="docnote">${m.messages} messages (${m.received} reçus, ${m.sent} envoyés), du ${fr(m.first)} au ${fr(m.last)}. Chaque ligne ouvre la conversation dans Gmail.</p>
    <div class="docs">${(m.list ?? []).map((t) => `<a class="drow" href="${gmailUrl(t.id)}" target="_blank" rel="noopener"><span class="kb gdoc">${ico("mail", "xs")}</span><span class="grow"><b>${esc(t.subject || "(sans objet)")}</b><small class="num">${t.n} message${t.n > 1 ? "s" : ""} · ${t.first === t.last ? fr(t.last) : `${fr(t.first)} au ${fr(t.last)}`}</small></span>${ico("right", "s")}</a>`).join("")}</div></section>`;
}
// A season file prepared outside the app: every field is checked again here, nothing is trusted as it comes.
function importSeason(file) {
  const str = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : ""), num = (v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0), isDay = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v), day = (v) => (isDay(v) ? v : null);
  const time = (v, dflt) => (typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : dflt), web = (v) => (typeof v === "string" && /^https:\/\/(drive|docs)\.google\.com\//.test(v) ? v.slice(0, 300) : ""), list = (v) => (Array.isArray(v) ? v : []);
  let added = 0, updated = 0, skipped = 0;
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(file.mailbox ?? "")) S.mailbox = file.mailbox;
  // The lessor's details for the agreements: taken from the file where nothing was typed by hand yet.
  if (file.lessor && typeof file.lessor === "object") LESSOR_FIELDS.map(([k]) => k).forEach((k) => { if (!S.lessor[k] && str(file.lessor[k], 160)) S.lessor = { ...S.lessor, [k]: str(file.lessor[k], 160) }; });
  list(file.deals).forEach((r) => {
    if (!r || !/^[a-z0-9-]{3,40}$/.test(r.id ?? "") || !str(r.title, 80) || !isDay(r.start) || !isDay(r.end) || r.end < r.start) { skipped++; return; }
    const c = r.contact ?? {}, guests = Math.round(num(r.guests)), stage = Number.isInteger(r.stage) ? Math.max(0, Math.min(5, r.stage)) : 4;
    const d = mk(r.id, str(r.title, 80), KIND[r.kind] !== undefined ? r.kind : "Séjour", stage, num(r.amount), r.start, r.end, guests, Math.min(22, Math.round(num(r.sleeping)) || Math.min(22, guests)), SOURCES.includes(r.source) ? r.source : "Non renseignée",
      { name: str(c.name, 80) || str(r.title, 80), email: str(c.email, 120), phone: str(c.phone, 40), address: str(c.address, 160) }, { signed: day(r.signed) ?? r.start, payments: [] });
    d.signed = day(r.signed); d.arrival = time(r.arrival, "16:00"); d.departure = time(r.departure, "18:00"); d.status = ["En cours", "Gagné", "Perdu"].includes(r.status) ? r.status : d.status; d.lostReason = str(r.lostReason, 80);
    d.tenants = list(r.tenants).map((t) => str(t, 80)).filter(Boolean).slice(0, 4); if (!d.tenants.length) d.tenants = [d.contact.name]; if (d.tenants.length < 2) d.tenants.push("");
    d.payments = list(r.payments).filter((p) => p && /^[a-z0-9]{2,8}$/.test(p.id ?? "") && ["paid", "due", "held", "released"].includes(p.status)).slice(0, 12).map((p) => ({ id: p.id, kind: str(p.kind, 40) || "Paiement", amount: num(p.amount), due: day(p.due) ?? (p.status === "paid" ? null : r.start), status: p.status, paidOn: day(p.paidOn), bank: str(p.bank, 200) || null,
      ...(p.hold === true ? { hold: true } : {}), ...(typeof p.got === "number" ? { got: num(p.got) } : {}), ...(str(p.note, 300) ? { note: str(p.note, 300) } : {}), ...(str(p.proof, 20) ? { proof: str(p.proof, 20) } : {}), ...(str(p.how, 20) ? { how: str(p.how, 20) } : {}),
      ...(isDay(p.inOn) ? { inOn: p.inOn, inBank: str(p.inBank, 200) } : {}), ...(p.back && isDay(p.back.on) ? { back: { on: p.back.on, amount: num(p.back.amount), label: str(p.back.label, 200) } } : {}) }));
    d.docs = list(r.docs).filter((x) => x && str(x.t, 120) && web(x.url)).slice(0, 30).map((x) => ({ t: str(x.t, 120), k: BADGE[x.k] ? x.k : "file", d: day(x.d) ?? TODAY, st: DOC_ST[x.st] !== undefined ? x.st : "Reçu", url: web(x.url), ...(SLOTS.some((s) => s.key === x.slot) ? { slot: x.slot } : {}) }));
    d.providers = list(r.providers).slice(0, 20).map((p) => ({ name: str(p?.name, 80), role: str(p?.role, 40), phone: str(p?.phone, 40), at: time(p?.at, "") })).filter((p) => p.name);
    d.sheet = list(r.sheet).slice(0, 40).map((x) => ({ k: str(x?.k, 60), v: str(x?.v, 600) })).filter((x) => x.k && x.v);
    if (isDay(r.eventDay)) d.eventDay = r.eventDay;
    const m = r.mails; if (m && Number.isInteger(m.threads) && isDay(m.first) && isDay(m.last)) d.mails = { threads: m.threads, messages: Math.round(num(m.messages)), received: Math.round(num(m.received)), sent: Math.round(num(m.sent)), first: m.first, last: m.last,
      list: list(m.list).filter((t) => t && /^[0-9a-f]{10,20}$/.test(t.id ?? "") && isDay(t.first) && isDay(t.last)).slice(0, 12).map((t) => ({ id: t.id, first: t.first, last: t.last, n: Math.round(num(t.n)), subject: str(t.subject, 120) })) };
    const side = (s) => (s && typeof s === "object" ? { ...(isDay(s.start) && isDay(s.end) ? { start: s.start, end: s.end } : {}), ...(Number.isFinite(s.guests) ? { guests: s.guests } : {}), ...(Number.isFinite(s.amount) ? { amount: s.amount } : {}), ...(str(s.state, 20) ? { state: str(s.state, 20) } : {}) } : null);
    d.src = Object.fromEntries(["fiche", "cal", "contract"].map((k) => [k, side(r.src?.[k])]).filter((x) => x[1]));
    if (web(r.folderUrl)) d.folderUrl = web(r.folderUrl);
    d.findings = list(r.findings).slice(0, 20).map((f) => ({ lvl: LVL[f?.lvl] !== undefined ? f.lvl : "info", t: str(f?.t, 400) })).filter((f) => f.t);
    d.refunds = list(r.refunds).filter((x) => x && isDay(x.on)).slice(0, 6).map((x) => ({ on: x.on, amount: num(x.amount), label: str(x.label, 200) }));
    d.history = [{ type: "Modification", t: `Affaire importée de la saison ${str(String(file.season ?? ""), 4)}`, at: stamp(), by: me().name }];
    const at = S.deals.findIndex((o) => o.id === d.id);
    // A second import refreshes what came from the file and keeps what was done by hand since.
    if (at >= 0) { const old = S.deals[at]; d._v = old._v; d.auditOk = old.auditOk ?? []; d.todos = old.todos; d.pinned = old.pinned; d.history = old.history; d.rooms = old.rooms; d.docs = d.docs.concat(old.docs.filter((x) => !x.url)); S.deals[at] = d; updated++; }
    else { d.auditOk = []; S.deals.push(d); added++; }
  });
  S.auditYear = String(file.season ?? S.auditYear);
  S.flash = { text: `${added} séjour${added > 1 ? "s" : ""} importé${added > 1 ? "s" : ""}, ${updated} mis à jour${skipped ? `, ${skipped} ignoré${skipped > 1 ? "s" : ""}` : ""}. L'audit est prêt.` }; location.hash = "audit"; render();
}
const OFF = ['a[href="#messages"]', 'a[href="#openspace"]', '[data-comp="E-mail"]', '[data-comp="WhatsApp"]', '[data-a="doc-mail"]', '[data-a="sig-new"]', '[data-a="sim"]', '[data-msg*="Dans l\'application"]', '.mepop .eyebrow', '.mepop .seg', '[data-a="doc-open"]', '[data-a="remind"]', '[data-a="quote-new"] + [data-a="doc-toast"]'].join(",");
const OFF_CARDS = ["Pennylane", "Signature électronique", "Messagerie"];
function paint(html) {
  const tpl = document.createElement("template"); tpl.innerHTML = html;
  tpl.content.querySelectorAll(OFF).forEach((el) => el.remove());
  tpl.content.querySelectorAll(".setcard").forEach((card) => { if (OFF_CARDS.includes(card.querySelector("h3")?.textContent ?? "")) card.remove(); });
  Idiomorph.morph(document.getElementById("app"), [...tpl.content.childNodes], { morphStyle: "innerHTML", ignoreActiveValue: true });
}
const when = (isoTime) => { const d = new Date(isoTime); return Number.isNaN(d.getTime()) ? isoTime : `${fr(d.toISOString().slice(0, 10))} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`; };
const CLIENT = Math.random().toString(36).slice(2);
async function api(method, path, body) {
  const res = await fetch(path, { method, headers: { "content-type": "application/json", "x-client": CLIENT }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.status === 401) { S.user = null; location.hash = "connexion"; render(); throw new Error("Session terminée"); }
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
async function uploadFile(file, dealId) {
  const fd = new FormData(); fd.append("file", file); if (dealId) fd.append("deal", dealId);
  const res = await fetch("/api/files", { method: "POST", body: fd, headers: { "x-client": CLIENT } }).catch(() => null);
  const out = res ? await res.json().catch(() => ({})) : {};
  if (!res || !res.ok) throw new Error(out.error || "Envoi impossible : vérifiez la connexion.");
  return out;
}
// What the server holds, as text, per deal and per setting: a save sends only what differs.
const saved = new Map(), savedSettings = {};
const plain = (d) => { const { _v, _hidden, ...rest } = d; return JSON.stringify(rest); };
const SETTINGS = {
  prefs: () => ({ buffer: S.buffer, deposit: TERMS.deposit, hold: TERMS.hold, plSeq: S.plSeq, sources: S.sources, mailbox: S.mailbox, lessor: S.lessor }),
  library: () => S.library,
  bank: () => ({ lines: S.bankStatement, last: S.lastBank }),
};
const usersOut = () => S.users.map((u) => ({ email: u.email, name: u.name, role: u.role === "Équipe" ? "team" : "admin" }));
function applySettings(st) {
  const p = st.settings.prefs ?? {}, bank = st.settings.bank ?? {};
  S.buffer = p.buffer ?? 0; TERMS.deposit = p.deposit ?? 30; TERMS.hold = p.hold ?? 2500; S.plSeq = p.plSeq ?? { D: 0, F: 0 }; S.sources = p.sources ?? []; S.mailbox = p.mailbox ?? ""; S.lessor = p.lessor ?? {};
  S.library = st.settings.library ?? []; S.bankStatement = bank.lines ?? []; S.lastBank = bank.last ?? "jamais"; S.feeds = st.settings.feeds ?? []; S.admin = st.admin ?? null; S.drive = st.drive ?? { on: false };
  const mine = st.user.email;
  S.users = [...st.users].sort((a, b) => Number(b.email === mine) - Number(a.email === mine)).map((u) => ({ email: u.email, name: u.name || u.email.split("@")[0], role: u.role === "admin" ? "Admin" : "Équipe", pending: u.pending }));
  for (const k of Object.keys(SETTINGS)) savedSettings[k] = JSON.stringify(SETTINGS[k]());
  savedSettings.users = JSON.stringify(usersOut());
}
// A page left open does not know the app has moved on. It asks now and then, and when it comes back to
// the front: with nothing in progress it reloads by itself, otherwise it says so and waits for a click.
async function checkBuild() {
  if (!S.user || !S.build) return;
  const r = await fetch("/api/build", { headers: { "x-client": CLIENT } }).then((x) => (x.ok ? x.json() : null), () => null);
  if (!r || !r.build || r.build === S.build) return;
  const busy = S.modal || S.edit || S.payEdit || S.preview || S.peek || Object.values(S.draft).some((v) => v) || saving;
  if (!busy) { location.reload(); return; }
  if (!S.stale) { S.stale = true; render(); }
}
function applyState(st) {
  S.user = st.user; S.role = st.user.role === "admin" ? "admin" : "team"; S.build = st.build ?? "";
  S.deals = st.deals; saved.clear(); for (const d of S.deals) saved.set(d.id, plain(d));
  applySettings(st);
}
function putDeal(doc) { const at = S.deals.findIndex((d) => d.id === doc.id); if (at >= 0) S.deals[at] = doc; else S.deals.unshift(doc); saved.set(doc.id, plain(doc)); }
const saveState = (text, bad = false) => { const el = document.getElementById("savestate"); if (!el) return; el.hidden = text === ""; el.textContent = text; el.classList.toggle("bad", bad); };
let saving = false, again = false, saveTimer = null;
function queueSave() { if (!S.user) return; clearTimeout(saveTimer); saveTimer = setTimeout(() => { persist(); }, 300); }
async function persist() {
  if (!S.user) return;
  if (saving) { again = true; return; }
  saving = true;
  try {
    let wrote = false, redraw = false;
    for (const d of [...S.deals]) {
      const json = plain(d), had = saved.get(d.id);
      if (had === json) continue;
      wrote = true; saveState("Enregistrement");
      const r = had === undefined ? await api("POST", "/api/deals", { doc: JSON.parse(json) }) : await api("PUT", "/api/deals/" + encodeURIComponent(d.id), { doc: JSON.parse(json), version: d._v });
      if (r.status === 200) { d._v = r.data.version; saved.set(d.id, json); driveSync(d); driveDocsSync(d); }
      // Someone saved this deal in between: show their version rather than overwrite it.
      else if (r.status === 409 && r.data.deal) { putDeal(r.data.deal); S.notice = `« ${d.title} » a été modifiée ailleurs entre-temps. La page affiche la dernière version : votre dernière action est à refaire.`; redraw = true; }
      else if (r.status === 404) { S.deals = S.deals.filter((x) => x !== d); saved.delete(d.id); S.notice = `« ${d.title} » a été supprimée ailleurs.`; redraw = true; }
      else throw new Error(r.data.error || "refus du serveur");
    }
    const live = new Set(S.deals.map((d) => d.id));
    for (const id of [...saved.keys()]) if (!live.has(id)) { wrote = true; const r = await api("DELETE", "/api/deals/" + encodeURIComponent(id)); if (r.status !== 200) throw new Error(r.data.error || "suppression refusée"); saved.delete(id); }
    for (const k of Object.keys(SETTINGS)) { const json = JSON.stringify(SETTINGS[k]()); if (json === savedSettings[k]) continue; if ((k === "prefs" || k === "bank") && !isAdmin()) continue;
      wrote = true; const r = await api("PUT", "/api/settings/" + k, { value: JSON.parse(json) }); if (r.status !== 200) throw new Error(r.data.error || "réglage refusé"); savedSettings[k] = json; }
    if (isAdmin()) { const json = JSON.stringify(usersOut()); if (json !== savedSettings.users) { wrote = true; const r = await api("PUT", "/api/users", { users: JSON.parse(json) }); if (r.status !== 200) throw new Error(r.data.error || "utilisateurs refusés"); savedSettings.users = json; } }
    if (wrote) { saveState("Enregistré"); setTimeout(() => { if (!saving) saveState(""); }, 1500); }
    if (redraw) render();
  } catch (e) {
    saveState(`Non enregistré (${e.message}). Nouvel essai dans 5 s.`, true); setTimeout(queueSave, 5000);
  } finally {
    saving = false; if (again) { again = false; queueSave(); }
  }
}
// One Drive folder per stay: in "Prospects" until it is signed, in "Clients" afterwards, named after
// the stay. Asked for once a deal is saved, and again only when its place or its name changes. A stay
// that is over gets no folder of its own accord.
const driveBusy = new Set();
const driveWant = (d) => ({ client: d.stage >= 4 && d.status !== "Perdu", name: d.start && d.end ? `${d.title} ${range(d.start, d.end)}` : d.title });
// A draft created in Drive from a model follows its deal: when a value of the deal changes, the page is
// written again. Typing in the document in Google Docs stops that (the server sees it was edited), until
// the person asks to overwrite it. `sum` is what was last written, `stamp` when.
const hash = (t) => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const docTemplate = (d, x) => docBody(d, { t: x.t, k: x.k, slot: x.slot, d: x.d });
const docBusy = new Set();
function driveDocsSync(d, forced = null) {
  if (!S.drive.on) return;
  d.docs.forEach((x) => { if (!x.did || !driveLive(x) || x.gone || docBusy.has(x.did) || (x.edited && forced !== x)) return;
    const html = docTemplate(d, x), sum = hash(html); if (sum === x.sum && forced !== x) return;
    docBusy.add(x.did);
    api("POST", "/api/drive/docs/refresh", { id: x.did, title: x.t, html, stamp: x.stamp ?? "", force: forced === x }).then((r) => { docBusy.delete(x.did); if (r.status !== 200) return;
      if (r.data.gone) x.gone = true; else if (r.data.edited) x.edited = true; else { x.sum = sum; x.stamp = r.data.stamp ?? ""; delete x.edited; if (forced === x) S.toast = "Document remis à jour depuis la fiche."; }
      render(); }, () => docBusy.delete(x.did)); });
}
// A real Google Docs file for a deal, filled from it, filed in its Drive folder and opened in the panel.
// Used by every way of creating a document from a model once Drive is connected.
function driveCreate(d, x, title) {
  if (S.creating) return; S.creating = x.slot ?? "libre";
  const fail = (why) => { S.creating = ""; if (S.modal === "doc-new") S.modalErr = `Document non créé : ${why}.`; else S.notice = `Document non créé : ${why}.`; render(); };
  const html = docTemplate(d, { ...x, t: title });
  api("POST", "/api/drive/docs", { dealId: d.id, title, html, folder: d.driveFolder ?? "", ...driveWant(d) }).then((r) => { if (r.status !== 200) { fail(r.data.error || "refus du serveur"); return; }
    const cur = deal(d.id) ?? d, w = driveWant(cur); S.creating = ""; cur.driveFolder = r.data.folder; cur.drivePlace = w.client ? "clients" : "prospects"; cur.driveName = w.name;
    cur.docs.push({ ...x, t: title, url: r.data.url, did: r.data.id, sum: hash(html), stamp: r.data.stamp ?? "" }); log(cur, "Document", `${title} créé dans Google Drive`);
    if (S.modal === "doc-new") { S.modal = null; S.draft = {}; } S.preview = { deal: cur.id, i: cur.docs.length - 1 }; S.toast = ""; render(); }, () => fail("serveur injoignable"));
}
function driveSync(d) {
  if (!S.drive.on || driveBusy.has(d.id) || !(d.driveFolder || !d.end || d.end >= TODAY)) return;
  const w = driveWant(d), place = w.client ? "clients" : "prospects";
  if (d.driveFolder && d.drivePlace === place && d.driveName === w.name) return;
  driveBusy.add(d.id);
  api("POST", "/api/drive/folder", { dealId: d.id, folder: d.driveFolder ?? "", ...w }).then((r) => { driveBusy.delete(d.id); const cur = deal(d.id);
    if (r.status !== 200) { if (r.status === 409) { S.notice = `Dossier Drive non mis à jour : ${r.data.error}.`; render(); } return; }
    if (cur) { cur.driveFolder = r.data.folder; cur.drivePlace = place; cur.driveName = w.name; render(); } }, () => driveBusy.delete(d.id));
}
async function syncFeeds() {
  saveState("Lecture des calendriers");
  const r = await api("POST", "/api/feeds/sync").catch(() => null);
  if (r && r.status === 200) { const st = await api("GET", "/api/state"); if (st.status === 200) applySettings(st.data);
    S.flash = r.data.errors.length ? null : { text: "Calendriers importés à jour." }; if (r.data.errors.length) S.notice = "Calendrier illisible : " + r.data.errors.join(" ; "); }
  else S.notice = "Lecture des calendriers impossible pour l'instant.";
  saveState(""); render();
}
// Changes made from another page or by another person arrive here, as they are saved.
function follow() {
  const es = new EventSource("/api/events");
  // The stream opens again after the server restarts: the moment a new version usually arrives.
  es.onopen = () => { checkBuild(); };
  es.onmessage = async (m) => {
    let e; try { e = JSON.parse(m.data); } catch (_) { return; }
    if (e.client === CLIENT || !S.user) return;
    if (e.kind === "deal") {
      if (e.deleted) { if (deal(e.id)) { S.deals = S.deals.filter((d) => d.id !== e.id); saved.delete(e.id); render(); } return; }
      const mine = deal(e.id);
      if (mine && (mine._v >= e.version || plain(mine) !== saved.get(e.id))) return; // already known, or I am mid-change: the save will tell
      const r = await api("GET", "/api/deals/" + encodeURIComponent(e.id)).catch(() => null);
      if (r && r.status === 200) { putDeal(r.data); render(); }
    } else {
      const dirty = Object.keys(SETTINGS).some((k) => JSON.stringify(SETTINGS[k]()) !== savedSettings[k]);
      const r = dirty ? null : await api("GET", "/api/state").catch(() => null);
      if (r && r.status === 200) { applySettings(r.data); render(); }
    }
  };
}
// The bank's CSV export: columns Date (DD/MM/YYYY), Description, Amount. All or nothing: a file
// with one unreadable line is refused, since a statement read in part would silently miss payments.
function parseStatement(text) {
  const rows = []; let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (quoted) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch; }
    else if (ch === '"') quoted = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some((c) => c !== "")) rows.push(row); row = []; } else cell += ch; }
  row.push(cell); if (row.some((c) => c !== "")) rows.push(row);
  const head = (rows.shift() ?? []).map((h) => h.replace(/^\ufeff/, "").trim()), col = { on: head.indexOf("Date"), label: head.indexOf("Description"), amount: head.indexOf("Amount") };
  if (col.on < 0 || col.label < 0 || col.amount < 0) return { error: "colonnes attendues : Date, Description, Amount" };
  const lines = [];
  for (const [i, r] of rows.entries()) { const day = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((r[col.on] ?? "").trim()), amt = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec((r[col.amount] ?? "").trim()), label = (r[col.label] ?? "").trim();
    if (!day) return { error: `ligne ${i + 2} : la date n'est pas écrite JJ/MM/AAAA` }; if (!amt) return { error: `ligne ${i + 2} : le montant n'est pas un nombre` }; if (!label) return { error: `ligne ${i + 2} : la description est vide` };
    // Cents are built from the digits, never by multiplying a decimal number.
    const cents = Number(amt[2]) * 100 + Number((amt[3] ?? "").padEnd(2, "0")); if (amt[1] !== "-" && cents > 0) lines.push({ on: `${day[3]}-${day[2]}-${day[1]}`, label, amount: cents / 100 }); }
  return { lines, total: rows.length };
}
function importStatement(text) {
  const out = parseStatement(text);
  if (out.error) { S.notice = "Relevé refusé, rien n'a été importé : " + out.error + "."; render(); return; }
  // A line already known keeps its state (matched or not): importing the same file twice changes nothing.
  const key = (t, n) => `${t.on}|${t.label}|${t.amount}|${n}`, seen = new Map(), have = new Map();
  S.bankStatement.forEach((t) => { const n = (seen.get(key(t, "")) ?? 0) + 1; seen.set(key(t, ""), n); have.set(key(t, n), t); });
  seen.clear(); let added = 0;
  out.lines.forEach((t) => { const n = (seen.get(key(t, "")) ?? 0) + 1; seen.set(key(t, ""), n); if (!have.has(key(t, n))) { S.bankStatement.push(t); added++; } });
  S.bankStatement.sort((a, b) => (a.on < b.on ? 1 : -1)); S.lastBank = "le " + fr(TODAY);
  const before = S.deals.flatMap((d) => d.payments).filter((p) => p.bank).length;
  S.deals.filter((d) => d.payments.length).forEach(syncBank); S.sync = "";
  const matched = S.deals.flatMap((d) => d.payments).filter((p) => p.bank).length - before;
  S.flash = { text: `${out.total} lignes lues, ${added} nouvel${added > 1 ? "s" : ""} encaissement${added > 1 ? "s" : ""}, ${matched} paiement${matched > 1 ? "s" : ""} rapproché${matched > 1 ? "s" : ""}.` }; render();
}
// A planning file: one line per stay becomes a deal. Lines without a title or valid dates are skipped.
function importPlanning(text) {
  let rows; try { rows = JSON.parse(text); } catch (_) { S.notice = "Ce fichier n'est pas un JSON lisible."; render(); return; }
  if (rows && rows.format === "domaine-import-1") { if (!isAdmin()) { S.notice = "L'import d'une saison est réservé aux administrateurs."; render(); return; } importSeason(rows); return; }
  const isDay = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v); let n = 0, skipped = 0;
  (Array.isArray(rows) ? rows : []).forEach((r, i) => {
    if (!r || typeof r.title !== "string" || r.title.trim().length < 1 || !isDay(r.start) || !isDay(r.end) || r.end < r.start) { skipped++; return; }
    const guests = Number(r.guests) || 0, d = mk("i" + Date.now().toString(36) + i, r.title.trim().slice(0, 80), KIND[r.kind] !== undefined ? r.kind : "Séjour", Math.max(0, Math.min(5, Number.isInteger(r.stage) ? r.stage : 4)), Number(r.amount) || 0, r.start, r.end, guests, Math.min(22, Number(r.sleeping) || guests || 0),
      SOURCES.includes(r.source) ? r.source : "Recommandation", { name: String(r.contact ?? r.title).slice(0, 80), email: "", phone: "", address: "" }, { signed: TODAY });
    if (typeof r.arrival === "string" && /^\d{2}:\d{2}$/.test(r.arrival)) d.arrival = r.arrival;
    if (typeof r.departure === "string" && /^\d{2}:\d{2}$/.test(r.departure)) d.departure = r.departure;
    if (typeof r.note === "string" && r.note.trim()) d.pinned.push({ t: "Note du planning", body: r.note.trim().slice(0, 500), at: fr(TODAY), by: me().name });
    d.history = [{ type: "Modification", t: "Affaire importée d'un planning", at: stamp(), by: me().name }];
    S.deals.push(d); n++;
  });
  S.flash = { text: `${n} séjour${n > 1 ? "s" : ""} importé${n > 1 ? "s" : ""}${skipped ? `, ${skipped} ligne${skipped > 1 ? "s" : ""} ignorée${skipped > 1 ? "s" : ""}` : ""}.` }; render();
}
document.addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (!f) return;
  if (e.target.id === "imp-file") f.text().then(importPlanning);
  if (e.target.id === "bank-file") f.text().then((t) => { importStatement(t); e.target.value = ""; }); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") persist(); else checkBuild(); });
setInterval(checkBuild, 5 * 60 * 1000);
async function boot() {
  const refus = /refus=([^&]+)/.exec(location.hash);
  if (refus) { S.loginErr = decodeURIComponent(refus[1]); history.replaceState(null, "", "#connexion"); }
  const res = await fetch("/api/state", { headers: { "x-client": CLIENT } }).catch(() => null);
  if (!res || res.status !== 200) { S.user = null; if (!location.hash.startsWith("#connexion")) history.replaceState(null, "", "#connexion"); if (!res) S.loginErr = "serveur injoignable"; render(); return; }
  applyState(await res.json());
  // Back from Google's consent screen for Drive: say how it went, then tidy the address.
  const back = /[?&]drive=(ok|refus)/.exec(location.search);
  if (back) { if (back[1] === "ok") S.flash = { text: "Google Drive est connecté." }; else S.notice = "Google Drive n'a pas été connecté. Si vous avez bien accepté l'autorisation, vérifiez que « Google Drive API » est activée dans la console Google Cloud du projet."; history.replaceState(null, "", "/#reglages"); }
  if (route().name === "connexion") history.replaceState(null, "", "#affaires");
  render(); follow();
}
// For the journey checks only: lets a test read the state it is looking at.
window.__app = { S, TERMS, bookings, clean, persist, mk, SEL, parseStatement, auditDeal, importSeason, checkBuild };
boot();
