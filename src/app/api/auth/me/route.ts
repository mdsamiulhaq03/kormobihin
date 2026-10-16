import { ok, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return ok(user);
});
