import { ok, withErrorHandling } from "@/lib/api";
import { deleteSession } from "@/lib/auth/session";

export const POST = withErrorHandling(async () => {
  await deleteSession();
  return ok({ loggedOut: true });
});
