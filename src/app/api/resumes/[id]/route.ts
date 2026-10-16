import { ok, parseId, parseOrThrow, readJson, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { deleteResume, getResume, updateResume } from "@/lib/services/resumes";
import { resumeUpdateSchema } from "@/lib/validators/resume";

type Context = RouteContext<"/api/resumes/[id]">;

export const GET = withErrorHandling(async (_request: Request, ctx: Context) => {
  const user = await requireUser();
  const id = parseId((await ctx.params).id);
  return ok(await getResume(user.id, id));
});

export const PATCH = withErrorHandling(async (request: Request, ctx: Context) => {
  const user = await requireUser();
  const id = parseId((await ctx.params).id);
  const input = parseOrThrow(resumeUpdateSchema, await readJson(request));
  return ok(await updateResume(user.id, id, input));
});

export const DELETE = withErrorHandling(async (_request: Request, ctx: Context) => {
  const user = await requireUser();
  const id = parseId((await ctx.params).id);
  await deleteResume(user.id, id);
  return ok({ deleted: true });
});
