"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, Loader2Icon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import {
  CLOSING_STAGES,
  StageChangeDialog,
  stageActionLabel,
} from "@/components/applications/stage-change-dialog";
import { Button } from "@/components/ui/button";
import type { Stage } from "@/generated/prisma/enums";
import { useApiAction } from "@/hooks/use-api-action";
import { apiRequest } from "@/lib/client/api-client";
import { plural } from "@/lib/client/format";
import { STAGE_LABELS } from "@/lib/domain/labels";
import { CLOSED_STAGES } from "@/lib/domain/stages";

/** Buttons for the allowed next stages (from the same rules the API enforces). */
const CLOSED_TEXT: Partial<Record<Stage, string>> = {
  ACCEPTED: "You accepted this offer, so there are no more steps here.",
  REJECTED: "This one didn’t work out. Its history stays in the timeline.",
  DECLINED: "You turned this offer down. Its history stays in the timeline.",
};

/** Undo for a rejection or declined offer (e.g. a mis-tap). Low risk, so no dialog. */
function ReopenButton({ applicationId }: { applicationId: string }) {
  const { run, pending } = useApiAction();
  async function reopen() {
    const result = await run(() =>
      apiRequest<{ stage: Stage }>(`/api/applications/${applicationId}/reopen`, { method: "POST" }),
    );
    if (result) toast.success(`Reopened. Back to ${STAGE_LABELS[result.stage]}.`);
  }
  return (
    <Button variant="ghost" onClick={reopen} disabled={pending}>
      {pending ? (
        <Loader2Icon className="animate-spin" aria-hidden />
      ) : (
        <RotateCcwIcon aria-hidden />
      )}
      Reopen
    </Button>
  );
}

/**
 * A closed application ends calmly and points to what is still open, never to more work
 * here. The count is the same one "Hide closed" lists, so the numbers always agree.
 */
function ClosedNote({
  applicationId,
  stage,
  openCount,
}: {
  applicationId: string;
  stage: Stage;
  openCount: number;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm">{CLOSED_TEXT[stage] ?? "This application is closed."}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" className="w-fit">
          {openCount > 0 ? (
            <Link href="/applications?closed=hide">
              See your {plural(openCount, "open application")}
            </Link>
          ) : (
            <Link href="/applications/new">
              <PlusIcon aria-hidden /> Add an application
            </Link>
          )}
        </Button>
        {CLOSED_STAGES.includes(stage) ? <ReopenButton applicationId={applicationId} /> : null}
      </div>
    </div>
  );
}

export function StageActions({
  applicationId,
  company,
  stage,
  openCount,
  nextStages,
  activeCount,
}: {
  applicationId: string;
  company: string;
  stage: Stage;
  /** Applications not rejected or declined: what "Hide closed" lists. */
  openCount: number;
  nextStages: readonly Stage[];
  activeCount: number;
}) {
  const [target, setTarget] = useState<Stage | null>(null);

  if (nextStages.length === 0) {
    return <ClosedNote applicationId={applicationId} stage={stage} openCount={openCount} />;
  }

  const forward = nextStages.filter((stage) => !CLOSING_STAGES.includes(stage));
  const closing = nextStages.filter((stage) => CLOSING_STAGES.includes(stage));

  return (
    <>
      {/* Moving forward is the main action; closing moves sit apart and quieter, so a
          mis-tap on "Mark as rejected" is unlikely. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {forward.map((stage) => (
          <Button key={stage} onClick={() => setTarget(stage)}>
            <ArrowRightIcon aria-hidden />
            {stageActionLabel(stage)}
          </Button>
        ))}
        {closing.length > 0 ? (
          <div className="flex flex-wrap gap-1 sm:ml-auto">
            {closing.map((stage) => (
              <Button
                key={stage}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setTarget(stage)}
              >
                {stageActionLabel(stage)}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      <StageChangeDialog
        applicationId={applicationId}
        company={company}
        target={target}
        activeCount={activeCount}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
