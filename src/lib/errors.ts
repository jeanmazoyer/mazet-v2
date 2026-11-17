export class NotFoundError extends Error {
  constructor(what: string) {
    super(`Introuvable : ${what}`);
    this.name = "NotFoundError";
  }
}
