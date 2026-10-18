import { describe, expect, it } from "vitest";
import {
  buildUpNext,
  groupUpNext,
  upNextSummary,
  type UpNextApplication,
  type UpNextItem,
} from "@/lib/domain/up-next";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-17T06:00:00Z");
const at = (days: number) => new Date(now.getTime() + days * DAY);

const app = (overrides: Partial<UpNextApplication>): UpNextApplication => ({
  id: "a",
  company: "Pathao",
  title: "Frontend Intern",
  appliedAt: null,
  deadline: null,
  flags: [],
  ...overrides,
});

describe("buildUpNext", () => {
  it("turns flags and interviews into verb-first actions, most urgent first", () => {
    const items = buildUpNext(
      [
        app({ id: "late", company: "Dhaka Bank", deadline: at(-2), flags: ["DEADLINE_PASSED"] }),
        app({ id: "quiet", company: "Pathao", appliedAt: at(-28), flags: ["NO_RESPONSE"] }),
        app({ id: "soon", company: "Shohoz", deadline: at(2), flags: ["DEADLINE_SOON"] }),
        app({ id: "quieter", company: "Grameenphone", appliedAt: at(-25), flags: ["NO_RESPONSE"] }),
      ],
      [
        {
          interviewId: "i1",
          applicationId: "bs",
          company: "Brain Station 23",
          title: "Junior Frontend",
          round: 2,
          type: "TECHNICAL",
          scheduledAt: at(3),
        },
      ],
      now,
    );

    expect(items.map((i) => i.kind)).toEqual([
      "INTERVIEW",
      "DEADLINE_SOON",
      "NO_RESPONSE",
      "NO_RESPONSE",
      "DEADLINE_PASSED",
    ]);
    expect(items[0].action).toBe("Prepare for the technical round at Brain Station 23");
    expect(items[1].action).toBe("Apply to Shohoz");
    expect(items[2]).toMatchObject({
      action: "Follow up with Pathao",
      detail: "Applied 28 days ago, no reply yet",
    });
    expect(items[3].applicationId).toBe("quieter");
    expect(items[4].action).toBe("Decide on Dhaka Bank");
  });

  it("returns nothing when there is nothing to do", () => {
    expect(buildUpNext([app({})], [], now)).toEqual([]);
  });
});

const item = (kind: UpNextItem["kind"], key: string): UpNextItem => ({
  key,
  kind,
  applicationId: key,
  action: key,
  detail: "",
  date: now,
});

describe("groupUpNext", () => {
  it("splits items into this week and overdue, keeping their order", () => {
    const groups = groupUpNext([
      item("INTERVIEW", "i"),
      item("DEADLINE_SOON", "d"),
      item("NO_RESPONSE", "n"),
      item("DEADLINE_PASSED", "p"),
    ]);
    expect(groups.map((g) => [g.label, g.items.map((i) => i.key)])).toEqual([
      ["This week", ["i", "d"]],
      ["Overdue", ["n", "p"]],
    ]);
  });

  it("leaves out empty groups", () => {
    expect(groupUpNext([item("NO_RESPONSE", "n")]).map((g) => g.label)).toEqual(["Overdue"]);
    expect(groupUpNext([])).toEqual([]);
  });
});

describe("upNextSummary", () => {
  it.each([
    [[], "You’re all caught up."],
    [[item("INTERVIEW", "i")], "1 thing needs you this week."],
    [[item("INTERVIEW", "i"), item("DEADLINE_SOON", "d")], "2 things need you this week."],
    [[item("NO_RESPONSE", "n")], "Nothing due this week, 1 thing overdue."],
    [
      [item("INTERVIEW", "i"), item("NO_RESPONSE", "n"), item("DEADLINE_PASSED", "p")],
      "1 thing this week, 2 overdue.",
    ],
  ])("%#: %s", (items, text) => {
    expect(upNextSummary(items as UpNextItem[])).toBe(text);
  });
});
