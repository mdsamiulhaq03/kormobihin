import { ok, parseId, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { runMatch } from "@/lib/services/match";

// Groq usually answers in 1–3 s; allow up to 30 s on Vercel before the function is cut off.
export const maxDuration = 30;

/** POST — runs the AI CV ↔ job match and returns the updated application. */
export const POST = withErrorHandling(
  async (_request: Request, ctx: RouteContext<"/api/applications/[id]/match">) => {
    const user = await requireUser();
    const id = parseId((await ctx.params).id);
    return ok(await runMatch(user.id, id));
  },
);
