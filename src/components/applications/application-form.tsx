"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { FormField, fieldA11y } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JobSource, type Stage } from "@/generated/prisma/enums";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import { toDateInputValue } from "@/lib/client/format";
import { apiFieldErrors, zodFieldErrors, type FieldErrors } from "@/lib/client/form-errors";
import type { ApplicationDetail, ResumeOption } from "@/lib/client/types";
import { SOURCE_LABELS } from "@/lib/domain/labels";
import { applicationCreateSchema, applicationUpdateSchema } from "@/lib/validators/application";
import { cn } from "@/lib/utils";

const NO_RESUME = "none";

type Values = {
  company: string;
  title: string;
  source: JobSource;
  jobUrl: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  deadline: string;
  appliedAt: string;
  resumeId: string;
  jobDescription: string;
  notes: string;
  stage: Extract<Stage, "WISHLIST" | "APPLIED">;
};

function initialValues(application?: ApplicationDetail, resumes: ResumeOption[] = []): Values {
  return {
    company: application?.company ?? "",
    title: application?.title ?? "",
    source: application?.source ?? "BDJOBS",
    jobUrl: application?.jobUrl ?? "",
    location: application?.location ?? "",
    salaryMin: application?.salaryMin?.toString() ?? "",
    salaryMax: application?.salaryMax?.toString() ?? "",
    deadline: toDateInputValue(application?.deadline),
    appliedAt: toDateInputValue(application?.appliedAt),
    // New applications default to the most recently edited CV.
    resumeId: application ? (application.resumeId ?? NO_RESUME) : (resumes[0]?.id ?? NO_RESUME),
    jobDescription: application?.jobDescription ?? "",
    notes: application?.notes ?? "",
    stage: "WISHLIST",
  };
}

const toAmount = (value: string) => (value.trim() === "" ? null : Number(value));

/** After errors render, move focus (and scroll) to the first invalid field. */
const focusFirstInvalid = () =>
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>("form [aria-invalid=true]")?.focus(),
  );

