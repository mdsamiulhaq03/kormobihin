import "server-only";
import { matchCvToJob } from "@/lib/ai/match";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { AppError, NotFoundError } from "@/lib/errors";
import { RATE_LIMITS, checkRateLimit } from "@/lib/rate-limit";
import { getApplication } from "@/lib/services/applications";
import { MATCH_MIN_JD_CHARS } from "@/lib/validators/application";

/**
 * Runs the AI match for one of the user's applications and stores the result.
 * The previous result is only replaced on success, so a failed retry never wipes
 * a good earlier result.
 */
export async function runMatch(userId: string, applicationId: string) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    select: { id: true, jobDescription: true, resume: { select: { content: true } } },
  });
  if (!application) throw new NotFoundError("Application");
  if (!application.resume) {
    throw new AppError(422, "Choose which CV you sent for this job before checking the match.");
  }
  if (application.jobDescription.trim().length < MATCH_MIN_JD_CHARS) {
    throw new AppError(422, "Add the job description first, so there's something to compare.");
  }

  // Each check costs a Groq request; limit per user to protect the free-tier quota.
  checkRateLimit(`ai-match:${userId}`, RATE_LIMITS.aiMatch);

  const env = getEnv();
  const result = await matchCvToJob(application.resume.content, application.jobDescription, {
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL,
  });

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      matchScore: result.score,
      matchLabel: result.label,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      matchTips: result.tips,
      matchedAt: new Date(),
    },
  });

  return getApplication(userId, applicationId);
}
