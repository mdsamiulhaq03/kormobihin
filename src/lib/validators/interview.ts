import { z } from "zod";
import { InterviewOutcome, InterviewType } from "@/generated/prisma/enums";
import { optionalText, requiredDate } from "@/lib/validators/common";

const interviewFields = {
  round: z
    .number({ error: "Round must be a number" })
    .int("Round must be a whole number")
    .min(1, "Round starts at 1")
    .max(20, "Round must be 20 or less"),
  scheduledAt: requiredDate("Interview date"),
  type: z.enum(InterviewType, { error: "Choose an interview type" }),
  outcome: z.enum(InterviewOutcome, { error: "Choose an outcome" }),
  notes: optionalText(2_000, "Notes"),
};

export const interviewCreateSchema = z.object({
  ...interviewFields,
  round: interviewFields.round.optional(), // defaults to the next round number
  type: interviewFields.type.default("OTHER"),
  outcome: interviewFields.outcome.default("PENDING"),
});

export const interviewUpdateSchema = z
  .object(interviewFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Nothing to update");

export type InterviewCreateInput = z.infer<typeof interviewCreateSchema>;
export type InterviewUpdateInput = z.infer<typeof interviewUpdateSchema>;
