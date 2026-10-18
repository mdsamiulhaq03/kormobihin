"use client";

import { useState, type FormEvent } from "react";
import { CLOSED_STAGES } from "@/lib/domain/stages";
import { CalendarClockIcon, Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { FormField, fieldA11y } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InterviewOutcome, InterviewType, type Stage } from "@/generated/prisma/enums";
import { useApiAction } from "@/hooks/use-api-action";
import { apiRequest } from "@/lib/client/api-client";
import { formatDateTime, toDateTimeInputValue } from "@/lib/client/format";
import { zodFieldErrors, type FieldErrors } from "@/lib/client/form-errors";
import type { ApplicationDetail } from "@/lib/client/types";
import { INTERVIEW_OUTCOME_LABELS, INTERVIEW_TYPE_LABELS } from "@/lib/domain/labels";
import { interviewCreateSchema } from "@/lib/validators/interview";
import { cn } from "@/lib/utils";

type Interview = ApplicationDetail["interviews"][number];

const OUTCOME_STYLE: Record<InterviewOutcome, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  PASSED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-200",
};

type FormValues = {
  scheduledAt: string;
  type: InterviewType;
  outcome: InterviewOutcome;
  notes: string;
};

const emptyForm: FormValues = { scheduledAt: "", type: "TECHNICAL", outcome: "PENDING", notes: "" };

export function InterviewSection({
  applicationId,
  stage,
  interviews,
}: {
  applicationId: string;
  stage: Stage;
  interviews: Interview[];
}) {
  const { run, pending } = useApiAction();
  const [editing, setEditing] = useState<Interview | "new" | null>(null);
  const [deleting, setDeleting] = useState<Interview | null>(null);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  // No new rounds on a wishlist item (not applied yet) or a closed application.
  const closed = CLOSED_STAGES.includes(stage) || stage === "ACCEPTED";
  const canAdd = stage !== "WISHLIST" && !closed;

  function openForm(interview: Interview | "new") {
    setErrors({});
    setValues(
      interview === "new"
        ? emptyForm
        : {
            scheduledAt: toDateTimeInputValue(interview.scheduledAt),
            type: interview.type,
            outcome: interview.outcome,
            notes: interview.notes ?? "",
          },
    );
    setEditing(interview);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // datetime-local has no time zone; convert to an exact instant in the browser.
    const payload = {
      scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : "",
      type: values.type,
      outcome: values.outcome,
      notes: values.notes,
    };
    const parsed = interviewCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }

    const isNew = editing === "new";
    const result = await run(
      () =>
        apiRequest(
          isNew
            ? `/api/applications/${applicationId}/interviews`
            : `/api/applications/${applicationId}/interviews/${(editing as Interview).id}`,
          { method: isNew ? "POST" : "PATCH", body: payload },
        ),
      { successMessage: isNew ? "Round added." : "Round updated." },
    );
    if (result) setEditing(null);
  }

  async function remove() {
    if (!deleting) return;
    const result = await run(
      () =>
        apiRequest(`/api/applications/${applicationId}/interviews/${deleting.id}`, {
          method: "DELETE",
        }),
      { successMessage: "Round deleted." },
    );
    if (result) setDeleting(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Interviews</h2>
        </CardTitle>
        <CardDescription>
          {canAdd
            ? "Each round, its date and how it went."
            : closed
              ? "The rounds you had for this job."
              : "Mark the application as Applied to add interviews."}
        </CardDescription>
        {canAdd ? (
          <CardAction>
            <Button size="sm" variant="outline" onClick={() => openForm("new")}>
              <PlusIcon aria-hidden /> Add round
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {interviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No interviews recorded yet.</p>
        ) : (
          <ul className="divide-y">
            {interviews.map((interview) => (
              <li key={interview.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun font-heading text-sm font-extrabold">
                  R{interview.round}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-heading font-bold">
                    {INTERVIEW_TYPE_LABELS[interview.type]}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold ring-[1.5px] ring-inset",
                        OUTCOME_STYLE[interview.outcome],
                      )}
                    >
                      {INTERVIEW_OUTCOME_LABELS[interview.outcome]}
                    </span>
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClockIcon className="size-3" aria-hidden />
                    {formatDateTime(interview.scheduledAt)}
                  </p>
                  {interview.notes ? (
                    <p
                      dir="auto"
                      className="mt-1 text-sm whitespace-pre-line text-muted-foreground"
                    >
                      {interview.notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Edit round ${interview.round}`}
                    onClick={() => openForm(interview)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Delete round ${interview.round}`}
                    onClick={() => setDeleting(interview)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && !pending && setEditing(null)}
      >
        <DialogContent>
          <form onSubmit={save} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>
                {editing === "new"
                  ? "Add interview round"
                  : `Edit round ${(editing as Interview | null)?.round ?? ""}`}
              </DialogTitle>
            </DialogHeader>
            <FormField id="scheduledAt" label="Date and time" error={errors.scheduledAt}>
              <Input
                {...fieldA11y("scheduledAt", errors.scheduledAt)}
                type="datetime-local"
                value={values.scheduledAt}
                onChange={(e) => {
                  setValues((v) => ({ ...v, scheduledAt: e.target.value }));
                  setErrors((prev) => ({ ...prev, scheduledAt: undefined }));
                }}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="type" label="Type">
                <Select
                  value={values.type}
                  onValueChange={(type) =>
                    setValues((v) => ({ ...v, type: type as InterviewType }))
                  }
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue>{INTERVIEW_TYPE_LABELS[values.type]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InterviewType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {INTERVIEW_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField id="outcome" label="Outcome">
                <Select
                  value={values.outcome}
                  onValueChange={(outcome) =>
                    setValues((v) => ({ ...v, outcome: outcome as InterviewOutcome }))
                  }
                >
                  <SelectTrigger id="outcome" className="w-full">
                    <SelectValue>{INTERVIEW_OUTCOME_LABELS[values.outcome]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InterviewOutcome).map((outcome) => (
                      <SelectItem key={outcome} value={outcome}>
                        {INTERVIEW_OUTCOME_LABELS[outcome]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField id="interview-notes" label="Notes (optional)" error={errors.notes}>
              <Textarea
                {...fieldA11y("interview-notes", errors.notes)}
                value={values.notes}
                onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
                rows={3}
                placeholder="Topics, interviewer, what went well"
              />
            </FormField>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => !open && !pending && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete round {deleting?.round}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The round and its notes are removed for good. This can&apos;t be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
              Delete round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
