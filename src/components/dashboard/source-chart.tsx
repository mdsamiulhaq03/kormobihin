"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { JobSource } from "@/generated/prisma/enums";
import { SOURCE_LABELS } from "@/lib/domain/labels";

type SourceRow = { source: JobSource; applied: number; responded: number; responseRate: number };

/** Applications sent vs. replies received, per job site. */
export function SourceChart({ data }: { data: SourceRow[] }) {
  const rows = data.map((row) => ({
    name: SOURCE_LABELS[row.source],
    Applied: row.applied,
    Replied: row.responded,
    rate: row.responseRate,
  }));

  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label="Bar chart of applications and replies per job source"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} interval={0} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
            formatter={(value, name) => [value, name]}
            labelFormatter={(label, payload) => {
              const rate = payload?.[0]?.payload?.rate;
              return rate === undefined ? label : `${label} · ${rate}% reply rate`;
            }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Applied" fill="oklch(0.8 0.05 163)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="Replied" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
