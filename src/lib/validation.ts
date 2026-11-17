import { ValidationError } from "@/lib/errors";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function requiredText(value: unknown, code: string, max = 200): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new ValidationError(code);
  if (text.length > max) throw new ValidationError("too_long");
  return text;
}

export function optionalText(value: unknown, max = 200): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  if (text.length > max) throw new ValidationError("too_long");
  return text;
}

export function optionalDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (!isIsoDate(value)) throw new ValidationError("invalid_date");
  return value;
}

export function optionalCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 100000) throw new ValidationError("invalid_guests");
  return n;
}
