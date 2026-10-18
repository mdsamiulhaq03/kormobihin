import { TrophyIcon } from "lucide-react";
import { IconBadge } from "@/components/decor/shapes";
import { SOURCE_LABELS } from "@/lib/domain/labels";
import type { JobSource } from "@/generated/prisma/enums";
import { MIN_APPLIED_FOR_BEST, type SourceStats } from "@/lib/domain/stats";
import { cn } from "@/lib/utils";

/**
 * Reply rate per job site, best first. Each row is a chunky meter: the green fill is the
 * share of applications that got a reply, and the text says the raw "3 of 4" so a 100%
 * from one application doesn't look better than it is.
 */
export function SourceChart({ data, best }: { data: SourceStats[]; best: JobSource | null }) {
  // Sources with enough applications rank first (same rule as bestSource), so a lucky
  // "1 of 1" never sits above the real winner.
  const enough = (applied: number) => (applied >= MIN_APPLIED_FOR_BEST ? 0 : 1);
  const rows = [...data].sort(
    (a, b) =>
      enough(a.applied) - enough(b.applied) ||
      b.responseRate - a.responseRate ||
      b.applied - a.applied,
  );

  return (
    <ul className="grid gap-x-10 gap-y-5 md:grid-cols-2">
      {rows.map(({ source, applied, responded, responseRate }) => {
        const isBest = source === best;
        // Too few applications to mean anything: keep the row, but quietly.
        const tooFew = applied < MIN_APPLIED_FOR_BEST;
        return (
          <li key={source} className="grid gap-2">
            <div className="flex items-end justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {isBest ? <IconBadge icon={TrophyIcon} tone="sun" size="sm" /> : null}
                <div className="min-w-0">
                  <p className="truncate font-heading font-bold">{SOURCE_LABELS[source]}</p>
                  <p className="text-xs text-muted-foreground">
                    {responded} of {applied} replied{tooFew ? " · too few to tell" : ""}
                  </p>
                </div>
              </div>
              <p
                className={cn(
                  "font-heading leading-none font-extrabold tabular-nums",
                  tooFew ? "text-lg" : "text-2xl",
                  responded === 0 || tooFew ? "text-muted-foreground" : "text-primary",
                )}
              >
                {responseRate}%
              </p>
            </div>
            <div
              role="meter"
              aria-label={`${SOURCE_LABELS[source]} reply rate`}
              aria-valuenow={responseRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${responded} of ${applied} replied (${responseRate}%)`}
              className="h-4 overflow-hidden rounded-full border-2 border-ink bg-muted"
            >
              <div
                className={cn(
                  "kb-grow-x h-full rounded-full",
                  isBest ? "bg-primary" : tooFew ? "bg-ink/20" : "bg-chart-2",
                )}
                style={{ width: `${responseRate}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
