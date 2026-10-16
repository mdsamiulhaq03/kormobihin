import { ok, parseId, parseOrThrow, readJson, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { deleteInterview, updateInterview } from "@/lib/services/interviews";
import { interviewUpdateSchema } from "@/lib/validators/interview";

type Context = RouteContext<"/api/applications/[id]/interviews/[interviewId]">;

async function readIds(ctx: Context) {
  const params = await ctx.params;
  return { applicationId: parseId(params.id), interviewId: parseId(params.interviewId) };
}

export const PATCH = withErrorHandling(async (request: Request, ctx: Context) => {
  const user = await requireUser();
  const { applicationId, interviewId } = await readIds(ctx);
  const input = parseOrThrow(interviewUpdateSchema, await readJson(request));
  return ok(await updateInterview(user.id, applicationId, interviewId, input));
});

export const DELETE = withErrorHandling(async (_request: Request, ctx: Context) => {
  const user = await requireUser();
  const { applicationId, interviewId } = await readIds(ctx);
  await deleteInterview(user.id, applicationId, interviewId);
  return ok({ deleted: true });
});
