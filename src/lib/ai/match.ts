import { callGroqJson, type GroqConfig } from "@/lib/ai/groq";
import { buildMatchMessages } from "@/lib/ai/prompt";
import { parseMatchResult, type MatchResult } from "@/lib/ai/schema";

/**
 * The AI feature in one function.
 * Input: CV text + job description. Output: score, label, matched/missing skills, 3 tips.
 * The model's answer is validated before anything is returned.
 */
export async function matchCvToJob(
  cvText: string,
  jobDescription: string,
  config: GroqConfig,
): Promise<MatchResult> {
  const raw = await callGroqJson(buildMatchMessages(cvText, jobDescription), config);
  return parseMatchResult(raw);
}
