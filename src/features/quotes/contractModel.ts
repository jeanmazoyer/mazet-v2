// A rental agreement built from an accepted quote. The clauses are a DRAFT: they state the
// figures and the obligations the business asked for, and the notice says so. A lawyer should
// approve the wording before it is sent to a client.

import { type DocLanguage, formatCents, formatDate } from "./documentFormat";
import { DOCUMENT_LABELS } from "./documentLabels";
import { buildQuoteModel, type QuoteDocument, type QuoteSource } from "./documentModel";

// Deposit in cents, rounded half up. The balance is the rest, so both always add back to the total.
export function depositCents(totalCents: number, depositPercent: number): number {
  return Math.floor((totalCents * depositPercent + 50) / 100);
}

export interface ContractSource extends QuoteSource {
  depositPercent: number;
  balanceDueOn: string;
}

export interface ContractSection {
  heading: string;
  paragraphs: string[];
}

export interface ContractDocument extends Omit<QuoteDocument, "title"> {
  title: string;
  sections: ContractSection[];
  draftNotice: string;
}

export function buildContractModel(c: ContractSource): ContractDocument {
  const lang: DocLanguage = c.language;
  const labels = DOCUMENT_LABELS[lang];
  const quote = buildQuoteModel(c);
  const deposit = depositCents(c.totalCents, c.depositPercent);
  const balance = c.totalCents - deposit;
  const balanceDue = formatDate(c.balanceDueOn, lang);
  const total = formatCents(c.totalCents, lang);
  const depositText = formatCents(deposit, lang);
  const balanceText = formatCents(balance, lang);
  const period = c.eventPeriod ?? "";

  const text =
    lang === "fr"
      ? {
          parties: [
            `Bailleur : le domaine (coordonnées à compléter).`,
            `Client : ${c.clientName}.`,
          ],
          object: [
            `Location du domaine pour l'événement « ${c.dealTitle} »${period ? `, du ${period}` : ""}.`,
          ],
          price: [`Montant total TTC : ${total}, selon le devis ${quote.reference}.`],
          payment: [
            `Acompte de ${c.depositPercent} %, soit ${depositText}, à la signature.`,
            `Solde de ${balanceText}, au plus tard le ${balanceDue}.`,
          ],
          insurance: [
            `Le client fournit, avant l'arrivée, une attestation d'assurance couvrant l'événement.`,
          ],
          cancellation: [`Conditions d'annulation : à compléter par le bailleur.`],
          deposit: [`Une caution peut être demandée ; son montant est précisé séparément.`],
        }
      : {
          parties: [`Owner: the estate (details to be completed).`, `Client: ${c.clientName}.`],
          object: [
            `Rental of the estate for the event "${c.dealTitle}"${period ? `, ${period}` : ""}.`,
          ],
          price: [`Total incl. VAT: ${total}, as per quote ${quote.reference}.`],
          payment: [
            `Deposit of ${c.depositPercent} %, i.e. ${depositText}, on signature.`,
            `Balance of ${balanceText}, due no later than ${balanceDue}.`,
          ],
          insurance: [
            `Before arrival, the client provides an insurance certificate covering the event.`,
          ],
          cancellation: [`Cancellation terms: to be completed by the owner.`],
          deposit: [`A security deposit may be requested; its amount is stated separately.`],
        };

  const s = labels.sections;
  return {
    ...quote,
    title: labels.contractTitle,
    sections: [
      { heading: s.parties, paragraphs: text.parties },
      { heading: s.object, paragraphs: text.object },
      { heading: s.price, paragraphs: text.price },
      { heading: s.payment, paragraphs: text.payment },
      { heading: s.insurance, paragraphs: text.insurance },
      { heading: s.cancellation, paragraphs: text.cancellation },
      { heading: s.deposit, paragraphs: text.deposit },
    ],
    draftNotice: labels.draftNotice,
  };
}
