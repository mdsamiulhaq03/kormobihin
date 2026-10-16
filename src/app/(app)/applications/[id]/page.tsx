import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, ExternalLinkIcon, PencilIcon } from "lucide-react";
import { FlagList, StageBadge } from "@/components/applications/badges";
import { DeleteApplicationButton } from "@/components/applications/delete-application-button";
import { InterviewSection } from "@/components/applications/interview-section";
import { MatchPanel } from "@/components/applications/match-panel";
import { StageActions } from "@/components/applications/stage-actions";
import { StageTimeline } from "@/components/applications/stage-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth/session";
import { formatDate, formatRelativeDays, formatSalary } from "@/lib/client/format";
import { SOURCE_LABELS } from "@/lib/domain/labels";
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

export default async function ApplicationPage({ params }: PageProps<"/applications/[id]">) {
  const user = await requirePageUser();
  const { id } = await params;
  const app = await loadApplicationOr404(user.id, id);
  const now = new Date();
  const salary = formatSalary(app.salaryMin, app.salaryMax);

  return (
    <>
      <Link
        href="/applications"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden /> All applications
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{app.company}</h1>
            <StageBadge stage={app.stage} />
          </div>
          <p className="text-muted-foreground">{app.title}</p>
          <FlagList flags={app.flags} />
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/applications/${app.id}/edit`}>
              <PencilIcon aria-hidden /> Edit
            </Link>
          </Button>
          <DeleteApplicationButton applicationId={app.id} company={app.company} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Next step</CardTitle>
            </CardHeader>
            <CardContent>
              <StageActions applicationId={app.id} nextStages={app.nextStages} />
            </CardContent>
          </Card>

          <MatchPanel application={app} />

          <InterviewSection applicationId={app.id} stage={app.stage} interviews={app.interviews} />

          <Card>
            <CardHeader>
              <CardTitle>Job description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {app.jobDescription}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
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
                    <span className="whitespace-pre-line">{app.notes}</span>
                  </Detail>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StageTimeline history={app.history} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
