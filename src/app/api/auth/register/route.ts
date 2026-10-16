import { ok, parseOrThrow, readJson, withErrorHandling } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ConflictError } from "@/lib/errors";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators/auth";

export const POST = withErrorHandling(async (request: Request) => {
  checkRateLimit(`register:${getClientIp(request)}`, RATE_LIMITS.register);

  const input = parseOrThrow(registerSchema, await readJson(request));

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError("An account with this email already exists. Try logging in.");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    },
    select: { id: true, name: true, email: true },
  });

  await createSession(user.id);
  return ok(user, 201);
});
