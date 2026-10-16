import "server-only";
import { prisma } from "@/lib/db";
import { computeStats } from "@/lib/domain/stats";

/** Loads one user's applications with just the fields the stats need, then calculates. */
export async function getDashboardStats(userId: string, now = new Date()) {
  const applications = await prisma.application.findMany({
    where: { userId },
    select: {
      id: true,
      company: true,
      title: true,
      source: true,
      stage: true,
      appliedAt: true,
      deadline: true,
      history: { select: { toStage: true, changedAt: true } },
      interviews: {
        select: { id: true, round: true, type: true, outcome: true, scheduledAt: true },
      },
    },
  });
  return computeStats(applications, now);
}