export function ApplicationForm({
  application,
  resumes,
}: {
  application?: ApplicationDetail;
  resumes: ResumeOption[];
}) {
  const router = useRouter();
  const isEdit = Boolean(application);
  const [values, setValues] = useState(() => initialValues(application, resumes));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof Values>(field: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const showAppliedDate = isEdit ? application?.stage !== "WISHLIST" : values.stage === "APPLIED";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      company: values.company,
      title: values.title,
      source: values.source,
      jobUrl: values.jobUrl,
      location: values.location,
      salaryMin: toAmount(values.salaryMin),
      salaryMax: toAmount(values.salaryMax),
      deadline: values.deadline || null,
      appliedAt: showAppliedDate ? values.appliedAt || null : undefined,
      resumeId: values.resumeId === NO_RESUME ? null : values.resumeId,
      jobDescription: values.jobDescription,
      notes: values.notes,
      ...(isEdit ? {} : { stage: values.stage }),
    };

    const schema = isEdit ? applicationUpdateSchema : applicationCreateSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      focusFirstInvalid();
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await apiRequest<{ id: string }>(
        isEdit ? `/api/applications/${application!.id}` : "/api/applications",
        { method: isEdit ? "PATCH" : "POST", body: payload },
      );
      toast.success(isEdit ? "Changes saved." : "Application added.");
      router.push(`/applications/${saved.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrors(apiFieldErrors(error.fieldErrors));
        toast.error(error.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6">
      <section className="grid gap-4 rounded-xl border bg-background p-4 sm:p-6">
        <h2 className="font-medium">Job</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="company" label="Company" error={errors.company}>
            <Input
              {...fieldA11y("company", errors.company)}
              value={values.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Brain Station 23"
            />
          </FormField>
          <FormField id="title" label="Job title" error={errors.title}>
            <Input
              {...fieldA11y("title", errors.title)}
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Junior Frontend Developer"
            />
          </FormField>
          <FormField id="source" label="Found on" error={errors.source}>
            <Select value={values.source} onValueChange={(v) => set("source", v as JobSource)}>
              <SelectTrigger
                id="source"
                className="w-full"
                aria-invalid={errors.source ? true : undefined}
              >
                <SelectValue>{SOURCE_LABELS[values.source]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.values(JobSource).map((source) => (
                  <SelectItem key={source} value={source}>
                    {SOURCE_LABELS[source]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="location" label="Location (optional)" error={errors.location}>
            <Input
              {...fieldA11y("location", errors.location)}
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Dhaka (Mohakhali)"
            />
          </FormField>
          <FormField id="jobUrl" label="Job post link (optional)" error={errors.jobUrl}>
            <Input
              {...fieldA11y("jobUrl", errors.jobUrl)}
              type="url"
              inputMode="url"
              value={values.jobUrl}
              onChange={(e) => set("jobUrl", e.target.value)}
              placeholder="https://jobs.bdjobs.com/…"
            />
          </FormField>
          <FormField id="deadline" label="Application deadline (optional)" error={errors.deadline}>
            <Input
              {...fieldA11y("deadline", errors.deadline)}
              type="date"
              value={values.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </FormField>
          <FormField
            id="salaryMin"
            label="Salary from (BDT/month, optional)"
            error={errors.salaryMin}
          >
            <Input
              {...fieldA11y("salaryMin", errors.salaryMin)}
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              value={values.salaryMin}
              onChange={(e) => set("salaryMin", e.target.value)}
              placeholder="30000"
            />
          </FormField>
          <FormField
            id="salaryMax"
            label="Salary to (BDT/month, optional)"
            error={errors.salaryMax}
          >
            <Input
              {...fieldA11y("salaryMax", errors.salaryMax)}
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              value={values.salaryMax}
              onChange={(e) => set("salaryMax", e.target.value)}
              placeholder="40000"
            />
          </FormField>
        </div>

        <FormField
          id="jobDescription"
          label="Job description"
          error={errors.jobDescription}
          hint="Paste the full post. It's used to check how well your CV matches."
        >
          <Textarea
            {...fieldA11y("jobDescription", errors.jobDescription)}
            value={values.jobDescription}
            onChange={(e) => set("jobDescription", e.target.value)}
            rows={8}
            placeholder="Requirements: React, TypeScript, REST API…"
          />
        </FormField>
      </section>

      <section className="grid gap-4 rounded-xl border bg-background p-4 sm:p-6">
        <h2 className="font-medium">Your application</h2>

        {!isEdit ? (
          <fieldset className="grid gap-2">
            <legend className="mb-1.5 text-sm font-medium">Status</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["WISHLIST", "Want to apply", "Save it to your wishlist and track the deadline."],
                  [
                    "APPLIED",
                    "Already applied",
                    "Start tracking replies from today (or a date you set).",
                  ],
                ] as const
              ).map(([stage, label, description]) => (
                <label
                  key={stage}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    values.stage === stage && "border-primary bg-primary/5",
                  )}
                >
                  <input
                    type="radio"
                    name="stage"
                    value={stage}
                    checked={values.stage === stage}
                    onChange={() => set("stage", stage)}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="grid gap-0.5">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">{description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="resumeId"
            label="CV used"
            error={errors.resumeId}
            hint={
              resumes.length === 0
                ? "Add a CV on the My CVs page to enable AI matching."
                : undefined
            }
          >
            <Select value={values.resumeId} onValueChange={(v) => set("resumeId", v)}>
              <SelectTrigger id="resumeId" className="w-full">
                <SelectValue>
                  {resumes.find((r) => r.id === values.resumeId)?.label ?? "No CV selected"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_RESUME}>No CV selected</SelectItem>
                {resumes.map((resume) => (
                  <SelectItem key={resume.id} value={resume.id}>
                    {resume.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {showAppliedDate ? (
            <FormField
              id="appliedAt"
              label="Date applied"
              error={errors.appliedAt}
              hint={isEdit ? undefined : "Leave empty for today."}
            >
              <Input
                {...fieldA11y("appliedAt", errors.appliedAt)}
                type="date"
                value={values.appliedAt}
                onChange={(e) => set("appliedAt", e.target.value)}
              />
            </FormField>
          ) : null}
        </div>

        <FormField id="notes" label="Notes (optional)" error={errors.notes}>
          <Textarea
            {...fieldA11y("notes", errors.notes)}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Referred by a senior, HR contact: …"
          />
        </FormField>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="outline" size="lg">
          <Link href={isEdit ? `/applications/${application!.id}` : "/applications"}>Cancel</Link>
        </Button>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Add application"}
        </Button>
      </div>
    </form>
  );
}
