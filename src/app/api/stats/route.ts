import { ok, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/services/stats";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return ok(await getDashboardStats(user.id));
});
