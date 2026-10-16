import { ok, parseId, parseOrThrow, readJson, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { deleteApplication, getApplication, updateApplication } from "@/lib/services/applications";
import { applicationUpdateSchema } from "@/lib/validators/application";

type Context = RouteContext<"/api/applications/[id]">;

export const GET = withErrorHandling(async (_request: Request, ctx: Context) => {
  const user = await requireUser();
  const id = parseId((await ctx.params).id);
  return ok(await getApplication(user.id, id));
});

export const PATCH = withErrorHandling(async (request: Request, ctx: Context) => {
  const user = await requireUser();
  const id = parseId((await ctx.params).id);
  const input = parseOrThrow(applicationUpdateSchema, await readJson(request));
  return ok(await updateApplication(user.id, id, input));
});

export const DELETE = withErrorHandling(async (_request: Request, ctx: Context) => {
  const user = await requireUser();
  const id = parseId((await ctx.params).id);
  await deleteApplication(user.id, id);
  return ok({ deleted: true });
});
