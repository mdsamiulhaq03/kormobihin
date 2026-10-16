import { z } from "zod";
import { AiServiceError } from "@/lib/ai/groq";

export type MatchLabel = "Strong" | "Moderate" | "Weak";

export const MAX_SKILLS = 15;
export const TIP_COUNT = 3;

/** The label is derived from the score in code, so the two can never disagree. */
export function labelForScore(score: number): MatchLabel {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  return "Weak";
}

/** Models sometimes emit Unicode hyphens (‐ ‑ ‒ –); store plain ASCII "-" instead. */
const cleanText = (max: number) =>
  z
    .string()
    .transform((value) => value.replace(/[‐-–]/g, "-").trim())
    .pipe(z.string().min(1).max(max));

const skillList = z.array(cleanText(60)).transform((skills) => {
  // De-duplicate case-insensitively ("React" and "react"), keep the first spelling.
  const seen = new Set<string>();
  return skills
    .filter((skill) => {
      const key = skill.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_SKILLS);
});

/** What we accept from the model. Anything else is rejected, never saved. */
const rawMatchSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  matchedSkills: skillList,
  missingSkills: skillList,
  tips: z
    .array(cleanText(300))
    .min(1)
    .transform((tips) => tips.slice(0, TIP_COUNT)),
});

export type MatchResult = {
  score: number;
  label: MatchLabel;
  matchedSkills: string[];
  missingSkills: string[];
  tips: string[];
};

export function parseMatchResult(raw: unknown): MatchResult {
  const parsed = rawMatchSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("AI match result failed validation:", parsed.error.issues);
    throw new AiServiceError(502, "The AI returned an incomplete answer. Please retry.");
  }
  const score = Math.round(parsed.data.score);
  return {
    score,
    label: labelForScore(score),
    matchedSkills: parsed.data.matchedSkills,
    missingSkills: parsed.data.missingSkills,
    tips: parsed.data.tips,
  };
}
