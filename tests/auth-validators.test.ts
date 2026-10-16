import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validators/auth";

describe("registerSchema", () => {
  const valid = { name: "Rahim Uddin", email: "Rahim@Example.com ", password: "Secret123" };

  it("accepts valid input and normalises the email", () => {
    const result = registerSchema.parse(valid);
    expect(result.email).toBe("rahim@example.com");
  });

  it.each([
    ["short name", { name: "R" }, "name"],
    ["invalid email", { email: "not-an-email" }, "email"],
    ["short password", { password: "Ab1" }, "password"],
    ["no uppercase", { password: "secret123" }, "password"],
    ["no number", { password: "SecretPass" }, "password"],
    ["password over bcrypt limit", { password: `Aa1${"x".repeat(80)}` }, "password"],
  ])("rejects %s", (_label, override, field) => {
    const result = registerSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe(field);
  });
});

describe("loginSchema", () => {
  it("requires both fields", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["email", "password"]);
  });
});
