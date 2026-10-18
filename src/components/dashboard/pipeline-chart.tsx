"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { STAGE_HEX } from "@/components/applications/badges";
import type { Stage } from "@/generated/prisma/enums";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Donut of applications per stage, with the total in the middle. Decorative for screen
 * readers: the legend list next to it carries the same numbers as links.
 */
export function PipelineChart({ counts, total }: { counts: [Stage, number][]; total: number }) {
  const reducedMotion = useReducedMotion();
  const data = counts.filter(([, count]) => count > 0).map(([stage, value]) => ({ stage, value }));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-56" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="stage"
            innerRadius="58%"
            outerRadius="96%"
            startAngle={90}
            endAngle={-270}
            stroke="var(--ink)"
            strokeWidth={2}
            isAnimationActive={!reducedMotion}
            animationDuration={700}
            animationEasing="ease-out"
          >
            {data.map(({ stage }) => (
              <Cell key={stage} fill={STAGE_HEX[stage]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
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
