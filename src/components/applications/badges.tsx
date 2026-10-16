import { AlarmClockIcon, CalendarXIcon, MailQuestionIcon } from "lucide-react";
import type { Stage } from "@/generated/prisma/enums";
import { FLAG_LABELS, type Flag } from "@/lib/domain/flags";
import { STAGE_LABELS } from "@/lib/domain/labels";
import { cn } from "@/lib/utils";

export const STAGE_STYLES: Record<Stage, string> = {
  WISHLIST: "bg-slate-100 text-slate-700 ring-slate-200",
  APPLIED: "bg-sky-50 text-sky-700 ring-sky-200",
  SHORTLISTED: "bg-violet-50 text-violet-700 ring-violet-200",
  INTERVIEW: "bg-amber-50 text-amber-800 ring-amber-200",
  OFFER: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ACCEPTED: "bg-emerald-600 text-white ring-emerald-600",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
  DECLINED: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export const STAGE_DOT: Record<Stage, string> = {
  WISHLIST: "bg-slate-400",
  APPLIED: "bg-sky-500",
  SHORTLISTED: "bg-violet-500",
  INTERVIEW: "bg-amber-500",
  OFFER: "bg-emerald-500",
  ACCEPTED: "bg-emerald-700",
  REJECTED: "bg-rose-500",
  DECLINED: "bg-zinc-400",
};

const pill =
  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset";

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  return <span className={cn(pill, STAGE_STYLES[stage], className)}>{STAGE_LABELS[stage]}</span>;
}

const FLAG_STYLES: Record<Flag, { className: string; icon: typeof AlarmClockIcon }> = {
  NO_RESPONSE: {
    className: "bg-orange-50 text-orange-800 ring-orange-200",
    icon: MailQuestionIcon,
  },
  DEADLINE_SOON: { className: "bg-red-50 text-red-700 ring-red-200", icon: AlarmClockIcon },
  DEADLINE_PASSED: { className: "bg-zinc-100 text-zinc-600 ring-zinc-200", icon: CalendarXIcon },
};

export function FlagBadge({ flag }: { flag: Flag }) {
  const { className, icon: Icon } = FLAG_STYLES[flag];
  return (
    <span className={cn(pill, className)}>
      <Icon className="size-3" aria-hidden />
      {FLAG_LABELS[flag]}
    </span>
  );
}

export function FlagList({ flags }: { flags: Flag[] }) {
  if (flags.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <FlagBadge key={flag} flag={flag} />
      ))}
    </span>
  );
}

const MATCH_STYLES = {
  Strong: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Moderate: "bg-amber-50 text-amber-800 ring-amber-200",
  Weak: "bg-rose-50 text-rose-700 ring-rose-200",
} as const;

export function MatchBadge({ score, label }: { score: number | null; label: string | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">Not checked</span>;
  const style = MATCH_STYLES[label as keyof typeof MATCH_STYLES] ?? MATCH_STYLES.Moderate;
  return (
    <span className={cn(pill, "tabular-nums", style)} title={`${label} match`}>
      {score}%
    </span>
  );
}
