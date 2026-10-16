import { ok, parseId, parseOrThrow, readJson, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { changeStage } from "@/lib/services/applications";
import { stageChangeSchema } from "@/lib/validators/application";

/** POST { stage, note? } — moves the application along the hiring workflow. */
export const POST = withErrorHandling(
  async (request: Request, ctx: RouteContext<"/api/applications/[id]/stage">) => {
    const user = await requireUser();
    const id = parseId((await ctx.params).id);
    const input = parseOrThrow(stageChangeSchema, await readJson(request));
    return ok(await changeStage(user.id, id, input));
  },
);
