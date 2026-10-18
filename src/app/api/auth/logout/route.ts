import { NextResponse } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { deleteSession } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/client/api-client";

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
  const { searchParams } = new URL(request.url);
  const loginUrl = new URL("/login", request.url);
  const next = searchParams.get("next");
  if (next) loginUrl.searchParams.set("next", safeRedirectPath(next));
  if (searchParams.get("expired") === "1") loginUrl.searchParams.set("expired", "1");
  return NextResponse.redirect(loginUrl);
}
