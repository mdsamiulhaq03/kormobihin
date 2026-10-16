import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  APPLICATIONS,
  DEMO_USER,
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
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS);

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
) {
  const path = app.history.path;
  const stageDates = path.map((_, i) => daysFromNow(-app.createdDaysAgo + i * app.stepDays));
  const appliedIndex = path.indexOf("APPLIED");

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
      deadline: app.deadlineInDays === undefined ? null : daysFromNow(app.deadlineInDays),
      appliedAt: appliedIndex >= 0 ? stageDates[appliedIndex] : null,
      stage: path[path.length - 1],
      createdAt: stageDates[0],
      history: {
        create: path.map((stage, i) => ({
          fromStage: i === 0 ? null : path[i - 1],
          toStage: stage,
          changedAt: stageDates[i],
        })),
      },
      interviews: {
        create: (app.interviews ?? []).map((interview) => ({
          round: interview.round,
          scheduledAt: daysFromNow(interview.inDays),
          type: interview.type,
          outcome: interview.outcome,
          notes: interview.notes,
        })),
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

  for (const app of APPLICATIONS) {
    await createApplication(demo.id, app, resumeIds);
  }

  const other = await createUser(OTHER_USER);
  await createApplication(other.id, OTHER_USER_APPLICATION, {});

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
