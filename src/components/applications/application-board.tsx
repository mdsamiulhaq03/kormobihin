import Link from "next/link";
import { FlagList, MatchBadge, STAGE_DOT, StageBadge } from "@/components/applications/badges";
import { StageMoveMenu } from "@/components/applications/stage-move-menu";
import type { Stage } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/client/format";
import type { ApplicationListItem } from "@/lib/client/types";
import { STAGE_LABELS } from "@/lib/domain/labels";
import { ACTIVE_STAGES } from "@/lib/domain/stages";
import { cn } from "@/lib/utils";

// The two exits share one column so the whole pipeline fits on screen.
const COLUMNS: { key: string; label: string; stages: Stage[]; dot: string }[] = [
  { key: "wishlist", label: STAGE_LABELS.WISHLIST, stages: ["WISHLIST"], dot: STAGE_DOT.WISHLIST },
  { key: "applied", label: STAGE_LABELS.APPLIED, stages: ["APPLIED"], dot: STAGE_DOT.APPLIED },
  {
    key: "shortlisted",
    label: STAGE_LABELS.SHORTLISTED,
    stages: ["SHORTLISTED"],
    dot: STAGE_DOT.SHORTLISTED,
  },
  {
    key: "interview",
    label: STAGE_LABELS.INTERVIEW,
    stages: ["INTERVIEW"],
    dot: STAGE_DOT.INTERVIEW,
  },
  { key: "offer", label: STAGE_LABELS.OFFER, stages: ["OFFER"], dot: STAGE_DOT.OFFER },
  { key: "accepted", label: STAGE_LABELS.ACCEPTED, stages: ["ACCEPTED"], dot: STAGE_DOT.ACCEPTED },
  { key: "closed", label: "Closed", stages: ["REJECTED", "DECLINED"], dot: STAGE_DOT.DECLINED },
];

function BoardCard({ app, activeCount }: { app: ApplicationListItem; activeCount: number }) {
  const closed = app.stage === "REJECTED" || app.stage === "DECLINED";
  return (
    <article className="grid gap-2 rounded-xl border-2 border-ink bg-card p-3 shadow-pop-press">
      <Link href={`/applications/${app.id}`} className="min-w-0 hover:text-primary">
        <p className="line-clamp-2 font-heading leading-snug font-bold">{app.company}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{app.title}</p>
      </Link>
      {closed ? <StageBadge stage={app.stage} className="w-fit" /> : null}
      <FlagList flags={app.flags} />
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {app.appliedAt
            ? `Applied ${formatDate(app.appliedAt)}`
            : `Added ${formatDate(app.createdAt)}`}
        </span>
        <div className="flex items-center gap-1.5">
          {app.matchScore != null ? (
            <MatchBadge score={app.matchScore} label={app.matchLabel} />
          ) : null}
          <StageMoveMenu
            applicationId={app.id}
            company={app.company}
            nextStages={app.nextStages}
            activeCount={activeCount}
          />
        </div>
      </div>
    </article>
  );
}

/**
 * Kanban view. It stays on the page grid and scrolls sideways (snapping to columns)
 * when the pipeline is wider than the screen. Columns are open dotted lanes, not
 * cards, so the application cards are the only boxes. Empty columns shrink.
 */
export function ApplicationBoard({
  applications,
  hideClosed = false,
}: {
  applications: ApplicationListItem[];
  /** "Hide closed" is on: the Closed column would always be empty, so drop it. */
  hideClosed?: boolean;
}) {
  const activeCount = applications.filter((app) => ACTIVE_STAGES.includes(app.stage)).length;
  const columns = hideClosed ? COLUMNS.filter((column) => column.key !== "closed") : COLUMNS;

  return (
    // One dotted surface for the whole board; lanes are separated by dashed rules, so the
    // application cards are the only boxes. The right edge fades to hint that it scrolls.
    <div className="-mx-1 snap-x snap-mandatory scroll-px-1 overflow-x-auto bg-dots px-1 pb-3 [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)]">
      <div className="flex w-max min-w-full pr-10 lg:w-full">
        {columns.map((column) => {
          const cards = applications.filter((app) => column.stages.includes(app.stage));
          const empty = cards.length === 0;
          return (
            <section
              key={column.key}
              aria-label={`${column.label} (${cards.length})`}
              className={cn(
                "flex snap-start flex-col gap-2.5 border-l-2 border-dashed border-ink/15 px-2 py-1 first:border-l-0",
                empty ? "w-28 shrink-0" : "w-64 shrink-0 lg:w-auto lg:min-w-44 lg:flex-1",
              )}
            >
              {empty ? (
                <h2 className="grid gap-0.5 px-1.5 pt-1 text-sm font-bold text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-full", column.dot)} aria-hidden />
                    {column.label}
                  </span>
                  <span className="text-xs font-normal">None yet</span>
                </h2>
              ) : (
                <>
                  <h2 className="flex items-center justify-between px-1.5 pt-1 font-heading text-sm font-bold">
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", column.dot)} aria-hidden />
                      {column.label}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {cards.length}
                    </span>
                  </h2>
                  {cards.map((app) => (
                    <BoardCard key={app.id} app={app} activeCount={activeCount} />
                  ))}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
