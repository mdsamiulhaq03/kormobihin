"use client";

import { useState } from "react";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Stage } from "@/generated/prisma/enums";
import { useApiAction } from "@/hooks/use-api-action";
import { apiRequest } from "@/lib/client/api-client";
import { STAGE_LABELS } from "@/lib/domain/labels";

const NEGATIVE: Stage[] = ["REJECTED", "DECLINED"];

const HELP: Partial<Record<Stage, string>> = {
  APPLIED: "Today becomes the applied date, and KormoBihin starts watching for a reply.",
  SHORTLISTED: "The company replied and shortlisted you.",
  INTERVIEW: "You've been invited to interview. Add the interview rounds below.",
  OFFER: "You received an offer.",
  ACCEPTED: "You accepted the offer. This is a final stage.",
  REJECTED: "The company turned the application down. This is a final stage.",
  DECLINED: "You turned the offer down. This is a final stage.",
};

/** Buttons for the allowed next stages (from the same rules the API enforces). */
export function StageActions({
  applicationId,
  nextStages,
}: {
  applicationId: string;
  nextStages: readonly Stage[];
}) {
  const { run, pending } = useApiAction();
  const [target, setTarget] = useState<Stage | null>(null);
  const [note, setNote] = useState("");

  if (nextStages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">This application is closed. No further moves.</p>
    );
  }

  async function confirm() {
    if (!target) return;
    const result = await run(
      () =>
        apiRequest(`/api/applications/${applicationId}/stage`, {
          method: "POST",
          body: { stage: target, note },
        }),
      { successMessage: `Moved to ${STAGE_LABELS[target]}` },
    );
    if (result) {
      setTarget(null);
      setNote("");
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {nextStages.map((stage) => (
          <Button
            key={stage}
            variant={NEGATIVE.includes(stage) ? "outline" : "default"}
            className={
              NEGATIVE.includes(stage) ? "text-destructive hover:text-destructive" : undefined
            }
            onClick={() => setTarget(stage)}
          >
            {NEGATIVE.includes(stage) ? null : <ArrowRightIcon aria-hidden />}
            {stage === "REJECTED" ? "Mark as rejected" : `Move to ${STAGE_LABELS[stage]}`}
          </Button>
        ))}
      </div>

      <Dialog open={target !== null} onOpenChange={(open) => !open && !pending && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to {target ? STAGE_LABELS[target] : ""}?</DialogTitle>
            <DialogDescription>{target ? HELP[target] : null}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="stage-note">Note (optional)</Label>
            <Textarea
              id="stage-note"
              value={note}
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. HR called, written test on Sunday"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={confirm}
              disabled={pending}
              variant={target && NEGATIVE.includes(target) ? "destructive" : "default"}
            >
              {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
