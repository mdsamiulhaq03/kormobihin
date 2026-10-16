import type { Stage } from "@/generated/prisma/enums";
import { STAGE_LABELS } from "@/lib/domain/labels";
import { AppError } from "@/lib/errors";

// The hiring workflow as a state machine. This map is the single source of truth:
// the API uses it to reject invalid moves and the UI uses it to show only valid buttons.
//
//   WISHLIST → APPLIED → SHORTLISTED → INTERVIEW → OFFER → ACCEPTED
//                 ↓           ↓             ↓         ↓
//              REJECTED    REJECTED      REJECTED   DECLINED

export const STAGES: readonly Stage[] = [
  "WISHLIST",
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "DECLINED",
];

const TRANSITIONS: Readonly<Record<Stage, readonly Stage[]>> = {
  WISHLIST: ["APPLIED"],
  APPLIED: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["ACCEPTED", "DECLINED"],
  ACCEPTED: [],
  REJECTED: [],
  DECLINED: [],
};

/** Stages where the employer has replied in some way (used for response-rate stats). */
export const RESPONDED_STAGES: readonly Stage[] = [
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "DECLINED",
];

export function getNextStages(stage: Stage): readonly Stage[] {
  return TRANSITIONS[stage];
}

export function canTransition(from: Stage, to: Stage): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(stage: Stage): boolean {
  return TRANSITIONS[stage].length === 0;
}

export class InvalidStageTransitionError extends AppError {
  constructor(from: Stage, to: Stage) {
    const reason = isTerminal(from)
      ? `${STAGE_LABELS[from]} is a final stage.`
      : `Next allowed: ${getNextStages(from)
          .map((s) => STAGE_LABELS[s])
          .join(" or ")}.`;
    super(422, `Can't move from "${STAGE_LABELS[from]}" to "${STAGE_LABELS[to]}". ${reason}`);
    this.name = "InvalidStageTransitionError";
  }
}

type StageState = { stage: Stage; appliedAt: Date | null };

export type StageChangePlan = {
  fromStage: Stage;
  stage: Stage;
  appliedAt: Date | null;
};

/**
 * Validates a stage move and works out the resulting fields, without touching the
 * database. Moving to APPLIED records the apply date if it wasn't set.
 */
export function planStageChange(current: StageState, to: Stage, now: Date): StageChangePlan {
  if (!canTransition(current.stage, to)) {
    throw new InvalidStageTransitionError(current.stage, to);
  }
  const appliedAt = to === "APPLIED" && !current.appliedAt ? now : current.appliedAt;
  return { fromStage: current.stage, stage: to, appliedAt };
}
