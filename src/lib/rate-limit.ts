import { RateLimitError } from "@/lib/errors";

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Limitation (documented in the README): memory is per server instance. On Vercel each
 * serverless instance has its own counter and it resets on cold start, so this slows
 * down brute force but is not a hard global limit. A shared store like Redis would be.
 */
type Window = { timestamps: number[] };

const buckets = new Map<string, Window>();

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now = Date.now(),
) {
  const windowStart = now - windowMs;
  const recent = (buckets.get(key)?.timestamps ?? []).filter((t) => t > windowStart);

  if (recent.length >= limit) {
    const retryAfterMs = recent[0] + windowMs - now;
    buckets.set(key, { timestamps: recent });
    throw new RateLimitError(Math.max(1, Math.ceil(retryAfterMs / 1000)));
  }

  buckets.set(key, { timestamps: [...recent, now] });
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 60_000 },
  register: { limit: 5, windowMs: 60_000 },
  aiMatch: { limit: 10, windowMs: 60_000 },
} satisfies Record<string, RateLimitOptions>;
