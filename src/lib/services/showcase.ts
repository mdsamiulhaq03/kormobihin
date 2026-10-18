import "server-only";
import { prisma } from "@/lib/db";
import { buildShowcase, type Showcase } from "@/lib/domain/showcase";
import { listApplications } from "@/lib/services/applications";
import { getDashboardStats } from "@/lib/services/stats";

/** The shared examiner account; its data is public by design (see PRODUCT.md). */
export const DEMO_EMAIL = "demo@kormobihin.app";

/**
 * Live numbers from the demo account for the landing preview.
 * Returns null when the account is missing or the database is unreachable, so the
 * landing page still renders (with a clearly labelled example instead).
 */
export async function getDemoShowcase(now = new Date()): Promise<Showcase | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      select: { id: true },
    });
    if (!user) return null;

    const [stats, applications, matches] = await Promise.all([
      getDashboardStats(user.id, now),
      listApplications(user.id, { sort: "newest" }, now),
      prisma.application.findMany({
        where: { userId: user.id, matchScore: { not: null } },
        select: { company: true, matchScore: true, missingSkills: true },
      }),
    ]);

    return buildShowcase({
      byStage: stats.byStage,
      bySource: stats.bySource,
      matches,
      followUpCompany:
        applications.find((app) => app.flags.includes("NO_RESPONSE"))?.company ?? null,
    });
  } catch (error) {
    console.error("Landing showcase unavailable:", error);
    return null;
  }
}
