import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { InvalidStageTransitionError } from "@/lib/domain/stages";
import { AppError, NotFoundError } from "@/lib/errors";
import {
  changeStage,
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  reopenApplication,
  updateApplication,
} from "@/lib/services/applications";
import { createInterview, deleteInterview, updateInterview } from "@/lib/services/interviews";
import { createResume, deleteResume, getResume } from "@/lib/services/resumes";
import { getDashboardStats } from "@/lib/services/stats";
import { applicationCreateSchema } from "@/lib/validators/application";

// Runs the real services against the real database with two throwaway users,
// then deletes them (cascade removes everything they own).

const runId = randomUUID().slice(0, 8);
let alice: string;
let bob: string;

const newApplication = (overrides: Record<string, unknown> = {}) =>
  applicationCreateSchema.parse({
    company: "Integration Test Co",
    title: "Junior Developer",
    source: "LINKEDIN",
    jobDescription: "React, TypeScript and REST API experience required for this role.",
    stage: "WISHLIST",
    ...overrides,
  });

beforeAll(async () => {
  const make = (name: string) =>
    prisma.user.create({
      data: { name, email: `${name}-${runId}@test.kormobihin.app`, passwordHash: "x" },
    });
  alice = (await make("alice")).id;
  bob = (await make("bob")).id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
  await prisma.$disconnect();
});

