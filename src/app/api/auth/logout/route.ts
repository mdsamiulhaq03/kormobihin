import { NextResponse } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { deleteSession } from "@/lib/auth/session";

/** Normal logout from the app (fetch). */
export const POST = withErrorHandling(async () => {
  await deleteSession();
  return ok({ loggedOut: true });
});

/**
 * Browser navigation target used when a session cookie is no longer valid (e.g. the
 * account was deleted): clear the cookie, then show the login page.
 */
export async function GET(request: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
