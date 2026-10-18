import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, CalendarClockIcon, ExternalLinkIcon, PencilIcon } from "lucide-react";
import { FlagList, StageBadge } from "@/components/applications/badges";
import { DeleteApplicationButton } from "@/components/applications/delete-application-button";
import { InterviewSection } from "@/components/applications/interview-section";
import { MatchPanel } from "@/components/applications/match-panel";
import { StageActions } from "@/components/applications/stage-actions";
import { StageTimeline } from "@/components/applications/stage-timeline";
import { OfferBanner } from "@/components/applications/offer-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatRelativeDays, formatSalary } from "@/lib/client/format";
import { INTERVIEW_TYPE_LABELS, SOURCE_LABELS } from "@/lib/domain/labels";
import { countActiveApplications, countOpenApplications } from "@/lib/services/applications";
import { loadApplicationOr404 } from "@/lib/services/page-data";

export const metadata: Metadata = { title: "Application" };

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <CardTitle>
      <h2>{children}</h2>
    </CardTitle>
  );
}

export default async function ApplicationPage({ params }: PageProps<"/applications/[id]">) {
  const user = await requirePageUser();
  const { id } = await params;
  const [app, activeCount, openCount] = await Promise.all([
    loadApplicationOr404(user.id, id),
    countActiveApplications(user.id),
    countOpenApplications(user.id),
  ]);
  const now = new Date();
  const salary = formatSalary(app.salaryMin, app.salaryMax);
  const nextInterview = app.interviews
    .filter((i) => i.outcome === "PENDING" && i.scheduledAt.getTime() >= now.getTime())
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];

  return (
    <>
      <Link
        href="/applications"
        className="flex min-h-10 w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden /> All applications
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-[-0.025em]">{app.company}</h1>
            <StageBadge stage={app.stage} />
          </div>
          <p className="text-muted-foreground">{app.title}</p>
          <FlagList flags={app.flags} />
        </div>
        <Button asChild variant="outline" className="h-10 shrink-0 sm:h-8">
          <Link href={`/applications/${app.id}/edit`}>
            <PencilIcon aria-hidden /> Edit
          </Link>
        </Button>
      </div>

      {app.stage === "OFFER" || app.stage === "ACCEPTED" ? (
        <OfferBanner
          title={
            app.stage === "OFFER"
              ? `You have an offer from ${app.company}. Congratulations!`
              : `You accepted the offer from ${app.company}. Congratulations on the new job!`
          }
          body={
            app.stage === "OFFER"
              ? "Take your time. Compare the salary, the team and what you’ll learn before you decide."
              : "All that tracking paid off. Wishing you a great first day."
          }
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-6">
          <Card className="bg-[color-mix(in_oklch,var(--primary),white_92%)]">
            <CardHeader>
              <SectionTitle>Next step</SectionTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {nextInterview ? (
                <p className="flex items-start gap-2 text-sm">
                  <CalendarClockIcon
                    className="mt-0.5 size-4 shrink-0 text-amber-600"
                    aria-hidden
                  />
                  <span>
                    Prepare for round {nextInterview.round},{" "}
                    {INTERVIEW_TYPE_LABELS[nextInterview.type].toLowerCase()}, on{" "}
                    {formatDateTime(nextInterview.scheduledAt)} (
                    {formatRelativeDays(nextInterview.scheduledAt, now)}).
                  </span>
                </p>
              ) : null}
              <StageActions
                applicationId={app.id}
                company={app.company}
                stage={app.stage}
                openCount={openCount}
                nextStages={app.nextStages}
                activeCount={activeCount}
              />
            </CardContent>
          </Card>

          <MatchPanel application={app} />

          <InterviewSection applicationId={app.id} stage={app.stage} interviews={app.interviews} />

          <Card>
            <CardHeader>
              <SectionTitle>Job description</SectionTitle>
            </CardHeader>
            <CardContent>
              {app.jobDescription.trim() ? (
                <p
                  dir="auto"
                  className="max-w-[70ch] text-sm leading-relaxed whitespace-pre-line text-muted-foreground"
                >
                  {app.jobDescription}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No job description yet.{" "}
                  <Link
                    href={`/applications/${app.id}/edit`}
                    className="font-bold text-primary underline decoration-2 underline-offset-4 hover:decoration-sun"
                  >
                    Paste it in
                  </Link>{" "}
                  to unlock the CV match.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <SectionTitle>Details</SectionTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <Detail label="Found on">{SOURCE_LABELS[app.source]}</Detail>
                {app.location ? <Detail label="Location">{app.location}</Detail> : null}
                {salary ? <Detail label="Salary">{salary} / month</Detail> : null}
                {app.deadline ? (
                  <Detail label="Deadline">
                    {formatDate(app.deadline)}{" "}
                    <span className="text-muted-foreground">
                      ({formatRelativeDays(app.deadline, now)})
                    </span>
                  </Detail>
                ) : null}
                <Detail label="Applied">
                  {app.appliedAt ? formatDate(app.appliedAt) : "Not yet"}
                </Detail>
                <Detail label="CV used">
                  {app.resume ? (
                    <Link
                      href="/resumes"
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      {app.resume.label}
                    </Link>
                  ) : (
                    "None selected"
                  )}
                </Detail>
                {app.jobUrl ? (
                  <Detail label="Job post">
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 break-all underline underline-offset-4 hover:text-primary"
                    >
                      Open link <ExternalLinkIcon className="size-3" aria-hidden />
                    </a>
                  </Detail>
                ) : null}
                {app.notes ? (
                  <Detail label="Notes">
                    <span dir="auto" className="whitespace-pre-line">
                      {app.notes}
                    </span>
                  </Detail>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionTitle>Timeline</SectionTitle>
            </CardHeader>
            <CardContent>
              <StageTimeline history={app.history} />
            </CardContent>
          </Card>

          <DeleteApplicationButton applicationId={app.id} company={app.company} />
        </div>
      </div>
    </>
  );
}
