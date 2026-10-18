import { describe, expect, it } from "vitest";
import type { Stage } from "@/generated/prisma/enums";
import {
  InvalidStageTransitionError,
  STAGES,
  canTransition,
  getNextStages,
  isTerminal,
  planStageChange,
  reopenTarget,
} from "@/lib/domain/stages";

describe("stage transitions", () => {
  it.each([
    ["WISHLIST", "APPLIED"],
    ["APPLIED", "SHORTLISTED"],
    ["APPLIED", "REJECTED"],
    ["SHORTLISTED", "INTERVIEW"],
    ["SHORTLISTED", "REJECTED"],
    ["INTERVIEW", "OFFER"],
    ["INTERVIEW", "REJECTED"],
    ["OFFER", "ACCEPTED"],
    ["OFFER", "DECLINED"],
  ] as const)("allows %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    ["WISHLIST", "OFFER"], // can't skip the process
    ["WISHLIST", "REJECTED"], // unwanted wishlist items are deleted instead
    ["APPLIED", "INTERVIEW"], // must be shortlisted first
    ["SHORTLISTED", "APPLIED"], // no going backwards
    ["OFFER", "REJECTED"], // an offer is accepted or declined
    ["APPLIED", "APPLIED"], // no-op is not a transition
  ] as const)("blocks %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it("treats ACCEPTED, REJECTED and DECLINED as final", () => {
    for (const stage of ["ACCEPTED", "REJECTED", "DECLINED"] as const) {
      expect(isTerminal(stage)).toBe(true);
      expect(getNextStages(stage)).toEqual([]);
      for (const target of STAGES) expect(canTransition(stage, target)).toBe(false);
    }
  });

  it("lists the allowed next stages for the UI", () => {
    expect(getNextStages("APPLIED")).toEqual(["SHORTLISTED", "REJECTED"]);
    expect(getNextStages("OFFER")).toEqual(["ACCEPTED", "DECLINED"]);
  });
});

describe("planStageChange", () => {
  const now = new Date("2026-10-16T10:00:00Z");

  it("sets appliedAt when an application is first marked as applied", () => {
    const plan = planStageChange({ stage: "WISHLIST", appliedAt: null }, "APPLIED", now);
    expect(plan).toEqual({ stage: "APPLIED", appliedAt: now, fromStage: "WISHLIST" });
  });

  it("keeps an existing appliedAt", () => {
    const earlier = new Date("2026-10-01T00:00:00Z");
    const plan = planStageChange({ stage: "WISHLIST", appliedAt: earlier }, "APPLIED", now);
    expect(plan.appliedAt).toBe(earlier);
  });

  it("does not touch appliedAt for later stages", () => {
    const applied = new Date("2026-10-01T00:00:00Z");
    const plan = planStageChange({ stage: "APPLIED", appliedAt: applied }, "SHORTLISTED", now);
    expect(plan).toEqual({ stage: "SHORTLISTED", appliedAt: applied, fromStage: "APPLIED" });
  });

  it("throws a clear 422 error for an invalid move", () => {
    expect(() => planStageChange({ stage: "WISHLIST", appliedAt: null }, "OFFER", now)).toThrow(
      InvalidStageTransitionError,
    );
    try {
      planStageChange({ stage: "REJECTED", appliedAt: null }, "APPLIED", now);
    } catch (error) {
      expect((error as InvalidStageTransitionError).status).toBe(422);
      expect((error as Error).message).toBe(
        'Can\'t move from "Rejected" to "Applied". Rejected is a final stage.',
      );
    }
  });
});

describe("reopenTarget", () => {
  const h = (fromStage: Stage | null, toStage: Stage) => ({ fromStage, toStage });

  it("sends a rejected application back to the stage it was rejected from", () => {
    const history = [
      h(null, "WISHLIST"),
      h("WISHLIST", "APPLIED"),
      h("APPLIED", "SHORTLISTED"),
      h("SHORTLISTED", "INTERVIEW"),
      h("INTERVIEW", "REJECTED"),
    ];
    expect(reopenTarget("REJECTED", history)).toBe("INTERVIEW");
  });

  it("uses the latest closing move when it was reopened and closed again", () => {
    const history = [
      h("APPLIED", "REJECTED"),
      h("REJECTED", "APPLIED"),
      h("APPLIED", "SHORTLISTED"),
      h("SHORTLISTED", "REJECTED"),
    ];
    expect(reopenTarget("REJECTED", history)).toBe("SHORTLISTED");
  });

  it("sends a declined offer back to Offer", () => {
    expect(reopenTarget("DECLINED", [h("OFFER", "DECLINED")])).toBe("OFFER");
  });

  it("falls back to the earliest stage that can lead to the closed one when history is missing", () => {
    expect(reopenTarget("REJECTED", [])).toBe("APPLIED");
    expect(reopenTarget("DECLINED", [])).toBe("OFFER");
  });

  it("only reopens rejected or declined applications", () => {
    expect(reopenTarget("ACCEPTED", [h("OFFER", "ACCEPTED")])).toBeNull();
    expect(reopenTarget("APPLIED", [])).toBeNull();
  });
});
