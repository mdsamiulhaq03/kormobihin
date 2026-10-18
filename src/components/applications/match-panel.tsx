"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import {
  CheckIcon,
  LightbulbIcon,
  Loader2Icon,
  RotateCcwIcon,
  SparklesIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import { formatDateTime } from "@/lib/client/format";
import type { ApplicationDetail } from "@/lib/client/types";
import { CLOSED_STAGES } from "@/lib/domain/stages";
import { MATCH_MIN_JD_CHARS } from "@/lib/validators/application";
import { cn } from "@/lib/utils";

const LABEL_COLOR: Record<string, string> = {
  Strong: "text-primary",
  Moderate: "text-amber-700",
  Weak: "text-rose-700",
};

const BAR_COLOR: Record<string, string> = {
  Strong: "[&_[data-slot=progress-indicator]]:bg-primary",
  Moderate: "[&_[data-slot=progress-indicator]]:bg-sun",
  Weak: "[&_[data-slot=progress-indicator]]:bg-pink",
};

/** Server props may carry a Date, API responses an ISO string; compare them as ISO. */
const isoOf = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : null;

/** Stagger for chips arriving as a list; capped so long lists don't keep the user waiting. */
const chipDelay = (index: number, offset: number) =>
  ({ "--kb-delay": `${offset + Math.min(index, 8) * 40}ms` }) as CSSProperties;

function SkillChips({
  skills,
  kind,
  animate = false,
}: {
  skills: string[];
  kind: "matched" | "missing";
  animate?: boolean;
}) {
  if (skills.length === 0) {
    return <p className="text-sm text-muted-foreground">None</p>;
  }
  const Icon = kind === "matched" ? CheckIcon : XIcon;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((skill, index) => (
        <li
          key={skill}
          style={animate ? chipDelay(index, kind === "matched" ? 250 : 450) : undefined}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold text-ink",
            animate && "kb-pop",
            kind === "matched"
              ? "border-primary/60 bg-primary/10 [&_svg]:text-primary"
              : "border-pink bg-pink/15 [&_svg]:text-pink-700",
          )}
        >
          <Icon className="size-3" aria-hidden />
          {skill}
        </li>
      ))}
    </ul>
  );
}

/**
 * The AI feature in the UI. Shows the last saved result; "Check match" calls the API.
 * On failure the error appears with a Retry button and the previous result stays visible.
 */
export function MatchPanel({ application }: { application: ApplicationDetail }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Animate the result only when it just arrived, not on every page load.
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const resultKey = isoOf(application.matchedAt);
  const justChecked = checkedAt != null && resultKey === checkedAt;

  const hasResult = application.matchScore != null;
  // On a closed application a match is only for reference, so it never takes the lead.
  const closed = CLOSED_STAGES.includes(application.stage) || application.stage === "ACCEPTED";
  const hasResume = Boolean(application.resume);
  const hasJobDescription = application.jobDescription.trim().length >= MATCH_MIN_JD_CHARS;
  const canCheck = hasResume && hasJobDescription;

  async function check() {
    setChecking(true);
    setError(null);
    try {
      const updated = await apiRequest<ApplicationDetail>(
        `/api/applications/${application.id}/match`,
        { method: "POST" },
      );
      setCheckedAt(isoOf(updated.matchedAt));
      toast.success(`${updated.matchLabel} match: ${updated.matchScore}/100.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please retry.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" aria-hidden />
            CV match
          </h2>
        </CardTitle>
        <CardDescription>
          {!hasResume
            ? "Choose which CV you sent to see how well it matches this job."
            : !hasJobDescription
              ? "Paste the job description to compare it with your CV."
              : `AI compares "${application.resume!.label}" with this job description.`}
        </CardDescription>
        {canCheck ? (
          <CardAction>
            <Button
              size="sm"
              variant={hasResult || closed ? "outline" : "default"}
              onClick={check}
              disabled={checking}
            >
              {checking ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <SparklesIcon aria-hidden />
              )}
              {checking ? "Checking…" : hasResult ? "Re-check" : "Check match"}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="grid gap-5">
        {!canCheck ? (
          <Button asChild variant="outline" className="w-fit">
            <Link href={`/applications/${application.id}/edit`}>
              {!hasResume ? "Choose a CV" : "Add the job description"}
            </Link>
          </Button>
        ) : null}

        {checking ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            Reading the CV and job description. This usually takes 2–5 seconds.
          </p>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border-2 border-destructive bg-destructive/5 font-medium p-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-start gap-2">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
              {hasResult ? " Showing your last result below." : ""}
            </span>
            <Button size="sm" variant="outline" onClick={check} disabled={checking}>
              <RotateCcwIcon aria-hidden /> Retry
            </Button>
          </div>
        ) : null}

        {hasResult ? (
          <>
            <div className="grid gap-3" key={resultKey ?? "none"}>
              <div className="flex items-end gap-4">
                <p
                  className={cn(
                    justChecked && "kb-rise",
                    "font-heading text-7xl leading-[0.85] font-extrabold tracking-tight tabular-nums",
                    LABEL_COLOR[application.matchLabel ?? ""],
                  )}
                >
                  {application.matchScore}
                </p>
                <div className="grid gap-0.5 pb-0.5">
                  <p className="font-heading text-xl font-bold tracking-tight">
                    {application.matchLabel} match
                  </p>
                  <p className="text-sm text-muted-foreground">out of 100</p>
                </div>
              </div>
              <Progress
                value={application.matchScore}
                aria-label={`Match score ${application.matchScore} out of 100`}
                className={cn(
                  "h-2.5",
                  justChecked && "kb-wipe-x",
                  BAR_COLOR[application.matchLabel ?? ""],
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid content-start gap-2">
                <h3 className="text-base font-bold">Skills you have</h3>
                <SkillChips
                  skills={application.matchedSkills}
                  kind="matched"
                  animate={justChecked}
                />
              </div>
              <div className="grid content-start gap-2">
                <h3 className="text-base font-bold">Missing from your CV</h3>
                <SkillChips
                  skills={application.missingSkills}
                  kind="missing"
                  animate={justChecked}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <h3 className="text-base font-bold">How to improve</h3>
              <ul className="grid gap-2">
                {application.matchTips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-base leading-relaxed">
                    <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              Checked {formatDateTime(application.matchedAt)}. AI suggestions can be wrong; use them
              as guidance, not a verdict.
            </p>
          </>
        ) : canCheck && !checking && !error ? (
          <p className="text-sm text-muted-foreground">
            Not checked yet. Click <strong className="font-bold">Check match</strong> to see your
            score, matched and missing skills, and tips.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
