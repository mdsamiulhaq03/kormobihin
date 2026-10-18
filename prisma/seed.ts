import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { InterviewType } from "../src/generated/prisma/enums";
import {
  APPLICATIONS,
  DEMO_USER,
  MATCH_RESULTS,
  OTHER_USER,
  OTHER_USER_APPLICATION,
  RESUMES,
  type SeedApplication,
} from "./seed-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DAY_MS = 24 * 60 * 60 * 1000;
const DHAKA_OFFSET_HOURS = 6; // Asia/Dhaka is UTC+6 all year (no daylight saving)

/**
 * A date `days` from today at a fixed Dhaka wall-clock time, so seeded events look
 * real ("10:30 am") instead of all sharing the time the seed happened to run.
 */
function dhakaDate(days: number, hour: number, minute = 0): Date {
  const shifted = new Date(Date.now() + days * DAY_MS + DHAKA_OFFSET_HOURS * 60 * 60 * 1000);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      hour - DHAKA_OFFSET_HOURS,
      minute,
    ),
  );
}

// Office-hour times that vary between events.
const EVENT_TIMES: [number, number][] = [
  [9, 40],
  [11, 15],
  [14, 20],
  [16, 5],
  [12, 30],
  [17, 45],
];

const INTERVIEW_TIMES: Record<InterviewType, [number, number]> = {
  WRITTEN: [10, 0],
  VIVA: [11, 30],
  TECHNICAL: [15, 0],
  HR: [16, 30],
  PHONE: [12, 0],
  OTHER: [14, 0],
};

async function createUser(user: { name: string; email: string; password: string }) {
  // Re-running the seed replaces the demo accounts; cascade deletes their data.
  await prisma.user.deleteMany({ where: { email: user.email } });
  return prisma.user.create({
    data: {
      name: user.name,
      email: user.email,
      passwordHash: await bcrypt.hash(user.password, 10),
    },
  });
}

async function createApplication(
  userId: string,
  app: SeedApplication,
  resumeIds: Record<string, string>,
  index: number,
) {
  const path = app.history.path;
  const stageDates = path.map((_, i) => {
    const [hour, minute] = EVENT_TIMES[(index + i) % EVENT_TIMES.length];
    return dhakaDate(-app.createdDaysAgo + i * app.stepDays, hour, minute);
  });
  const appliedIndex = path.indexOf("APPLIED");
  const match = MATCH_RESULTS[app.company];

  return prisma.application.create({
    data: {
      userId,
      resumeId: app.resume ? resumeIds[app.resume] : null,
      company: app.company,
      title: app.title,
      source: app.source,
      location: app.location,
      salaryMin: app.salaryMin,
      salaryMax: app.salaryMax,
      jobUrl: app.jobUrl,
      jobDescription: app.jobDescription,
      notes: app.notes,
      // Deadlines close at the end of the day, Dhaka time.
      deadline: app.deadlineInDays === undefined ? null : dhakaDate(app.deadlineInDays, 23, 59),
      appliedAt: appliedIndex >= 0 ? stageDates[appliedIndex] : null,
      stage: path[path.length - 1],
      createdAt: stageDates[0],
      ...(match
        ? {
            matchScore: match.score,
            matchLabel: match.score >= 75 ? "Strong" : match.score >= 50 ? "Moderate" : "Weak",
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
            matchTips: match.tips,
            matchedAt: dhakaDate(-1, 21, 10),
          }
        : {}),
      history: {
        create: path.map((stage, i) => ({
          fromStage: i === 0 ? null : path[i - 1],
          toStage: stage,
          changedAt: stageDates[i],
        })),
      },
      interviews: {
        create: (app.interviews ?? []).map((interview) => {
          const [hour, minute] = INTERVIEW_TIMES[interview.type];
          return {
            round: interview.round,
            scheduledAt: dhakaDate(interview.inDays, hour, minute),
            type: interview.type,
            outcome: interview.outcome,
            notes: interview.notes,
          };
        }),
      },
    },
  });
}

async function main() {
  const demo = await createUser(DEMO_USER);

  const resumeIds: Record<string, string> = {};
  for (const [key, resume] of Object.entries(RESUMES)) {
    const created = await prisma.resume.create({ data: { ...resume, userId: demo.id } });
    resumeIds[key] = created.id;
  }

  for (const [index, app] of APPLICATIONS.entries()) {
    await createApplication(demo.id, app, resumeIds, index);
  }

  const other = await createUser(OTHER_USER);
  await createApplication(other.id, OTHER_USER_APPLICATION, {}, 0);

  console.info(
    `Seeded ${APPLICATIONS.length} applications for ${DEMO_USER.email} and 1 for ${OTHER_USER.email}.`,
  );
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
