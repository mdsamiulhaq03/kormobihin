import { STAGE_HEX } from "@/components/applications/badges";
import type { Stage } from "@/generated/prisma/enums";
import { donutPaths } from "@/lib/client/donut";

const BOX = { size: 200, outer: 96, inner: 56 };

/**
 * Donut of applications per stage, with the total in the middle. Plain SVG rendered on
 * the server (no chart library, no client JavaScript); it pops in with the shared
 * kb-pop animation, which is off for reduced motion. Decorative for screen readers:
 * the legend next to it carries the same numbers as links.
 */
export function PipelineChart({ counts, total }: { counts: [Stage, number][]; total: number }) {
  const slices = donutPaths(counts, BOX);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-56" aria-hidden>
      <svg viewBox={`0 0 ${BOX.size} ${BOX.size}`} className="kb-pop size-full">
        {slices.map(({ key, d }) => (
          <path
            key={key}
            d={d}
            fill={STAGE_HEX[key]}
            fillRule="evenodd"
            stroke="var(--ink)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
        <span className="font-heading text-4xl leading-none font-extrabold tabular-nums">
          {total}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          {total === 1 ? "application" : "applications"}
        </span>
      </div>
    </div>
  );
}
