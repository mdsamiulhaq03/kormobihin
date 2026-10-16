import { ok, parseOrThrow, readJson, withErrorHandling } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { UnauthorizedError } from "@/lib/errors";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators/auth";

export const POST = withErrorHandling(async (request: Request) => {
  checkRateLimit(`login:${getClientIp(request)}`, RATE_LIMITS.login);

  const input = parseOrThrow(loginSchema, await readJson(request));

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Always run bcrypt (against a dummy hash if the user doesn't exist) and return the
  // same message either way, so attackers can't tell which emails are registered.
  const passwordOk = await verifyPassword(input.password, user?.passwordHash);
  if (!user || !passwordOk) {
    throw new UnauthorizedError("Incorrect email or password.");
  }

  await createSession(user.id);
  return ok({ id: user.id, name: user.name, email: user.email });
});
