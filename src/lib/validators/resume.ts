import { z } from "zod";

export const RESUME_MIN_CHARS = 50;
export const RESUME_MAX_CHARS = 20_000;
export const PDF_MAX_BYTES = 4 * 1024 * 1024; // Vercel's request body limit is ~4.5 MB

export const resumeCreateSchema = z.object({
  label: z
    .string({ error: "Give this CV a name" })
    .trim()
    .min(1, "Give this CV a name, e.g. “Frontend CV”")
    .max(60, "Name must be at most 60 characters"),
  content: z
    .string({ error: "Paste your CV text" })
    .trim()
    .min(RESUME_MIN_CHARS, `CV text must be at least ${RESUME_MIN_CHARS} characters`)
    .max(
      RESUME_MAX_CHARS,
      `CV text must be at most ${RESUME_MAX_CHARS.toLocaleString()} characters`,
    ),
});

export const resumeUpdateSchema = resumeCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Nothing to update");

export type ResumeCreateInput = z.infer<typeof resumeCreateSchema>;
export type ResumeUpdateInput = z.infer<typeof resumeUpdateSchema>;
