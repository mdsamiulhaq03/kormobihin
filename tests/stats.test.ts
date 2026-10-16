import { describe, expect, it } from "vitest";
import { computeStats, type StatsApplication } from "@/lib/domain/stats";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-16T12:00:00Z");
const at = (daysFromNow: number) => new Date(now.getTime() + daysFromNow * DAY);

let counter = 0;
function app(
  overrides: Partial<StatsApplication> & Pick<StatsApplication, "stage">,
): StatsApplication {
  counter += 1;
  return {
    id: `app_${counter}`,
    company: `Company ${counter}`,
    title: "Developer",
    source: "BDJOBS",
    appliedAt: null,
    deadline: null,
    history: [],
    interviews: [],
    ...overrides,
  };
}

/** Builds an application that moved through `path`, one stage every `stepDays`, starting `startDaysAgo`. */
function journey(
  path: StatsApplication["stage"][],
  startDaysAgo: number,
  stepDays: number,
  extra: Partial<StatsApplication> = {},
): StatsApplication {
  const history = path.map((stage, i) => ({
    toStage: stage,
    changedAt: at(-startDaysAgo + i * stepDays),
  }));
  const appliedIndex = path.indexOf("APPLIED");
  return app({
    stage: path[path.length - 1],
    appliedAt: appliedIndex >= 0 ? history[appliedIndex].changedAt : null,
    history,
    ...extra,
  });
}

describe("computeStats", () => {
  it("returns zeros (not NaN) when there are no applications", () => {
    const stats = computeStats([], now);
    expect(stats.total).toBe(0);
    expect(stats.applied).toBe(0);
    expect(stats.responseRate).toBe(0);
    expect(stats.interviewRate).toBe(0);
    expect(stats.offerRate).toBe(0);
    expect(stats.avgDaysToResponse).toBeNull();
    expect(stats.byStage.WISHLIST).toBe(0);
    expect(stats.bySource).toEqual([]);
  });

  it("counts applications per stage", () => {
    const stats = computeStats(
      [
        app({ stage: "WISHLIST" }),
        app({ stage: "WISHLIST" }),
        journey(["WISHLIST", "APPLIED"], 5, 1),
      ],
      now,
    );
    expect(stats.total).toBe(3);
    expect(stats.byStage).toMatchObject({ WISHLIST: 2, APPLIED: 1, OFFER: 0 });
  });

  it("calculates response, interview and offer rates over applications actually sent", () => {
    const apps = [
      app({ stage: "WISHLIST" }), // not sent: excluded from rates
      journey(["WISHLIST", "APPLIED"], 10, 1), // no response yet
      journey(["WISHLIST", "APPLIED", "REJECTED"], 20, 4), // responded (rejection counts)
      journey(["WISHLIST", "APPLIED", "SHORTLISTED", "INTERVIEW"], 30, 2), // interviewed
      journey(["WISHLIST", "APPLIED", "SHORTLISTED", "INTERVIEW", "OFFER"], 40, 6), // offer
    ];
    const stats = computeStats(apps, now);
    expect(stats.applied).toBe(4);
    expect(stats.responded).toBe(3);
    expect(stats.responseRate).toBe(75);
    expect(stats.interviewRate).toBe(50);
    expect(stats.offerRate).toBe(25);
  });

  it("averages days from applying to the first response", () => {
    const apps = [
      journey(["WISHLIST", "APPLIED", "REJECTED"], 20, 4), // 4 days
      journey(["WISHLIST", "APPLIED", "SHORTLISTED"], 30, 2), // 2 days
      journey(["WISHLIST", "APPLIED"], 10, 1), // no response: ignored
    ];
    expect(computeStats(apps, now).avgDaysToResponse).toBe(3);
  });

  it("breaks results down by source, busiest first", () => {
    const apps = [
      journey(["WISHLIST", "APPLIED", "SHORTLISTED"], 10, 1, { source: "LINKEDIN" }),
      journey(["WISHLIST", "APPLIED"], 10, 1, { source: "LINKEDIN" }),
      journey(["WISHLIST", "APPLIED"], 10, 1, { source: "BDJOBS" }),
      journey(["WISHLIST", "APPLIED"], 10, 1, { source: "BDJOBS" }),
      journey(["WISHLIST", "APPLIED"], 10, 1, { source: "BDJOBS" }),
      app({ stage: "WISHLIST", source: "FACEBOOK" }), // not applied: no source row
    ];
    expect(computeStats(apps, now).bySource).toEqual([
      { source: "BDJOBS", applied: 3, responded: 0, responseRate: 0 },
      { source: "LINKEDIN", applied: 2, responded: 1, responseRate: 50 },
    ]);
  });

  it("lists pending interviews in the next 7 days, soonest first", () => {
    const apps = [
      app({
        stage: "INTERVIEW",
        company: "Brain Station 23",
        interviews: [
          { id: "i1", round: 1, type: "WRITTEN", outcome: "PASSED", scheduledAt: at(-3) }, // past
          { id: "i2", round: 2, type: "TECHNICAL", outcome: "PENDING", scheduledAt: at(5) },
        ],
      }),
      app({
        stage: "INTERVIEW",
        company: "Pathao",
        interviews: [
          { id: "i3", round: 1, type: "HR", outcome: "PENDING", scheduledAt: at(1) },
          { id: "i4", round: 2, type: "HR", outcome: "PENDING", scheduledAt: at(9) }, // too far
        ],
      }),
    ];
    const upcoming = computeStats(apps, now).upcomingInterviews;
    expect(upcoming.map((i) => i.interviewId)).toEqual(["i3", "i2"]);
    expect(upcoming[0]).toMatchObject({ company: "Pathao", round: 1, type: "HR" });
  });

  it("lists wishlist deadlines in the next 7 days and counts flags", () => {
    const apps = [
      app({ stage: "WISHLIST", deadline: at(2) }),
      app({ stage: "WISHLIST", deadline: at(6) }),
      app({ stage: "WISHLIST", deadline: at(20) }),
      app({ stage: "WISHLIST", deadline: at(-1) }),
      journey(["WISHLIST", "APPLIED"], 30, 1), // no response for 29 days
    ];
    const stats = computeStats(apps, now);
    expect(stats.upcomingDeadlines).toHaveLength(2);
    expect(stats.flagCounts).toEqual({ NO_RESPONSE: 1, DEADLINE_SOON: 1, DEADLINE_PASSED: 1 });
  });
});
