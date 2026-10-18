import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, PlusIcon, SearchXIcon } from "lucide-react";
import { ApplicationBoard } from "@/components/applications/application-board";
import { ApplicationFilters } from "@/components/applications/application-filters";
import { ApplicationList } from "@/components/applications/application-list";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth/session";
import { listApplications } from "@/lib/services/applications";
import { applicationListQuerySchema } from "@/lib/validators/application";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage({ searchParams }: PageProps<"/applications">) {
  const user = await requirePageUser();
  const params = await searchParams;
  const view = params.view === "board" ? "board" : "list";

  // Invalid values in the URL fall back to "no filter" instead of erroring.
  const parsed = applicationListQuerySchema.safeParse({
    stage: typeof params.stage === "string" ? params.stage : undefined,
    source: typeof params.source === "string" ? params.source : undefined,
    q: typeof params.q === "string" && params.q ? params.q : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
    closed: typeof params.closed === "string" ? params.closed : undefined,
  });
  const query = parsed.success ? parsed.data : applicationListQuerySchema.parse({});
  const isFiltered = Boolean(query.q || query.stage || query.source || query.closed);

  const applications = await listApplications(user.id, query);

  return (
    <>
      <PageHeader
        title="Applications"
        description={`${applications.length} ${isFiltered ? "matching" : "tracked"} application${applications.length === 1 ? "" : "s"}`}
        actions={
          <Button asChild>
            <Link href="/applications/new">
              <PlusIcon aria-hidden /> Add application
            </Link>
          </Button>
        }
      />

      <ApplicationFilters view={view} />

      {applications.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={<SearchXIcon className="size-5" aria-hidden />}
            title="No applications match"
            description="Try a different search or clear the filters."
          />
        ) : (
          <EmptyState
            icon={<BriefcaseIcon className="size-5" aria-hidden />}
            title="KormoBihin means “jobless”. Let’s fix that."
            description="Save a job from Bdjobs, LinkedIn, a Facebook group or anywhere else, then follow it from applied to offer."
            action={
              <Button asChild>
                <Link href="/applications/new">
                  <PlusIcon aria-hidden /> Add application
                </Link>
              </Button>
            }
          />
        )
      ) : view === "board" ? (
        <ApplicationBoard applications={applications} hideClosed={query.closed === "hide"} />
      ) : (
        <ApplicationList applications={applications} />
      )}
    </>
  );
}