describe("ownership (authorization)", () => {
  it("never lets one user read, change or delete another user's data", async () => {
    const app = await createApplication(alice, newApplication());
    const resume = await createResume(alice, { label: "Alice CV", content: "x".repeat(60) });

    await expect(getApplication(bob, app.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateApplication(bob, app.id, { notes: "hacked" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(changeStage(bob, app.id, { stage: "APPLIED" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(deleteApplication(bob, app.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getResume(bob, resume.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteResume(bob, resume.id)).rejects.toBeInstanceOf(NotFoundError);

    const bobsList = await listApplications(bob, { sort: "newest" });
    expect(bobsList.find((a) => a.id === app.id)).toBeUndefined();

    // Alice's data is untouched.
    expect((await getApplication(alice, app.id)).notes).toBeNull();
  });

  it("rejects linking another user's CV to an application", async () => {
    const bobsResume = await createResume(bob, { label: "Bob CV", content: "y".repeat(60) });
    await expect(
      createApplication(alice, newApplication({ resumeId: bobsResume.id })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("stage workflow", () => {
  it("creates the first history entry and records appliedAt", async () => {
    const app = await createApplication(alice, newApplication({ stage: "APPLIED" }));
    expect(app.stage).toBe("APPLIED");
    expect(app.appliedAt).toBeInstanceOf(Date);
    expect(app.history).toHaveLength(1);
    expect(app.history[0]).toMatchObject({ fromStage: null, toStage: "APPLIED" });
    expect(app.nextStages).toEqual(["SHORTLISTED", "REJECTED"]);
  });

  it("moves through stages, writing a history row for each change", async () => {
    const created = await createApplication(alice, newApplication());
    await changeStage(alice, created.id, { stage: "APPLIED" });
    await changeStage(alice, created.id, { stage: "SHORTLISTED", note: "HR called" });
    const app = await getApplication(alice, created.id);

    expect(app.stage).toBe("SHORTLISTED");
    expect(app.appliedAt).toBeInstanceOf(Date);
    expect(app.history.map((h) => h.toStage)).toEqual(["WISHLIST", "APPLIED", "SHORTLISTED"]);
    expect(app.history[2]).toMatchObject({ fromStage: "APPLIED", note: "HR called" });
  });

  it("rejects an invalid move without changing anything", async () => {
    const created = await createApplication(alice, newApplication());
    await expect(changeStage(alice, created.id, { stage: "OFFER" })).rejects.toBeInstanceOf(
      InvalidStageTransitionError,
    );
    const app = await getApplication(alice, created.id);
    expect(app.stage).toBe("WISHLIST");
    expect(app.history).toHaveLength(1);
  });

  it("lets only one of two simultaneous moves succeed", async () => {
    const created = await createApplication(alice, newApplication({ stage: "APPLIED" }));
    const results = await Promise.allSettled([
      changeStage(alice, created.id, { stage: "SHORTLISTED" }),
      changeStage(alice, created.id, { stage: "REJECTED" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const app = await getApplication(alice, created.id);
    expect(app.history).toHaveLength(2);
  });

  it("reopens a rejected application to the stage it was rejected from", async () => {
    const created = await createApplication(alice, newApplication({ stage: "APPLIED" }));
    await changeStage(alice, created.id, { stage: "SHORTLISTED" });
    await changeStage(alice, created.id, { stage: "REJECTED" });

    const app = await reopenApplication(alice, created.id);
    expect(app.stage).toBe("SHORTLISTED");
    expect(app.history.at(-1)).toMatchObject({
      fromStage: "REJECTED",
      toStage: "SHORTLISTED",
      note: "Reopened",
    });

    // Only closed applications can be reopened, and only by their owner.
    await expect(reopenApplication(alice, created.id)).rejects.toBeInstanceOf(AppError);
    await changeStage(alice, created.id, { stage: "REJECTED" });
    await expect(reopenApplication(bob, created.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("interviews", () => {
  it("blocks interviews before applying, then numbers rounds automatically", async () => {
    const created = await createApplication(alice, newApplication());
    await expect(
      createInterview(alice, created.id, {
        scheduledAt: new Date(),
        type: "HR",
        outcome: "PENDING",
      }),
    ).rejects.toBeInstanceOf(AppError);

    await changeStage(alice, created.id, { stage: "APPLIED" });
    const first = await createInterview(alice, created.id, {
      scheduledAt: new Date(),
      type: "WRITTEN",
      outcome: "PENDING",
    });
    const second = await createInterview(alice, created.id, {
      scheduledAt: new Date(),
      type: "TECHNICAL",
      outcome: "PENDING",
    });
    expect([first.round, second.round]).toEqual([1, 2]);

    const updated = await updateInterview(alice, created.id, first.id, { outcome: "PASSED" });
    expect(updated.outcome).toBe("PASSED");

    await expect(deleteInterview(bob, created.id, second.id)).rejects.toBeInstanceOf(NotFoundError);
    await deleteInterview(alice, created.id, second.id);
    expect((await getApplication(alice, created.id)).interviews).toHaveLength(1);
  });
});

describe("match results become stale", () => {
  it("clears the stored AI result when the job description changes", async () => {
    const created = await createApplication(alice, newApplication());
    await prisma.application.update({
      where: { id: created.id },
      data: {
        matchScore: 80,
        matchLabel: "Strong",
        matchedSkills: ["React"],
        matchedAt: new Date(),
      },
    });

    const unchanged = await updateApplication(alice, created.id, { notes: "follow up" });
    expect(unchanged.matchScore).toBe(80);

    const changed = await updateApplication(alice, created.id, {
      jobDescription: "Now we need Java, Spring Boot and MySQL experience instead of React.",
    });
    expect(changed.matchScore).toBeNull();
    expect(changed.matchedSkills).toEqual([]);
  });
});

describe("list and stats", () => {
  it("filters, searches and computes stats for the user only", async () => {
    await createApplication(
      bob,
      newApplication({ company: "Unique Searchable Ltd", stage: "APPLIED" }),
    );
    await createApplication(bob, newApplication({ company: "Other Co" }));

    const searched = await listApplications(bob, { q: "searchable", sort: "newest" });
    expect(searched.map((a) => a.company)).toEqual(["Unique Searchable Ltd"]);

    const applied = await listApplications(bob, { stage: "APPLIED", sort: "newest" });
    expect(applied.every((a) => a.stage === "APPLIED")).toBe(true);

    const open = await listApplications(bob, { closed: "hide", sort: "newest" });
    expect(open.some((a) => a.stage === "REJECTED" || a.stage === "DECLINED")).toBe(false);

    const stats = await getDashboardStats(bob);
    expect(stats.byStage.APPLIED).toBeGreaterThanOrEqual(1);
    expect(stats.total).toBe((await listApplications(bob, { sort: "newest" })).length);
  });
});
