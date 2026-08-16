import { randomUUID } from "node:crypto";

/** Generate a short, sortable-ish unique id. */
export function newId(prefix = ""): string {
  const uuid = randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export function nowIso(): string {
  return new Date().toISOString();
}
