import { beforeEach, describe, expect, it } from "vitest";
import { RateLimitError } from "@/lib/errors";
import { checkRateLimit, getClientIp, resetRateLimits } from "@/lib/rate-limit";

const options = { limit: 3, windowMs: 60_000 };

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit, then blocks", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(() => checkRateLimit("login:1.2.3.4", options, now + i)).not.toThrow();
    }
    expect(() => checkRateLimit("login:1.2.3.4", options, now + 10)).toThrow(RateLimitError);
  });

  it("tells the client how long to wait", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) checkRateLimit("k", options, now);
    try {
      checkRateLimit("k", options, now + 15_000);
      expect.unreachable();
    } catch (error) {
      expect((error as RateLimitError).retryAfterSeconds).toBe(45);
    }
  });

  it("allows again once old attempts leave the window", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) checkRateLimit("k", options, now);
    expect(() => checkRateLimit("k", options, now + 60_001)).not.toThrow();
  });

  it("counts each key separately", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) checkRateLimit("login:a", options, now);
    expect(() => checkRateLimit("login:b", options, now)).not.toThrow();
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for address", () => {
    const request = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(getClientIp(request)).toBe("203.0.113.5");
  });
});
