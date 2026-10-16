import type { z } from "zod";

export type FieldErrors = Record<string, string | undefined>;

/** Turns a Zod error into { field: firstMessage } for showing next to inputs. */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}

/** Same shape for errors returned by the API ({ field: [messages] }). */
export function apiFieldErrors(fieldErrors?: Record<string, string[]>): FieldErrors {
  if (!fieldErrors) return {};
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, messages]) => [key, messages[0]]),
  );
}
