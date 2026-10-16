import type { Stage } from "@/generated/prisma/enums";

// Flags are computed when data is read (not stored), so they are always correct
// for "now" without needing a scheduled job.

export const DAY_MS = 24 * 60 * 60 * 1000;
export const NO_RESPONSE_AFTER_DAYS = 21;
export const DEADLINE_SOON_DAYS = 3;

export type Flag = "NO_RESPONSE" | "DEADLINE_SOON" | "DEADLINE_PASSED";

export const FLAG_LABELS: Record<Flag, string> = {
  NO_RESPONSE: "No response",
  DEADLINE_SOON: "Deadline soon",
  DEADLINE_PASSED: "Deadline passed",
};

type FlagInput = {
  stage: Stage;
  appliedAt: Date | null;
  deadline: Date | null;
};

export function getFlags({ stage, appliedAt, deadline }: FlagInput, now: Date): Flag[] {
  const flags: Flag[] = [];

  // Applied 21+ days ago and the employer hasn't moved it forward: suggest a follow-up.
  if (stage === "APPLIED" && appliedAt) {
    const waitedMs = now.getTime() - appliedAt.getTime();
    if (waitedMs >= NO_RESPONSE_AFTER_DAYS * DAY_MS) flags.push("NO_RESPONSE");
  }

  // Deadlines only matter for jobs you haven't applied to yet.
  if (stage === "WISHLIST" && deadline) {
    const remainingMs = deadline.getTime() - now.getTime();
    if (remainingMs < 0) flags.push("DEADLINE_PASSED");
    else if (remainingMs <= DEADLINE_SOON_DAYS * DAY_MS) flags.push("DEADLINE_SOON");
  }

  return flags;
}
