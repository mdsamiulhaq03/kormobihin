import { ok, parseId, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { reopenApplication } from "@/lib/services/applications";

/** POST — undoes a rejection or declined offer, back to the stage it was closed from. */
export const POST = withErrorHandling(
  async (_request: Request, ctx: RouteContext<"/api/applications/[id]/reopen">) => {
    const user = await requireUser();
    const id = parseId((await ctx.params).id);
    return ok(await reopenApplication(user.id, id));
  },
);
