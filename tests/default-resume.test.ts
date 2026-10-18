import { describe, expect, it } from "vitest";
import { defaultResumeId } from "@/lib/domain/resumes";

describe("defaultResumeId", () => {
  it("returns null when there are no CVs", () => {
    expect(defaultResumeId([])).toBeNull();
  });

  it("picks the CV used for the most applications", () => {
    const resumes = [
      { id: "new", applicationCount: 1 },
      { id: "frontend", applicationCount: 7 },
      { id: "general", applicationCount: 4 },
    ];
    expect(defaultResumeId(resumes)).toBe("frontend");
  });

  it("keeps the list order (most recently edited first) on a tie", () => {
    const resumes = [
      { id: "recent", applicationCount: 0 },
      { id: "older", applicationCount: 0 },
    ];
    expect(defaultResumeId(resumes)).toBe("recent");
  });
});
