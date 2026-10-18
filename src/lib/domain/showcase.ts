import type { Stage } from "@/generated/prisma/enums";
import { SOURCE_LABELS } from "@/lib/domain/labels";
import { STAGES } from "@/lib/domain/stages";
import { bestSource, type SourceStats } from "@/lib/domain/stats";
import { labelForScore } from "@/lib/ai/schema";

// The landing page's preview is built from the live demo account, so the numbers a
// visitor sees before logging in are the numbers they find after logging in.

export type ShowcaseMatch = { company: string; score: number; label: string; missing: string[] };

export type Showcase = {
  total: number;
  pipeline: { stage: Stage; count: number }[];
  bestSource: { label: string; responded: number; applied: number; rate: number } | null;
  /** The strongest match that still names a gap, so the preview shows what the AI finds. */
  topMatch: ShowcaseMatch | null;
  /** The weakest match, to show the AI is honest about poor fits. */
  lowMatch: ShowcaseMatch | null;
  followUpCompany: string | null;
};

type MatchRow = { company: string; matchScore: number | null; missingSkills: string[] };

const toMatch = (row: MatchRow, maxMissing: number): ShowcaseMatch => ({
  company: row.company,
  score: row.matchScore ?? 0,
  label: labelForScore(row.matchScore ?? 0),
  missing: row.missingSkills.slice(0, maxMissing),
});

export function buildShowcase(input: {
  byStage: Record<Stage, number>;
  bySource: SourceStats[];
  matches: MatchRow[];
  followUpCompany: string | null;
}): Showcase {
  const pipeline = STAGES.map((stage) => ({ stage, count: input.byStage[stage] })).filter(
    ({ count }) => count > 0,
  );
  const best = bestSource(input.bySource);
  const scored = input.matches
    .filter((row) => row.matchScore !== null)
    .toSorted((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  const top = scored.find((row) => row.missingSkills.length > 0) ?? scored[0];
  const low = scored.at(-1);

  return {
    total: pipeline.reduce((sum, { count }) => sum + count, 0),
    pipeline,
    bestSource: best
      ? {
          label: SOURCE_LABELS[best.source],
          responded: best.responded,
          applied: best.applied,
          rate: best.responseRate,
        }
      : null,
    topMatch: top ? toMatch(top, 1) : null,
    lowMatch: low && low !== top ? toMatch(low, 2) : null,
    followUpCompany: input.followUpCompany,
  };
}
