import { ok, parseId, parseOrThrow, readJson, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { createInterview, listInterviews } from "@/lib/services/interviews";
import { interviewCreateSchema } from "@/lib/validators/interview";

type Context = RouteContext<"/api/applications/[id]/interviews">;

export const GET = withErrorHandling(async (_request: Request, ctx: Context) => {
  const user = await requireUser();
  const applicationId = parseId((await ctx.params).id);
  return ok(await listInterviews(user.id, applicationId));
});

export const POST = withErrorHandling(async (request: Request, ctx: Context) => {
  const user = await requireUser();
  const applicationId = parseId((await ctx.params).id);
  const input = parseOrThrow(interviewCreateSchema, await readJson(request));
  return ok(await createInterview(user.id, applicationId, input), 201);
});
