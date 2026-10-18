import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";

const respond = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe("apiRequest", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends an expired session back to login, returning to the same page", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname: "/applications/abc", search: "?x=1", assign },
    });
    vi.stubGlobal("fetch", respond(401, { success: false, error: "Please log in." }));

    await expect(apiRequest("/api/applications/abc")).rejects.toMatchObject({ status: 401 });
    expect(assign).toHaveBeenCalledWith(
      "/api/auth/logout?next=%2Fapplications%2Fabc%3Fx%3D1&expired=1",
    );
  });

  it("keeps a wrong password on the login form (no redirect)", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { pathname: "/login", search: "", assign } });
    vi.stubGlobal("fetch", respond(401, { success: false, error: "Incorrect email or password." }));

    await expect(apiRequest("/api/auth/login", { method: "POST" })).rejects.toThrow(
      "Incorrect email or password.",
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it("explains network and server failures in plain words", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiRequest("/api/stats")).rejects.toThrow("Can't reach the server");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 502 })));
    const error = await apiRequest("/api/stats").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).message).toMatch(/server had a problem/);
  });
});
