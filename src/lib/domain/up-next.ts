import type { InterviewType } from "@/generated/prisma/enums";
import { DAY_MS, type Flag } from "@/lib/domain/flags";
import type { UpcomingInterview } from "@/lib/domain/stats";

// Turns flags and upcoming interviews into one "Up next" list of concrete actions,
// so the dashboard says what to do, not just what's wrong.

export type UpNextKind = "INTERVIEW" | Flag;

export type UpNextItem = {
  key: string;
  kind: UpNextKind;
  applicationId: string;
  /** Verb-first: "Follow up with Pathao". */
  action: string;
  detail: string;
  /** The date the item is about (interview, deadline or applied date). */
  date: Date;
};

export type UpNextApplication = {
  id: string;
  company: string;
  title: string;
  appliedAt: Date | null;
  deadline: Date | null;
  flags: Flag[];
};

const ROUND_NAMES: Record<InterviewType, string> = {
  PHONE: "phone screen",
  WRITTEN: "written test",
  VIVA: "viva",
  TECHNICAL: "technical round",
  HR: "HR round",
  OTHER: "interview",
};

const ORDER: Record<UpNextKind, number> = {
  INTERVIEW: 0,
  DEADLINE_SOON: 1,
  NO_RESPONSE: 2,
  DEADLINE_PASSED: 3,
};

const wholeDays = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / DAY_MS);

export function buildUpNext(
  applications: UpNextApplication[],
  interviews: UpcomingInterview[],
  now: Date,
): UpNextItem[] {
  const items: UpNextItem[] = interviews.map((interview) => ({
    key: `interview-${interview.interviewId}`,
    kind: "INTERVIEW",
    applicationId: interview.applicationId,
    action: `Prepare for the ${ROUND_NAMES[interview.type]} at ${interview.company}`,
    detail: `Round ${interview.round} · ${interview.title}`,
    date: interview.scheduledAt,
  }));

  for (const app of applications) {
    for (const flag of app.flags) {
      if (flag === "NO_RESPONSE" && app.appliedAt) {
        items.push({
          key: `${flag}-${app.id}`,
          kind: flag,
          applicationId: app.id,
          action: `Follow up with ${app.company}`,
          detail: `Applied ${wholeDays(app.appliedAt, now)} days ago, no reply yet`,
          date: app.appliedAt,
        });
      } else if (flag === "DEADLINE_SOON" && app.deadline) {
        items.push({
          key: `${flag}-${app.id}`,
          kind: flag,
          applicationId: app.id,
          action: `Apply to ${app.company}`,
          detail: `${app.title} · applications close soon`,
          date: app.deadline,
        });
      } else if (flag === "DEADLINE_PASSED" && app.deadline) {
        items.push({
          key: `${flag}-${app.id}`,
          kind: flag,
          applicationId: app.id,
          action: `Decide on ${app.company}`,
          detail:
            "The deadline has passed. Remove it, or keep it if they still accept applications",
          date: app.deadline,
        });
      }
    }
  }

  // Most urgent kind first; within a kind, the soonest date (or longest wait) first.
  return items.sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.date.getTime() - b.date.getTime());
}

export type UpNextGroup = { id: "this-week" | "overdue"; label: string; items: UpNextItem[] };

// Interviews and closing deadlines are ahead of the user; follow-ups and passed
// deadlines are already late. Keeping them apart stops "this week" from counting both.
const GROUP_OF: Record<UpNextKind, UpNextGroup["id"]> = {
  INTERVIEW: "this-week",
  DEADLINE_SOON: "this-week",
  NO_RESPONSE: "overdue",
  DEADLINE_PASSED: "overdue",
};

/** Splits a sorted Up next list into "This week" and "Overdue", dropping empty groups. */
export function groupUpNext(items: UpNextItem[]): UpNextGroup[] {
  const groups: UpNextGroup[] = [
    {
      id: "this-week",
      label: "This week",
      items: items.filter((i) => GROUP_OF[i.kind] === "this-week"),
    },
    { id: "overdue", label: "Overdue", items: items.filter((i) => GROUP_OF[i.kind] === "overdue") },
  ];
  return groups.filter((group) => group.items.length > 0);
}

const things = (n: number) => `${n} ${n === 1 ? "thing" : "things"}`;

/** The dashboard's one-line answer to "what needs me?". */
export function upNextSummary(items: UpNextItem[]): string {
  const soon = items.filter((i) => GROUP_OF[i.kind] === "this-week").length;
  const overdue = items.length - soon;
  if (items.length === 0) return "You’re all caught up.";
  if (overdue === 0) return `${things(soon)} need${soon === 1 ? "s" : ""} you this week.`;
  if (soon === 0) return `Nothing due this week, ${things(overdue)} overdue.`;
  return `${things(soon)} this week, ${overdue} overdue.`;
}
