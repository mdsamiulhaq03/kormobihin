"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { cn } from "@/lib/utils";

const LABEL_COLOR: Record<string, string> = {
  Strong: "text-emerald-700",
  Moderate: "text-amber-700",
  Weak: "text-rose-700",
};

const BAR_COLOR: Record<string, string> = {
  Strong: "[&_[data-slot=progress-indicator]]:bg-emerald-600",
  Moderate: "[&_[data-slot=progress-indicator]]:bg-amber-500",
  Weak: "[&_[data-slot=progress-indicator]]:bg-rose-500",
};

function SkillChips({ skills, kind }: { skills: string[]; kind: "matched" | "missing" }) {
  if (skills.length === 0) {
    return <p className="text-sm text-muted-foreground">None</p>;
  }
  const Icon = kind === "matched" ? CheckIcon : XIcon;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <li
          key={skill}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            kind === "matched"
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-rose-50 text-rose-800 ring-rose-200",
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

  const hasResult = application.matchScore != null;
  const hasResume = Boolean(application.resume);

  async function check() {
    setChecking(true);
    setError(null);
    try {
      await apiRequest(`/api/applications/${application.id}/match`, { method: "POST" });
      toast.success("Match updated.");
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
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" aria-hidden />
          CV match
        </CardTitle>
        <CardDescription>
          {hasResume
            ? `AI compares "${application.resume!.label}" with this job description.`
            : "Choose which CV you sent to check how well it matches."}
        </CardDescription>
        {hasResume ? (
          <CardAction>
            <Button
              size="sm"
              variant={hasResult ? "outline" : "default"}
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
        {!hasResume ? (
          <Button asChild variant="outline" className="w-fit">
            <Link href={`/applications/${application.id}/edit`}>Choose a CV</Link>
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
            className="flex flex-col gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
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
            <div className="grid gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {application.matchScore}
                  <span className="text-base font-normal text-muted-foreground">/100</span>
                </p>
                <p className={cn("text-sm font-medium", LABEL_COLOR[application.matchLabel ?? ""])}>
                  {application.matchLabel} match
                </p>
              </div>
              <Progress
                value={application.matchScore}
                aria-label={`Match score ${application.matchScore} out of 100`}
                className={cn("h-2", BAR_COLOR[application.matchLabel ?? ""])}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid content-start gap-2">
                <h3 className="text-sm font-medium">Skills you have</h3>
                <SkillChips skills={application.matchedSkills} kind="matched" />
              </div>
              <div className="grid content-start gap-2">
                <h3 className="text-sm font-medium">Missing from your CV</h3>
                <SkillChips skills={application.missingSkills} kind="missing" />
              </div>
            </div>

            <div className="grid gap-2">
              <h3 className="text-sm font-medium">How to improve</h3>
              <ul className="grid gap-2">
                {application.matchTips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm">
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
        ) : hasResume && !checking && !error ? (
          <p className="text-sm text-muted-foreground">
            Not checked yet. Click <strong className="font-medium">Check match</strong> to see your
            score, matched and missing skills, and tips.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
