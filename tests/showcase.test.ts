import { describe, expect, it } from "vitest";
import type { Stage } from "@/generated/prisma/enums";
import { buildShowcase } from "@/lib/domain/showcase";
import { STAGES } from "@/lib/domain/stages";

const byStage = (counts: Partial<Record<Stage, number>>) =>
  Object.fromEntries(STAGES.map((stage) => [stage, counts[stage] ?? 0])) as Record<Stage, number>;

describe("buildShowcase", () => {
  const showcase = buildShowcase({
    byStage: byStage({ WISHLIST: 3, APPLIED: 4, OFFER: 1, REJECTED: 2 }),
    bySource: [
      { source: "BDJOBS", applied: 5, responded: 3, responseRate: 60 },
      { source: "REFERRAL", applied: 1, responded: 1, responseRate: 100 },
    ],
    matches: [
      { company: "Astha", matchScore: 95, missingSkills: [] },
      { company: "Brain Station 23", matchScore: 90, missingSkills: ["Jest"] },
      {
        company: "Therap (BD) Ltd.",
        matchScore: 30,
        missingSkills: ["Java", "Spring Boot", "SQL"],
      },
    ],
    followUpCompany: "Pathao",
  });

  it("totals the pipeline and keeps only stages that have applications, in stage order", () => {
    expect(showcase.total).toBe(10);
    expect(showcase.pipeline).toEqual([
      { stage: "WISHLIST", count: 3 },
      { stage: "APPLIED", count: 4 },
      { stage: "OFFER", count: 1 },
      { stage: "REJECTED", count: 2 },
    ]);
  });

  it("uses the same best-source rule as the dashboard", () => {
    expect(showcase.bestSource).toEqual({ label: "Bdjobs", responded: 3, applied: 5, rate: 60 });
  });

  it("shows the best match that names a missing skill, and the weakest match", () => {
    expect(showcase.topMatch).toEqual({
      company: "Brain Station 23",
      score: 90,
      label: "Strong",
      missing: ["Jest"],
    });
    expect(showcase.lowMatch).toMatchObject({
      company: "Therap (BD) Ltd.",
      score: 30,
      missing: ["Java", "Spring Boot"],
    });
    expect(showcase.followUpCompany).toBe("Pathao");
  });

  it("copes with an account that has no matches or replies", () => {
    const empty = buildShowcase({
      byStage: byStage({}),
      bySource: [],
      matches: [],
      followUpCompany: null,
    });
    expect(empty).toMatchObject({
      total: 0,
      pipeline: [],
      bestSource: null,
      topMatch: null,
      lowMatch: null,
    });
  });
});
