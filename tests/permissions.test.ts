import { describe, expect, it } from "vitest";
import { ForbiddenError, assertCan, can, PERMISSIONS } from "@/lib/permissions";

// Droits par rôle (BRIEF.md, section 6). Un changement ici doit être volontaire.
describe("matrice des droits", () => {
  it("l'administrateur a tous les droits", () => {
    for (const p of PERMISSIONS) expect(can("admin", p)).toBe(true);
  });

  it("le gestionnaire ne gère pas les comptes ni les modèles, ni les grilles tarifaires", () => {
    expect(can("manager", "accounts.manage")).toBe(false);
    expect(can("manager", "templates.manage")).toBe(false);
    expect(can("manager", "pricing.manage")).toBe(false);
    expect(can("manager", "dossier.write")).toBe(true);
    expect(can("manager", "quote.write")).toBe(true);
    expect(can("manager", "contract.write")).toBe(true);
  });

  it("le partenaire voit le planning et la fiche, ajoute un compte rendu, rien d'autre", () => {
    expect(can("partner", "calendar.read")).toBe(true);
    expect(can("partner", "event_sheet.read")).toBe(true);
    expect(can("partner", "event_sheet.report")).toBe(true);

    expect(can("partner", "pricing.read")).toBe(false);
    expect(can("partner", "quote.write")).toBe(false);
    expect(can("partner", "contract.write")).toBe(false);
    expect(can("partner", "dossier.write")).toBe(false);
    expect(can("partner", "calendar.write")).toBe(false);
    expect(can("partner", "accounts.manage")).toBe(false);
    expect(can("partner", "journal.read")).toBe(false);
  });

  it("assertCan lève une ForbiddenError si le droit manque", () => {
    expect(() => assertCan("partner", "pricing.read")).toThrow(ForbiddenError);
    expect(() => assertCan("admin", "pricing.read")).not.toThrow();
  });
});
