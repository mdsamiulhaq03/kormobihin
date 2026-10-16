import type { Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseIcon,
  CalendarClockIcon,
  CalendarIcon,
  MessageSquareReplyIcon,
  PlusIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import { FlagList, STAGE_DOT, StageBadge } from "@/components/applications/badges";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { SourceChart } from "@/components/dashboard/source-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatRelativeDays } from "@/lib/client/format";
import { INTERVIEW_TYPE_LABELS, STAGE_LABELS } from "@/lib/domain/labels";
import { STAGES } from "@/lib/domain/stages";
import { listApplications } from "@/lib/services/applications";
import { getDashboardStats } from "@/lib/services/stats";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requirePageUser();
  const now = new Date();
  const [stats, applications] = await Promise.all([
    getDashboardStats(user.id, now),
    listApplications(user.id, { sort: "newest" }, now),
  ]);
  const needsAttention = applications.filter((app) => app.flags.length > 0);

  if (stats.total === 0) {
    return (
      <>
        <PageHeader title="Dashboard" description="Your job search at a glance." />
        <EmptyState
          icon={<BriefcaseIcon className="size-5" aria-hidden />}
          title="No applications yet"
          description="Add the first job you applied to (or want to apply to) and KormoBihin will track it from here."
          action={
            <Button asChild>
              <Link href="/applications/new">
                <PlusIcon aria-hidden /> Add application
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your job search at a glance."
        actions={
          <Button asChild>
            <Link href="/applications/new">
              <PlusIcon aria-hidden /> Add application
            </Link>
          </Button>
        }
      />

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Applications sent"
          value={stats.applied}
          hint={`${stats.byStage.WISHLIST} more on your wishlist`}
          icon={<BriefcaseIcon className="size-4" aria-hidden />}
        />
        <StatCard
          label="Response rate"
          value={`${stats.responseRate}%`}
          hint={`${stats.responded} of ${stats.applied} replied`}
          icon={<MessageSquareReplyIcon className="size-4" aria-hidden />}
        />
        <StatCard
          label="Interview rate"
          value={`${stats.interviewRate}%`}
          hint={
            stats.avgDaysToResponse == null
              ? "No replies yet"
              : `First reply after ${stats.avgDaysToResponse} days on average`
          }
          icon={<UsersIcon className="size-4" aria-hidden />}
        />
        <StatCard
          label="Offer rate"
          value={`${stats.offerRate}%`}
          hint={`${stats.byStage.OFFER + stats.byStage.ACCEPTED} offer(s) so far`}
          icon={<TrophyIcon className="size-4" aria-hidden />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
          <CardDescription>Where your {stats.total} applications are right now.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
            {STAGES.filter((stage) => stats.byStage[stage] > 0).map((stage) => (
              <div
                key={stage}
                className={cn("h-full", STAGE_DOT[stage])}
                style={{ width: `${(stats.byStage[stage] / stats.total) * 100}%` }}
              />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STAGES.map((stage) => (
              <li key={stage}>
                <Link
                  href={`/applications?stage=${stage}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", STAGE_DOT[stage])} aria-hidden />
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="font-medium tabular-nums">{stats.byStage[stage]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>Follow-ups and deadlines flagged automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            {needsAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing needs attention. Nice work.</p>
            ) : (
              <ul className="divide-y">
                {needsAttention.map((app) => (
                  <li key={app.id}>
                    <Link
                      href={`/applications/${app.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:text-primary"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{app.company}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {app.title}
                        </span>
                      </span>
                      <FlagList flags={app.flags} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next 7 days</CardTitle>
            <CardDescription>Upcoming interviews and application deadlines.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingInterviews.length === 0 && stats.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled this week.</p>
            ) : (
              <ul className="divide-y">
                {stats.upcomingInterviews.map((interview) => (
                  <li key={interview.interviewId}>
                    <Link
                      href={`/applications/${interview.applicationId}`}
                      className="flex items-center gap-3 py-2.5 hover:text-primary"
                    >
                      <CalendarClockIcon className="size-4 shrink-0 text-amber-600" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {interview.company} · Round {interview.round}{" "}
                          {INTERVIEW_TYPE_LABELS[interview.type]}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDateTime(interview.scheduledAt)} (
                          {formatRelativeDays(interview.scheduledAt, now)})
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                {stats.upcomingDeadlines.map((deadline) => (
                  <li key={deadline.applicationId}>
                    <Link
                      href={`/applications/${deadline.applicationId}`}
                      className="flex items-center gap-3 py-2.5 hover:text-primary"
                    >
                      <CalendarIcon className="size-4 shrink-0 text-red-600" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          Apply to {deadline.company}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Deadline {formatDate(deadline.deadline)} (
                          {formatRelativeDays(deadline.deadline, now)})
                        </span>
                      </span>
                      <StageBadge stage="WISHLIST" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Where replies come from</CardTitle>
          <CardDescription>Applications sent and replies received, by job site.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.bySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Mark an application as Applied to see this chart.
            </p>
          ) : (
            <SourceChart data={stats.bySource} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
