import { describe, expect, it } from "vitest";
import { bestSource, type SourceStats } from "@/lib/domain/stats";

const row = (source: SourceStats["source"], applied: number, responded: number): SourceStats => ({
  source,
  applied,
  responded,
  responseRate: Math.round((responded / applied) * 100),
});

describe("bestSource", () => {
  it("prefers a source with enough applications over a lucky 1 of 1", () => {
    const best = bestSource([row("FACEBOOK", 1, 1), row("BDJOBS", 4, 3), row("LINKEDIN", 2, 1)]);
    expect(best?.source).toBe("BDJOBS");
  });

  it("falls back to small sources when none has enough applications", () => {
    expect(bestSource([row("REFERRAL", 1, 1), row("OTHER", 1, 0)])?.source).toBe("REFERRAL");
  });

  it("returns null when nobody has replied", () => {
    expect(bestSource([row("BDJOBS", 3, 0)])).toBeNull();
    expect(bestSource([])).toBeNull();
  });
});
