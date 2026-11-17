import type { DocLanguage } from "./documentFormat";

// Every fixed word on a quote or contract. Clauses live in contractModel, next to their logic.
export interface DocumentLabels {
  quoteTitle: string;
  contractTitle: string;
  reference: string;
  client: string;
  event: string;
  validUntil: string;
  columns: { label: string; quantity: string; unitPrice: string; vat: string; total: string };
  units: { flat: string; per_day: string; per_person: string };
  subtotal: string;
  vat: string;
  total: string;
  notes: string;
  sections: {
    parties: string;
    object: string;
    price: string;
    payment: string;
    insurance: string;
    cancellation: string;
    deposit: string;
  };
  draftNotice: string;
}

export const DOCUMENT_LABELS: Record<DocLanguage, DocumentLabels> = {
  fr: {
    quoteTitle: "Devis",
    contractTitle: "Contrat de location",
    reference: "Référence",
    client: "Client",
    event: "Événement",
    validUntil: "Valable jusqu'au",
    columns: {
      label: "Prestation",
      quantity: "Qté",
      unitPrice: "Prix unitaire HT",
      vat: "TVA",
      total: "Total HT",
    },
    units: { flat: "forfait", per_day: "par jour", per_person: "par personne" },
    subtotal: "Total HT",
    vat: "TVA",
    total: "Total TTC",
    notes: "Notes",
    sections: {
      parties: "Parties",
      object: "Objet",
      price: "Prix",
      payment: "Paiement",
      insurance: "Assurance",
      cancellation: "Annulation",
      deposit: "Caution",
    },
    draftNotice:
      "Projet à valider avant utilisation. Ce texte ne remplace pas l'avis d'un juriste.",
  },
  en: {
    quoteTitle: "Quote",
    contractTitle: "Rental agreement",
    reference: "Reference",
    client: "Client",
    event: "Event",
    validUntil: "Valid until",
    columns: {
      label: "Service",
      quantity: "Qty",
      unitPrice: "Unit price excl. VAT",
      vat: "VAT",
      total: "Total excl. VAT",
    },
    units: { flat: "flat fee", per_day: "per day", per_person: "per person" },
    subtotal: "Total excl. VAT",
    vat: "VAT",
    total: "Total incl. VAT",
    notes: "Notes",
    sections: {
      parties: "Parties",
      object: "Purpose",
      price: "Price",
      payment: "Payment",
      insurance: "Insurance",
      cancellation: "Cancellation",
      deposit: "Deposit",
    },
    draftNotice: "Draft to be validated before use. This text does not replace legal advice.",
  },
};
