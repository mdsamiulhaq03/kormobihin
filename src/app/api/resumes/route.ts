import { ok, parseOrThrow, readJson, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { createResume, listResumes } from "@/lib/services/resumes";
import { resumeCreateSchema } from "@/lib/validators/resume";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return ok(await listResumes(user.id));
});

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const input = parseOrThrow(resumeCreateSchema, await readJson(request));
  return ok(await createResume(user.id, input), 201);
});
