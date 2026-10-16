import { z } from "zod";

// Reusable building blocks. Forms send "" for empty inputs; these helpers turn ""
// into null so "clear this field" and "leave it out" behave predictably.

/** Required text with friendly messages for missing, empty and too-long values. */
export const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

/** Optional free text: trims, "" → null, enforces a max length. */
export const optionalText = (max: number, label = "This field") =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();

/** Optional date: accepts "2026-10-20" or a full ISO timestamp; "" / null → null. */
export const optionalDate = (label = "Date") =>
  z
    .union([z.string().trim(), z.null()])
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), `${label} is not a valid date`)
    .transform((value) => (value ? new Date(value) : value === undefined ? undefined : null));

/** Required date in the same formats. */
export const requiredDate = (label = "Date") =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => !Number.isNaN(Date.parse(value)), `${label} is not a valid date`)
    .transform((value) => new Date(value));

/** Optional whole-number amount (salary in BDT). */
export const optionalAmount = (label: string) =>
  z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(0, `${label} can't be negative`)
    .max(10_000_000, `${label} looks too large`)
    .nullable()
    .optional();

/** Database ids are cuids; this only guards shape and length. */
export const idSchema = z
  .string()
  .trim()
  .min(1, "Id is required")
  .max(64, "Id is too long")
  .regex(/^[a-z0-9]+$/i, "Id is not valid");
