export class NotFoundError extends Error {
  constructor(what: string) {
    super(`Introuvable : ${what}`);
    this.name = "NotFoundError";
  }
}

// `code` est une clé de traduction (messages/*.json, section "errors").
export class ValidationError extends Error {
  constructor(public readonly code: string) {
    super(`Saisie invalide : ${code}`);
    this.name = "ValidationError";
  }
}

export class BookingConflictError extends Error {
  constructor() {
    super("Ces dates sont déjà réservées.");
    this.name = "BookingConflictError";
  }
}
