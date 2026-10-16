import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getFlags } from "@/lib/domain/flags";
import { getNextStages, planStageChange } from "@/lib/domain/stages";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { CLEARED_MATCH, assertResumeOwned } from "@/lib/services/resumes";
import type {
  ApplicationCreateInput,
  ApplicationListQuery,
  ApplicationUpdateInput,
  StageChangeInput,
} from "@/lib/validators/application";

const ORDER_BY: Record<ApplicationListQuery["sort"], Prisma.ApplicationOrderByWithRelationInput[]> =
  {
    newest: [{ createdAt: "desc" }],
    oldest: [{ createdAt: "asc" }],
    deadline: [{ deadline: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    company: [{ company: "asc" }],
    match: [{ matchScore: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  };

async function findOwnedApplication(userId: string, id: string) {
  const application = await prisma.application.findFirst({ where: { id, userId } });
  if (!application) throw new NotFoundError("Application");
  return application;
}

export async function listApplications(
  userId: string,
  query: ApplicationListQuery,
  now = new Date(),
) {
  const where: Prisma.ApplicationWhereInput = {
    userId,
    stage: query.stage,
    source: query.source,
    ...(query.q
      ? {
          OR: [
            { company: { contains: query.q, mode: "insensitive" } },
            { title: { contains: query.q, mode: "insensitive" } },
            { location: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const applications = await prisma.application.findMany({
    where,
    orderBy: ORDER_BY[query.sort],
    select: {
      id: true,
      company: true,
      title: true,
      source: true,
      location: true,
      stage: true,
      deadline: true,
      appliedAt: true,
      salaryMin: true,
      salaryMax: true,
      matchScore: true,
      matchLabel: true,
      createdAt: true,
      updatedAt: true,
      resume: { select: { id: true, label: true } },
      interviews: {
        where: { outcome: "PENDING", scheduledAt: { gte: now } },
        orderBy: { scheduledAt: "asc" },
        take: 1,
        select: { id: true, round: true, type: true, scheduledAt: true },
      },
      _count: { select: { interviews: true } },
    },
  });

  return applications.map(({ interviews, _count, ...app }) => ({
    ...app,
    flags: getFlags(app, now),
    nextStages: getNextStages(app.stage),
    nextInterview: interviews[0] ?? null,
    interviewCount: _count.interviews,
  }));
}

export async function getApplication(userId: string, id: string, now = new Date()) {
  const application = await prisma.application.findFirst({
    where: { id, userId },
    include: {
      resume: { select: { id: true, label: true } },
      history: { orderBy: { changedAt: "asc" } },
      interviews: { orderBy: [{ round: "asc" }, { scheduledAt: "asc" }] },
    },
  });
  if (!application) throw new NotFoundError("Application");

  return {
    ...application,
    flags: getFlags(application, now),
    nextStages: getNextStages(application.stage),
  };
}

export async function createApplication(
  userId: string,
  input: ApplicationCreateInput,
  now = new Date(),
) {
  await assertResumeOwned(userId, input.resumeId);
  const appliedAt = input.stage === "APPLIED" ? (input.appliedAt ?? now) : null;

  const created = await prisma.application.create({
    data: {
      ...input,
      userId,
      appliedAt,
      // The first timeline entry records where the application started.
      history: { create: { fromStage: null, toStage: input.stage, changedAt: appliedAt ?? now } },
    },
    select: { id: true },
  });
  return getApplication(userId, created.id, now);
}

export async function updateApplication(
  userId: string,
  id: string,
  input: ApplicationUpdateInput,
  now = new Date(),
) {
  const existing = await findOwnedApplication(userId, id);
  await assertResumeOwned(userId, input.resumeId);

  // A different job description or CV makes the stored AI match result out of date.
  const matchIsStale =
    (input.jobDescription !== undefined && input.jobDescription !== existing.jobDescription) ||
    (input.resumeId !== undefined && input.resumeId !== existing.resumeId);

  await prisma.application.update({
    where: { id },
    data: { ...input, ...(matchIsStale ? CLEARED_MATCH : {}) },
  });
  return getApplication(userId, id, now);
}

export async function deleteApplication(userId: string, id: string) {
  await findOwnedApplication(userId, id);
  await prisma.application.delete({ where: { id } }); // history + interviews cascade
}

/**
 * Moves an application to a new stage. The rule check comes from the domain layer;
 * the stage update and its history row are written in one transaction so they can
 * never disagree. The update is conditional on the stage we read (optimistic
 * locking), so two simultaneous moves can't both succeed.
 */
export async function changeStage(
  userId: string,
  id: string,
  input: StageChangeInput,
  now = new Date(),
) {
  const current = await findOwnedApplication(userId, id);
  const plan = planStageChange(current, input.stage, now);

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.application.updateMany({
      where: { id, userId, stage: plan.fromStage },
      data: { stage: plan.stage, appliedAt: plan.appliedAt },
    });
    if (count === 0) {
      throw new ConflictError("This application was changed elsewhere. Refresh and try again.");
    }
    await tx.stageHistory.create({
      data: {
        applicationId: id,
        fromStage: plan.fromStage,
        toStage: plan.stage,
        note: input.note ?? null,
        changedAt: now,
      },
    });
  });

  return getApplication(userId, id, now);
}
