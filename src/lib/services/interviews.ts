import "server-only";
import { prisma } from "@/lib/db";
import { AppError, NotFoundError } from "@/lib/errors";
import type { InterviewCreateInput, InterviewUpdateInput } from "@/lib/validators/interview";

async function findOwnedApplication(userId: string, applicationId: string) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    select: { id: true, stage: true },
  });
  if (!application) throw new NotFoundError("Application");
  return application;
}

async function findOwnedInterview(userId: string, applicationId: string, interviewId: string) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, applicationId, application: { userId } },
  });
  if (!interview) throw new NotFoundError("Interview");
  return interview;
}

export async function listInterviews(userId: string, applicationId: string) {
  await findOwnedApplication(userId, applicationId);
  return prisma.interview.findMany({
    where: { applicationId },
    orderBy: [{ round: "asc" }, { scheduledAt: "asc" }],
  });
}

export async function createInterview(
  userId: string,
  applicationId: string,
  input: InterviewCreateInput,
) {
  const application = await findOwnedApplication(userId, applicationId);
  // Business rule: there is nothing to interview for until you have applied.
  if (application.stage === "WISHLIST") {
    throw new AppError(422, "Mark this application as Applied before adding interviews.");
  }

  const round = input.round ?? (await nextRoundNumber(applicationId));
  return prisma.interview.create({ data: { ...input, round, applicationId } });
}

async function nextRoundNumber(applicationId: string) {
  const last = await prisma.interview.findFirst({
    where: { applicationId },
    orderBy: { round: "desc" },
    select: { round: true },
  });
  return (last?.round ?? 0) + 1;
}

export async function updateInterview(
  userId: string,
  applicationId: string,
  interviewId: string,
  input: InterviewUpdateInput,
) {
  await findOwnedInterview(userId, applicationId, interviewId);
  return prisma.interview.update({ where: { id: interviewId }, data: input });
}

export async function deleteInterview(userId: string, applicationId: string, interviewId: string) {
  await findOwnedInterview(userId, applicationId, interviewId);
  await prisma.interview.delete({ where: { id: interviewId } });
}
