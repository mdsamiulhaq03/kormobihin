import Link from "next/link";
import { FlagList, MatchBadge, STAGE_DOT } from "@/components/applications/badges";
import { StageMoveMenu } from "@/components/applications/stage-move-menu";
import { formatDate } from "@/lib/client/format";
import type { ApplicationListItem } from "@/lib/client/types";
import { STAGE_LABELS } from "@/lib/domain/labels";
import { STAGES } from "@/lib/domain/stages";
import { cn } from "@/lib/utils";

/** Kanban view: one column per stage. Cards move with the "Move" menu (valid stages only). */
export function ApplicationBoard({ applications }: { applications: ApplicationListItem[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      <div className="flex min-w-max gap-3">
        {STAGES.map((stage) => {
          const column = applications.filter((app) => app.stage === stage);
          return (
            <section
              key={stage}
              aria-label={`${STAGE_LABELS[stage]} (${column.length})`}
              className="flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-muted/60 p-2"
            >
              <h2 className="flex items-center justify-between px-1.5 pt-1 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", STAGE_DOT[stage])} aria-hidden />
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{column.length}</span>
              </h2>

              {column.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Empty
                </p>
              ) : (
                column.map((app) => (
                  <article
                    key={app.id}
                    className="grid gap-2 rounded-lg border bg-background p-3 shadow-xs"
                  >
                    <Link href={`/applications/${app.id}`} className="min-w-0 hover:text-primary">
                      <p className="truncate text-sm font-medium">{app.company}</p>
                      <p className="truncate text-xs text-muted-foreground">{app.title}</p>
                    </Link>
                    <FlagList flags={app.flags} />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs whitespace-nowrap text-muted-foreground">
                        {app.appliedAt ? formatDate(app.appliedAt) : formatDate(app.createdAt)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {app.matchScore != null ? (
                          <MatchBadge score={app.matchScore} label={app.matchLabel} />
                        ) : null}
                        <StageMoveMenu applicationId={app.id} nextStages={app.nextStages} />
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
