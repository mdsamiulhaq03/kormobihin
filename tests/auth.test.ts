import { SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signSessionToken, verifySessionToken } from "@/lib/auth/token";
import { safeRedirectPath } from "@/lib/client/api-client";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-that-is-definitely-longer-than-32-chars";
});

describe("password hashing", () => {
  it("never stores the plain password and verifies the right one", async () => {
    const hash = await hashPassword("Secret@123");
    expect(hash).not.toContain("Secret@123");
    expect(await verifyPassword("Secret@123", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("returns false (not an error) when the user does not exist", async () => {
    expect(await verifyPassword("anything", undefined)).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips the user id", async () => {
    const token = await signSessionToken({ userId: "user_123" });
    expect(await verifySessionToken(token)).toEqual({ userId: "user_123" });
  });

  it("rejects missing, garbage and tampered tokens", async () => {
    const token = await signSessionToken({ userId: "user_123" });
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ sub: "admin" })).toString("base64url");

    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
    expect(await verifySessionToken(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const otherKey = new TextEncoder().encode("a-completely-different-secret-value-123456");
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_123")
      .setExpirationTime("1h")
      .sign(otherKey);
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const key = new TextEncoder().encode(process.env.JWT_SECRET);
    const past = Math.floor(Date.now() / 1000) - 60;
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_123")
      .setIssuedAt(past - 60)
      .setExpirationTime(past)
      .sign(key);
    expect(await verifySessionToken(token)).toBeNull();
  });
});

describe("safeRedirectPath (open-redirect protection)", () => {
  it("keeps same-site paths", () => {
    expect(safeRedirectPath("/applications/abc?tab=interviews")).toBe(
      "/applications/abc?tab=interviews",
    );
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null])(
    "falls back to /dashboard for %s",
    (input) => {
      expect(safeRedirectPath(input)).toBe("/dashboard");
    },
  );
});
