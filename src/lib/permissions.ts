// Matrice des droits (BRIEF.md, section 6). Seul endroit où les rôles sont définis.
// Vérifiée côté serveur : l'interface ne fait qu'afficher ce qui est permis.

export const ROLES = ["admin", "manager", "partner"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "dossier.read",
  "dossier.write",
  "pricing.read",
  "pricing.manage",
  "quote.write",
  "contract.write",
  "payment.manage",
  "document.manage",
  "calendar.read",
  "calendar.write",
  "event_sheet.read",
  "event_sheet.report",
  "templates.manage",
  "accounts.manage",
  "journal.read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const MANAGER_PERMISSIONS: Permission[] = [
  "dossier.read",
  "dossier.write",
  "pricing.read",
  "quote.write",
  "contract.write",
  "payment.manage",
  "document.manage",
  "calendar.read",
  "calendar.write",
  "event_sheet.read",
  "event_sheet.report",
];

const PARTNER_PERMISSIONS: Permission[] = [
  "calendar.read",
  "event_sheet.read",
  "event_sheet.report",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  partner: PARTNER_PERMISSIONS,
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Droit manquant : ${permission}`);
    this.name = "ForbiddenError";
  }
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) throw new ForbiddenError(permission);
}
