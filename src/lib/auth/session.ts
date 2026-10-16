import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { UnauthorizedError } from "@/lib/errors";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/token";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

/** Signs a token for the user and stores it in an httpOnly cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken({ userId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // JavaScript in the browser can't read it (protects against XSS token theft)
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // not sent on cross-site POSTs (CSRF protection)
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Returns the logged-in user, or null. Verifies the token AND checks the user still
 * exists in the database (a deleted account's old token stops working).
 */
// cache(): the layout and the page both ask for the user; this makes it one DB query per request.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });
});

/**
 * Use in protected pages. If there's no valid user, send the browser to the logout
 * route, which clears a stale cookie before showing the login page. (Redirecting
 * straight to /login would loop: the proxy sees a validly signed cookie for a user
 * that no longer exists and sends it back to the dashboard.)
 */
export async function requirePageUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/logout");
  return user;
}

/** Use at the top of every protected route handler. Throws 401 if not logged in. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
