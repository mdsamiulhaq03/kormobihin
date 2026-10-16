import { describe, expect, it } from "vitest";
import { getFlags } from "@/lib/domain/flags";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-16T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);
const daysAhead = (n: number) => new Date(now.getTime() + n * DAY);

describe("NO_RESPONSE flag", () => {
  it("is raised after 21 days at Applied", () => {
    expect(getFlags({ stage: "APPLIED", appliedAt: daysAgo(21), deadline: null }, now)).toEqual([
      "NO_RESPONSE",
    ]);
  });

  it("is not raised before 21 days", () => {
    const appliedAt = new Date(daysAgo(21).getTime() + 60_000); // 20 days 23h 59m
    expect(getFlags({ stage: "APPLIED", appliedAt, deadline: null }, now)).toEqual([]);
  });

  it("is not raised once the company has responded", () => {
    expect(getFlags({ stage: "SHORTLISTED", appliedAt: daysAgo(40), deadline: null }, now)).toEqual(
      [],
    );
  });

  it("is not raised when appliedAt is unknown", () => {
    expect(getFlags({ stage: "APPLIED", appliedAt: null, deadline: null }, now)).toEqual([]);
  });
});

describe("deadline flags (Wishlist only)", () => {
  it("raises DEADLINE_SOON within 3 days", () => {
    expect(getFlags({ stage: "WISHLIST", appliedAt: null, deadline: daysAhead(2) }, now)).toEqual([
      "DEADLINE_SOON",
    ]);
    expect(getFlags({ stage: "WISHLIST", appliedAt: null, deadline: daysAhead(3) }, now)).toEqual([
      "DEADLINE_SOON",
    ]);
  });

  it("raises nothing when the deadline is further away", () => {
    const deadline = new Date(daysAhead(3).getTime() + 60_000);
    expect(getFlags({ stage: "WISHLIST", appliedAt: null, deadline }, now)).toEqual([]);
  });

  it("raises DEADLINE_PASSED after the deadline", () => {
    expect(getFlags({ stage: "WISHLIST", appliedAt: null, deadline: daysAgo(1) }, now)).toEqual([
      "DEADLINE_PASSED",
    ]);
  });

  it("ignores deadlines once the job has been applied to", () => {
    expect(
      getFlags({ stage: "APPLIED", appliedAt: daysAgo(1), deadline: daysAhead(1) }, now),
    ).toEqual([]);
  });

  it("raises nothing without a deadline", () => {
    expect(getFlags({ stage: "WISHLIST", appliedAt: null, deadline: null }, now)).toEqual([]);
  });
});
