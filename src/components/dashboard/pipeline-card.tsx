import Link from "next/link";
import { STAGE_DOT } from "@/components/applications/badges";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stage } from "@/generated/prisma/enums";
import { plural } from "@/lib/client/format";
import { STAGE_LABELS } from "@/lib/domain/labels";
import { STAGES } from "@/lib/domain/stages";
import { cn } from "@/lib/utils";

/** Donut of where every application is, with a legend that links to each stage. */
export function PipelineCard({
  byStage,
  total,
}: {
  byStage: Record<Stage, number>;
  total: number;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <h2>Pipeline</h2>
        </CardTitle>
        <CardDescription>Where your {plural(total, "application")} are right now.</CardDescription>
      </CardHeader>
      {/* Centred in the card, which stretches to Up next's height on desktop. */}
      <CardContent className="grid flex-1 content-center gap-5">
        {/* Phones get a compact bar so "Up next" stays close; the donut needs the room. */}
        <div
          className="flex h-5 overflow-hidden rounded-full border-2 border-ink sm:hidden"
          aria-hidden
        >
          {STAGES.filter((stage) => byStage[stage] > 0).map((stage, index) => (
            <span
              key={stage}
              className={cn(STAGE_DOT[stage], index > 0 && "border-l-2 border-ink")}
              style={{ width: `${(byStage[stage] / Math.max(total, 1)) * 100}%` }}
            />
          ))}
        </div>
        <div className="hidden sm:block">
          <PipelineChart counts={STAGES.map((stage) => [stage, byStage[stage]])} total={total} />
        </div>
        <ul className="grid grid-cols-2 gap-x-3">
          {STAGES.map((stage) => (
            <li key={stage}>
              <Link
                href={`/applications?stage=${stage}`}
                className="flex min-h-10 items-center justify-between gap-2 rounded-full px-3 text-sm transition-colors hover:bg-sun/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full ring-2 ring-ink",
                      STAGE_DOT[stage],
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{STAGE_LABELS[stage]}</span>
                </span>
                <span className="font-heading font-bold tabular-nums">{byStage[stage]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
