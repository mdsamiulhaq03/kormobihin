import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import type { ResumeCreateInput, ResumeUpdateInput } from "@/lib/validators/resume";

const PREVIEW_CHARS = 180;

/** Throws 404 unless the resume exists AND belongs to this user (no 403: don't reveal it exists). */
async function findOwnedResume(userId: string, id: string) {
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) throw new NotFoundError("CV");
  return resume;
}

export async function listResumes(userId: string) {
  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
  return resumes.map(({ content, _count, ...resume }) => ({
    ...resume,
    preview: content.slice(0, PREVIEW_CHARS),
    characters: content.length,
    applicationCount: _count.applications,
  }));
}

export function getResume(userId: string, id: string) {
  return findOwnedResume(userId, id);
}

export function createResume(userId: string, input: ResumeCreateInput) {
  return prisma.resume.create({ data: { ...input, userId } });
}

export async function updateResume(userId: string, id: string, input: ResumeUpdateInput) {
  await findOwnedResume(userId, id);
  return prisma.$transaction(async (tx) => {
    const resume = await tx.resume.update({ where: { id }, data: input });
    // New CV text makes earlier AI match results out of date.
    if (input.content !== undefined) {
      await tx.application.updateMany({ where: { userId, resumeId: id }, data: CLEARED_MATCH });
    }
    return resume;
  });
}

export async function deleteResume(userId: string, id: string) {
  await findOwnedResume(userId, id);
  // Applications keep existing; the schema's onDelete: SetNull clears their resumeId.
  await prisma.resume.delete({ where: { id } });
}

/** Ensures a resume id chosen for an application belongs to the same user. */
export async function assertResumeOwned(userId: string, resumeId: string | null | undefined) {
  if (resumeId) await findOwnedResume(userId, resumeId);
}

export const CLEARED_MATCH = {
  matchScore: null,
  matchLabel: null,
  matchedSkills: [],
  missingSkills: [],
  matchTips: [],
  matchedAt: null,
};
