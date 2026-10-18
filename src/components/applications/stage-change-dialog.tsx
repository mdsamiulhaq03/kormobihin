"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
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
import { plural } from "@/lib/client/format";
import { STAGE_LABELS } from "@/lib/domain/labels";
import { CLOSED_STAGES } from "@/lib/domain/stages";

const HELP: Partial<Record<Stage, string>> = {
  APPLIED: "Today becomes the applied date, and KormoBihin starts watching for a reply.",
  SHORTLISTED: "The company replied and shortlisted you.",
  INTERVIEW: "You've been invited to interview. Add each round so you don't miss it.",
  OFFER: "You received an offer. Take your time to decide.",
  ACCEPTED: "You accepted the offer. This closes the application.",
  REJECTED:
    "The company decided not to move forward. It happens to everyone. This closes the application and keeps its history. If it was a mistake, you can reopen it.",
  DECLINED:
    "You turned the offer down. This closes the application. You can reopen it if you change your mind.",
};

/** A note that fits the move, so the example never contradicts what just happened. */
const NOTE_PLACEHOLDER: Record<Stage, string> = {
  WISHLIST: "e.g. Saw it in a Facebook group",
  APPLIED: "e.g. Sent through Bdjobs with my Frontend CV",
  SHORTLISTED: "e.g. HR emailed, written test on Sunday",
  INTERVIEW: "e.g. Technical round with the team lead",
  OFFER: "e.g. ৳45,000 a month, reply by Thursday",
  ACCEPTED: "e.g. Joining on 1 November",
  REJECTED: "e.g. They chose someone with more experience",
  DECLINED: "e.g. Took another offer closer to home",
};

export const CLOSING_STAGES = CLOSED_STAGES;

export function stageActionLabel(stage: Stage): string {
  if (stage === "REJECTED") return "Mark as rejected";
  if (stage === "DECLINED") return "Decline offer";
  if (stage === "ACCEPTED") return "Accept offer";
  return `Move to ${STAGE_LABELS[stage]}`;
}

/** The dialog's question names the company first: "Mark Pathao as rejected?" */
function stageQuestion(stage: Stage, company: string): string {
  if (stage === "REJECTED") return `Mark ${company} as rejected?`;
  if (stage === "DECLINED") return `Decline the offer from ${company}?`;
  if (stage === "ACCEPTED") return `Accept the offer from ${company}?`;
  return `Move ${company} to ${STAGE_LABELS[stage]}?`;
}

/** Success message for a move. Good news is celebrated; bad news is met with support. */
function successMessage(stage: Stage, company: string, activeAfter: number): string {
  switch (stage) {
    case "OFFER":
      return `Offer from ${company}. Congratulations!`;
    case "ACCEPTED":
      return `Congratulations on the new job at ${company}!`;
    case "REJECTED":
      return activeAfter > 0
        ? `Marked as rejected. You still have ${plural(activeAfter, "application")} in play.`
        : "Marked as rejected. Every application sharpens the next one.";
    case "DECLINED":
      return "Offer declined.";
    default:
      return `Moved to ${STAGE_LABELS[stage]}.`;
  }
}

/**
 * Confirm a stage move with an optional note. Used by the detail page and the board,
 * so both follow the same rules and both record notes in the timeline.
 */
export function StageChangeDialog({
  applicationId,
  company,
  target,
  activeCount,
  onClose,
}: {
  applicationId: string;
  company: string;
  target: Stage | null;
  /** Applications currently in play (including this one), for the rejection message. */
  activeCount: number;
  onClose: () => void;
}) {
  const { run, pending } = useApiAction();
  const [note, setNote] = useState("");

  async function confirm() {
    if (!target) return;
    const result = await run(
      () =>
        apiRequest(`/api/applications/${applicationId}/stage`, {
          method: "POST",
          body: { stage: target, note },
        }),
      { successMessage: successMessage(target, company, Math.max(0, activeCount - 1)) },
    );
    if (result) {
      setNote("");
      onClose();
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{target ? stageQuestion(target, company) : ""}</DialogTitle>
          <DialogDescription>{target ? HELP[target] : null}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="stage-note">Note (optional)</Label>
          <Textarea
            id="stage-note"
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder={target ? NOTE_PLACEHOLDER[target] : undefined}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          {/* Closing moves confirm in neutral ink: green is kept for good news. */}
          <Button
            variant={target && CLOSING_STAGES.includes(target) ? "outline" : "default"}
            onClick={confirm}
            disabled={pending}
          >
            {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
            {target ? stageActionLabel(target) : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
