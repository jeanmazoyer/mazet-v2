// Ce qui relie un séjour à son relevé bancaire, pour la fiche d'audit. Fonctions pures : elles ne touchent
// ni à la page ni au serveur, pour pouvoir être vérifiées seules.

const plain = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Les lignes du relevé qui appartiennent au séjour : celles qui prouvent un de ses paiements, et celles qui
// portent le nom d'un de ses clients. Un prénom seul peut attirer une ligne d'un autre client : c'est
// voulu, la fiche est lue par une personne qui tranche.
export function bankLinesFor(d, lines) {
  const names = [d.contact?.name, ...(d.tenants ?? [])].filter(Boolean).flatMap((n) => plain(n).split(/[^a-z0-9]+/).filter((w) => w.length >= 3));
  const proofs = new Set((d.payments ?? []).map((p) => p.bank).filter(Boolean));
  return lines.filter((t) => proofs.has(t.label) || names.some((w) => plain(t.label).includes(w))).sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0));
}

// Un paiement est « rapproché » quand une ligne du relevé porte son libellé à sa date ; « noté » quand il est
// reçu sans preuve sur le relevé ; « à venir » tant qu'il n'est pas payé.
export function matchPayment(p, lines) {
  if (p.status === "due") return { state: "due" };
  if (!p.bank) return { state: "noted" };
  const line = lines.find((t) => t.label === p.bank && (!p.paidOn || t.on === p.paidOn));
  return line ? { state: "matched", line } : { state: "noted" };
}
