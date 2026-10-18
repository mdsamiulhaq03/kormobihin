import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, PlusIcon } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { OfferBanner } from "@/components/applications/offer-banner";
import { PipelineCard } from "@/components/dashboard/pipeline-card";
import { SourceChart } from "@/components/dashboard/source-chart";
import { UpNextCard } from "@/components/dashboard/up-next-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth/session";
import { SOURCE_LABELS } from "@/lib/domain/labels";
import { offerMoment } from "@/lib/domain/offers";
import { MIN_APPLIED_FOR_BEST, bestSource } from "@/lib/domain/stats";
import { buildUpNext, upNextSummary } from "@/lib/domain/up-next";
import { listApplications } from "@/lib/services/applications";
import { getDashboardStats } from "@/lib/services/stats";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requirePageUser();
  const firstName = user.name.split(" ")[0];
  const now = new Date();
  const [stats, applications] = await Promise.all([
    getDashboardStats(user.id, now),
    listApplications(user.id, { sort: "newest" }, now),
  ]);

  const addButton = (
    <Button asChild>
      <Link href="/applications/new">
        <PlusIcon aria-hidden /> Add application
      </Link>
    </Button>
  );

  if (stats.total === 0) {
    return (
      <>
        <PageHeader title={`Welcome, ${firstName}`} />
        <EmptyState
          icon={<BriefcaseIcon className="size-5" aria-hidden />}
          title="KormoBihin means “jobless”. Let’s fix that."
          description="Add the first job you applied to, or one you want to apply to, and we’ll keep track of it from here."
          action={addButton}
        />
      </>
    );
  }

  const upNext = buildUpNext(applications, stats.upcomingInterviews, now);
  const best = bestSource(stats.bySource);
  const offer = offerMoment(applications);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={upNextSummary(upNext)}
        actions={addButton}
      />

      {offer ? <OfferBanner {...offer} /> : null}

      {/* Where everything stands (left) next to what to do about it (right). */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <PipelineCard byStage={stats.byStage} total={stats.total} />
        {/* On phones the to-do list comes first; side by side from lg up. */}
        <div className="-order-1 lg:order-none">
          <UpNextCard items={upNext} now={now} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl font-extrabold">Where replies come from</h2>
          </CardTitle>
          <CardDescription>
            {stats.bySource.length === 0
              ? "Mark an application as Applied to see which job sites reply."
              : best
                ? `${SOURCE_LABELS[best.source]} replies most often: ${best.responded} of ${best.applied} (${best.responseRate}%). A site needs at least ${MIN_APPLIED_FOR_BEST} applications to count.`
                : "No replies yet. Keep applying."}
          </CardDescription>
        </CardHeader>
        {stats.bySource.length > 0 ? (
          <CardContent>
            <SourceChart data={stats.bySource} best={best?.source ?? null} />
          </CardContent>
        ) : null}
      </Card>
    </>
  );
}
