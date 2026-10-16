import { describe, expect, it } from "vitest";
import {
  applicationCreateSchema,
  applicationListQuerySchema,
  applicationUpdateSchema,
  stageChangeSchema,
} from "@/lib/validators/application";
import { interviewCreateSchema } from "@/lib/validators/interview";
import { resumeCreateSchema, resumeUpdateSchema } from "@/lib/validators/resume";

const validApplication = {
  company: "  Brain Station 23 ",
  title: "Junior Frontend Developer",
  source: "BDJOBS",
  jobDescription: "We need a React developer with TypeScript and REST API experience.",
};

const firstErrorPath = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[] }[] };
}) => result.error?.issues[0]?.path[0];

describe("applicationCreateSchema", () => {
  it("accepts a minimal application and applies defaults", () => {
    const result = applicationCreateSchema.parse(validApplication);
    expect(result.company).toBe("Brain Station 23");
    expect(result.stage).toBe("WISHLIST");
  });

  it("turns empty optional form fields into null", () => {
    const result = applicationCreateSchema.parse({
      ...validApplication,
      location: "",
      notes: "   ",
      jobUrl: "",
      deadline: "",
    });
    expect(result).toMatchObject({ location: null, notes: null, jobUrl: null, deadline: null });
  });

  it("parses dates", () => {
    const result = applicationCreateSchema.parse({ ...validApplication, deadline: "2026-10-20" });
    expect(result.deadline).toBeInstanceOf(Date);
  });

  it.each([
    ["missing company", { company: "" }, "company"],
    ["unknown source", { source: "MONSTER" }, "source"],
    ["short job description", { jobDescription: "Too short" }, "jobDescription"],
    ["non-http link", { jobUrl: "javascript:alert(1)" }, "jobUrl"],
    ["invalid date", { deadline: "next tuesday" }, "deadline"],
    ["negative salary", { salaryMin: -5 }, "salaryMin"],
    ["min salary above max", { salaryMin: 50000, salaryMax: 30000 }, "salaryMax"],
    ["starting at a later stage", { stage: "OFFER" }, "stage"],
  ])("rejects %s", (_label, override, field) => {
    const result = applicationCreateSchema.safeParse({ ...validApplication, ...override });
    expect(result.success).toBe(false);
    expect(firstErrorPath(result)).toBe(field);
  });
});

describe("applicationUpdateSchema", () => {
  it("accepts a partial update", () => {
    expect(applicationUpdateSchema.parse({ notes: "Called HR" })).toEqual({ notes: "Called HR" });
  });

  it("rejects an empty update", () => {
    expect(applicationUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("stageChangeSchema and list query", () => {
  it("only accepts known stages", () => {
    expect(stageChangeSchema.safeParse({ stage: "HIRED" }).success).toBe(false);
    expect(stageChangeSchema.parse({ stage: "SHORTLISTED" }).stage).toBe("SHORTLISTED");
  });

  it("validates list filters and defaults the sort", () => {
    expect(applicationListQuerySchema.parse({}).sort).toBe("newest");
    expect(applicationListQuerySchema.safeParse({ sort: "salary" }).success).toBe(false);
  });
});

describe("resume schemas", () => {
  it("requires a label and enough CV text", () => {
    const result = resumeCreateSchema.safeParse({ label: "", content: "short" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0])).toEqual(["label", "content"]);
  });

  it("rejects an empty update", () => {
    expect(resumeUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("interviewCreateSchema", () => {
  it("requires a date and defaults type and outcome", () => {
    expect(interviewCreateSchema.safeParse({}).success).toBe(false);
    const result = interviewCreateSchema.parse({ scheduledAt: "2026-10-20T10:00:00Z" });
    expect(result).toMatchObject({ type: "OTHER", outcome: "PENDING" });
    expect(result.round).toBeUndefined();
  });
});
