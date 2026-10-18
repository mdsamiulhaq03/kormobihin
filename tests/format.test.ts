import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatRelativeDays,
  formatSalary,
  plural,
} from "@/lib/client/format";

describe("formatRelativeDays (Dhaka calendar days)", () => {
  // 17 Oct 2026, 05:51 in Dhaka
  const now = new Date("2026-10-16T23:51:00Z");

  it("counts calendar days, not 24-hour blocks", () => {
    // 15 Oct 23:59 Dhaka is two calendar days back even though it's ~30 hours ago.
    expect(formatRelativeDays(new Date("2026-10-15T17:59:00Z"), now)).toBe("2 days ago");
    expect(formatRelativeDays(new Date("2026-10-17T17:00:00Z"), now)).toBe("today");
    expect(formatRelativeDays(new Date("2026-10-18T03:00:00Z"), now)).toBe("tomorrow");
    expect(formatRelativeDays(new Date("2026-10-20T09:00:00Z"), now)).toBe("in 3 days");
  });
});

describe("formatSalary and plural", () => {
  it("formats taka with Bangladeshi grouping", () => {
    expect(formatSalary(30000, 150000)).toBe("৳30,000 – ৳1,50,000");
    expect(formatSalary(null, null)).toBeNull();
  });

  it("pluralises", () => {
    expect(plural(1, "job")).toBe("1 job");
    expect(plural(3, "job")).toBe("3 jobs");
    expect(plural(2, "application uses", "applications use")).toBe("2 applications use");
  });
});

describe("formatDayMonth", () => {
  it("uses the Dhaka date, even late at night UTC", () => {
    // 19 Oct 20:00 UTC is already 20 Oct 02:00 in Dhaka.
    expect(formatDayMonth(new Date("2026-10-19T20:00:00Z"))).toEqual({ day: "20", month: "Oct" });
  });
});

describe("three-letter months", () => {
  it("writes September as Sep, like Oct and Aug", () => {
    const sept = new Date("2026-09-22T06:00:00Z");
    expect(formatDate(sept)).toBe("22 Sep 2026");
    expect(formatDateTime(sept)).toMatch(/^22 Sep, /);
    expect(formatDayMonth(sept)).toEqual({ day: "22", month: "Sep" });
  });
});
