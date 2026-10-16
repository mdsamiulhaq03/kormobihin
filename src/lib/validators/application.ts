import { z } from "zod";
import { JobSource, Stage } from "@/generated/prisma/enums";
import {
  idSchema,
  optionalAmount,
  optionalDate,
  optionalText,
  requiredText,
} from "@/lib/validators/common";

export const JOB_DESCRIPTION_MIN_CHARS = 30;
export const JOB_DESCRIPTION_MAX_CHARS = 20_000;

const jobUrl = z
  .string()
  .trim()
  .max(500, "Link is too long")
  .transform((value) => (value === "" ? null : value))
  .refine(
    (value) => value === null || /^https?:\/\//i.test(value),
    "Link must start with http:// or https://",
  )
  .pipe(z.url("Enter a valid link").nullable())
  .nullable()
  .optional();

const applicationFields = {
  company: requiredText("Company", 120),
  title: requiredText("Job title", 120),
  source: z.enum(JobSource, { error: "Choose where you found this job" }),
  jobUrl,
  jobDescription: z
    .string({ error: "Paste the job description" })
    .trim()
    .min(
      JOB_DESCRIPTION_MIN_CHARS,
      `Paste the job description (at least ${JOB_DESCRIPTION_MIN_CHARS} characters)`,
    )
    .max(JOB_DESCRIPTION_MAX_CHARS, "Job description is too long"),
  location: optionalText(120, "Location"),
  salaryMin: optionalAmount("Minimum salary"),
  salaryMax: optionalAmount("Maximum salary"),
  deadline: optionalDate("Deadline"),
  appliedAt: optionalDate("Applied date"),
  notes: optionalText(5_000, "Notes"),
  resumeId: idSchema.nullable().optional(),
};

const salaryRangeIsValid = (data: { salaryMin?: number | null; salaryMax?: number | null }) =>
  data.salaryMin == null || data.salaryMax == null || data.salaryMin <= data.salaryMax;

const salaryRangeError = {
  message: "Minimum salary can't be more than maximum salary",
  path: ["salaryMax"],
};

export const applicationCreateSchema = z
  .object({
    ...applicationFields,
    source: applicationFields.source.default("OTHER"),
    // A new application starts on the wishlist or as already applied; later stages
    // are reached only through the stage workflow.
    stage: z.enum(["WISHLIST", "APPLIED"]).default("WISHLIST"),
  })
  .refine(salaryRangeIsValid, salaryRangeError);

export const applicationUpdateSchema = z
  .object(applicationFields)
  .partial()
  .refine(salaryRangeIsValid, salaryRangeError)
  .refine((data) => Object.keys(data).length > 0, "Nothing to update");

export const stageChangeSchema = z.object({
  stage: z.enum(Stage, { error: "Choose a valid stage" }),
  note: optionalText(500, "Note"),
});

export const APPLICATION_SORTS = ["newest", "oldest", "deadline", "company", "match"] as const;

export const applicationListQuerySchema = z.object({
  stage: z.enum(Stage).optional(),
  source: z.enum(JobSource).optional(),
  q: z.string().trim().max(100, "Search is too long").optional(),
  sort: z.enum(APPLICATION_SORTS).default("newest"),
});

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
export type StageChangeInput = z.infer<typeof stageChangeSchema>;
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;
