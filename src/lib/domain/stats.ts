import type { InterviewOutcome, InterviewType, JobSource, Stage } from "@/generated/prisma/enums";
import { DAY_MS, getFlags, type Flag } from "@/lib/domain/flags";
import { RESPONDED_STAGES, STAGES } from "@/lib/domain/stages";

export const UPCOMING_WINDOW_DAYS = 7;

export type StatsApplication = {
  id: string;
  company: string;
  title: string;
  source: JobSource;
  stage: Stage;
  appliedAt: Date | null;
  deadline: Date | null;
  history: { toStage: Stage; changedAt: Date }[];
  interviews: {
    id: string;
    round: number;
    type: InterviewType;
    outcome: InterviewOutcome;
    scheduledAt: Date;
  }[];
};

export type SourceStats = {
  source: JobSource;
  applied: number;
  responded: number;
  responseRate: number;
};

export type UpcomingInterview = {
  interviewId: string;
  applicationId: string;
  company: string;
  title: string;
  round: number;
  type: InterviewType;
  scheduledAt: Date;
};

export type UpcomingDeadline = {
  applicationId: string;
  company: string;
  title: string;
  deadline: Date;
};

export type DashboardStats = {
  total: number;
  byStage: Record<Stage, number>;
  applied: number;
  responded: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  avgDaysToResponse: number | null;
  bySource: SourceStats[];
  upcomingInterviews: UpcomingInterview[];
  upcomingDeadlines: UpcomingDeadline[];
  flagCounts: Record<Flag, number>;
};

/** Whole-number percentage; 0 when there is nothing to divide by. */
export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

const wasSent = (app: StatsApplication) => app.stage !== "WISHLIST";
const hasResponse = (app: StatsApplication) => RESPONDED_STAGES.includes(app.stage);
const reached = (app: StatsApplication, stage: Stage) =>
  app.stage === stage || app.history.some((h) => h.toStage === stage);

/** Days between applying and the first stage change after it, or null if no reply yet. */
function daysToFirstResponse(app: StatsApplication): number | null {
  if (!app.appliedAt || !hasResponse(app)) return null;
  const appliedTime = app.appliedAt.getTime();
  const firstReply = app.history
    .filter((h) => RESPONDED_STAGES.includes(h.toStage) && h.changedAt.getTime() >= appliedTime)
    .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime())[0];
  return firstReply ? (firstReply.changedAt.getTime() - appliedTime) / DAY_MS : null;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(mean * 10) / 10;
}

function countByStage(apps: StatsApplication[]): Record<Stage, number> {
  const counts = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  for (const app of apps) counts[app.stage] += 1;
  return counts;
}

function statsBySource(sent: StatsApplication[]): SourceStats[] {
  const groups = new Map<JobSource, StatsApplication[]>();
  for (const app of sent) groups.set(app.source, [...(groups.get(app.source) ?? []), app]);

  return [...groups.entries()]
    .map(([source, apps]) => {
      const responded = apps.filter(hasResponse).length;
      return {
        source,
        applied: apps.length,
        responded,
        responseRate: percent(responded, apps.length),
      };
    })
    .sort((a, b) => b.applied - a.applied || a.source.localeCompare(b.source));
}

function upcomingInterviews(apps: StatsApplication[], now: Date): UpcomingInterview[] {
  const until = now.getTime() + UPCOMING_WINDOW_DAYS * DAY_MS;
  return apps
    .flatMap((app) =>
      app.interviews
        .filter((i) => i.outcome === "PENDING")
        .filter((i) => i.scheduledAt.getTime() >= now.getTime() && i.scheduledAt.getTime() <= until)
        .map((i) => ({
          interviewId: i.id,
          applicationId: app.id,
          company: app.company,
          title: app.title,
          round: i.round,
          type: i.type,
          scheduledAt: i.scheduledAt,
        })),
    )
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

function upcomingDeadlines(apps: StatsApplication[], now: Date): UpcomingDeadline[] {
  const until = now.getTime() + UPCOMING_WINDOW_DAYS * DAY_MS;
  return apps
    .filter((app) => app.stage === "WISHLIST" && app.deadline)
    .filter((app) => app.deadline!.getTime() >= now.getTime() && app.deadline!.getTime() <= until)
    .map((app) => ({
      applicationId: app.id,
      company: app.company,
      title: app.title,
      deadline: app.deadline!,
    }))
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
}

function countFlags(apps: StatsApplication[], now: Date): Record<Flag, number> {
  const counts: Record<Flag, number> = { NO_RESPONSE: 0, DEADLINE_SOON: 0, DEADLINE_PASSED: 0 };
  for (const app of apps) for (const flag of getFlags(app, now)) counts[flag] += 1;
  return counts;
}

/**
 * Dashboard numbers for one user's applications. Rates are calculated over
 * applications actually sent (Wishlist items are excluded).
 */
export function computeStats(apps: StatsApplication[], now: Date): DashboardStats {
  const sent = apps.filter(wasSent);
  const responded = sent.filter(hasResponse).length;
  const interviewed = sent.filter((a) => reached(a, "INTERVIEW")).length;
  const offers = sent.filter((a) => reached(a, "OFFER")).length;
  const responseDays = sent.map(daysToFirstResponse).filter((d): d is number => d !== null);

  return {
    total: apps.length,
    byStage: countByStage(apps),
    applied: sent.length,
    responded,
    responseRate: percent(responded, sent.length),
    interviewRate: percent(interviewed, sent.length),
    offerRate: percent(offers, sent.length),
    avgDaysToResponse: average(responseDays),
    bySource: statsBySource(sent),
    upcomingInterviews: upcomingInterviews(apps, now),
    upcomingDeadlines: upcomingDeadlines(apps, now),
    flagCounts: countFlags(apps, now),
  };
}

/** A source needs at least this many sent applications before it can be called "best". */
export const MIN_APPLIED_FOR_BEST = 2;

/**
 * The job site that replies most often. Sources with too few applications are only used
 * when nothing else qualifies, so "1 of 1" doesn't beat "3 of 4". Null when nobody replied.
 */
export function bestSource(bySource: SourceStats[]): SourceStats | null {
  const qualified = bySource.filter((s) => s.applied >= MIN_APPLIED_FOR_BEST);
  const pool = qualified.length > 0 ? qualified : bySource;
  const best = [...pool].sort(
    (a, b) => b.responseRate - a.responseRate || b.applied - a.applied,
  )[0];
  return best && best.responded > 0 ? best : null;
}
