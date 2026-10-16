import { STAGE_DOT } from "@/components/applications/badges";
import { formatDateTime } from "@/lib/client/format";
import type { ApplicationDetail } from "@/lib/client/types";
import { STAGE_LABELS } from "@/lib/domain/labels";
import { cn } from "@/lib/utils";

/** Audit trail of every stage change, oldest first. */
export function StageTimeline({ history }: { history: ApplicationDetail["history"] }) {
  return (
    <ol className="relative grid gap-4 border-l pl-5">
      {history.map((entry, index) => (
        <li key={entry.id} className="relative">
          <span
            className={cn(
              "absolute top-1 -left-[25.5px] size-2.5 rounded-full ring-4 ring-background",
              STAGE_DOT[entry.toStage],
            )}
            aria-hidden
          />
          <p className="text-sm font-medium">
            {index === 0
              ? `Added as ${STAGE_LABELS[entry.toStage]}`
              : `Moved to ${STAGE_LABELS[entry.toStage]}`}
          </p>
          <p className="text-xs text-muted-foreground">{formatDateTime(entry.changedAt)}</p>
          {entry.note ? <p className="mt-1 text-sm text-muted-foreground">“{entry.note}”</p> : null}
        </li>
      ))}
    </ol>
  );
}
