"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";
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
import {
  applicationCreateSchema,
  applicationUpdateSchema,
  JOB_DESCRIPTION_MAX_CHARS,
} from "@/lib/validators/application";
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

function initialValues(application?: ApplicationDetail, defaultResumeId?: string | null): Values {
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
    // New applications start with the CV the user sends most often.
    resumeId: application ? (application.resumeId ?? NO_RESUME) : (defaultResumeId ?? NO_RESUME),
    jobDescription: application?.jobDescription ?? "",
    notes: application?.notes ?? "",
    stage: "APPLIED",
  };
}

/** "30,000" or "30000" → 30000; empty → null. */
const toAmount = (value: string) => {
  const cleaned = value.replace(/[,s৳]/g, "");
  return cleaned === "" ? null : Number(cleaned);
};

const DETAIL_FIELDS = [
  "location",
  "jobUrl",
  "salaryMin",
  "salaryMax",
  "notes",
  "deadline",
] as const;

/** After errors render, move focus (and scroll) to the first invalid field. */
const focusFirstInvalid = () =>
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>("form [aria-invalid=true]")?.focus(),
  );

export function ApplicationForm({
  application,
  resumes,
  defaultResumeId,
}: {
  application?: ApplicationDetail;
  resumes: ResumeOption[];
  defaultResumeId?: string | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(application);
  const [values, setValues] = useState(() => initialValues(application, defaultResumeId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  // Optional details start open only when editing an application that already has some.
  const [showDetails, setShowDetails] = useState(
    () =>
      Boolean(application) &&
      Boolean(
        application?.location ||
        application?.jobUrl ||
        application?.notes ||
        application?.salaryMin != null ||
        application?.salaryMax != null,
      ),
  );
  // A validation error inside the collapsed section opens it so the error is visible.
  const detailsOpen = showDetails || DETAIL_FIELDS.some((field) => errors[field]);

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

  const isWishlist = isEdit ? application?.stage === "WISHLIST" : values.stage === "WISHLIST";

  const deadlineField = (
    <FormField id="deadline" label="Application deadline" error={errors.deadline}>
      <Input
        {...fieldA11y("deadline", errors.deadline)}
        type="date"
        value={values.deadline}
        onChange={(e) => set("deadline", e.target.value)}
      />
    </FormField>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6">
      {!isEdit ? (
        <fieldset className="grid gap-2">
          <legend className="mb-3 font-heading text-xl font-bold">
            Where are you with this job?
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                [
                  "APPLIED",
                  "Already applied",
                  "We’ll watch for a reply and nudge you to follow up.",
                ],
                ["WISHLIST", "Want to apply", "Save it for later and keep an eye on the deadline."],
              ] as const
            ).map(([stage, label, description]) => (
              <label
                key={stage}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-2xl border-2 border-input bg-card p-4 text-sm transition-[border-color,box-shadow,background-color] has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  values.stage === stage && "border-ink bg-primary/10 shadow-pop",
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
                  <span className="font-heading text-base font-bold">{label}</span>
                  <span className="text-muted-foreground">{description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <section className="grid gap-5 rounded-2xl border-2 border-ink bg-card p-5 shadow-sticker sm:p-7">
        <h2 className="font-heading text-xl leading-tight font-extrabold tracking-tight">
          The job
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="company" label="Company" error={errors.company}>
            <Input
              {...fieldA11y("company", errors.company)}
              value={values.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="e.g. Brain Station 23"
              maxLength={120}
              autoComplete="organization"
            />
          </FormField>
          <FormField id="title" label="Job title" error={errors.title}>
            <Input
              {...fieldA11y("title", errors.title)}
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Junior Frontend Developer"
              maxLength={120}
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
          {showAppliedDate ? (
            <FormField
              id="appliedAt"
              label="Date applied"
              error={errors.appliedAt}
              hint={isEdit ? undefined : "Leave empty for today."}
            >
              <Input
                {...fieldA11y("appliedAt", errors.appliedAt, !isEdit)}
                type="date"
                value={values.appliedAt}
                onChange={(e) => set("appliedAt", e.target.value)}
              />
            </FormField>
          ) : isWishlist ? (
            deadlineField
          ) : null}
          <FormField
            id="resumeId"
            label="CV you sent"
            error={errors.resumeId}
            hint={
              resumes.length === 0
                ? "Add a CV on the My CVs page to unlock the CV match."
                : undefined
            }
          >
            <Select value={values.resumeId} onValueChange={(v) => set("resumeId", v)}>
              <SelectTrigger
                id="resumeId"
                className="w-full"
                aria-describedby={resumes.length === 0 ? "resumeId-hint" : undefined}
              >
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
        </div>

        <FormField
          id="jobDescription"
          label="Job description (optional)"
          error={errors.jobDescription}
          hint={
            values.jobDescription.length > JOB_DESCRIPTION_MAX_CHARS * 0.9
              ? `${values.jobDescription.length.toLocaleString("en-IN")} of ${JOB_DESCRIPTION_MAX_CHARS.toLocaleString("en-IN")} characters. Trim the parts about the company if it is too long.`
              : "Paste the post now or later. It unlocks the CV match."
          }
        >
          <Textarea
            {...fieldA11y("jobDescription", errors.jobDescription, true)}
            value={values.jobDescription}
            onChange={(e) => set("jobDescription", e.target.value)}
            rows={6}
            placeholder="e.g. Requirements: React, TypeScript, REST API…"
          />
        </FormField>
      </section>

      <section className="grid rounded-2xl border-2 border-ink bg-card shadow-sticker">
        <button
          type="button"
          onClick={() => setShowDetails((open) => !open)}
          aria-expanded={detailsOpen}
          aria-controls="more-details"
          className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left sm:px-6"
        >
          <span className="grid gap-0.5">
            <span className="font-heading text-lg font-bold">More details</span>
            <span className="text-xs text-muted-foreground">
              Location, salary, link{isWishlist ? "" : ", deadline"} and notes. All optional.
            </span>
          </span>
          <ChevronDownIcon
            className={cn("size-4 shrink-0 transition-transform", detailsOpen && "rotate-180")}
            aria-hidden
          />
        </button>

        {detailsOpen ? (
          <div
            id="more-details"
            className="grid gap-4 border-t px-4 pt-4 pb-5 duration-200 animate-in fade-in motion-safe:slide-in-from-top-1 sm:px-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="location" label="Location" error={errors.location}>
                <Input
                  {...fieldA11y("location", errors.location)}
                  value={values.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Dhaka (Mohakhali)"
                  maxLength={120}
                />
              </FormField>
              <FormField id="jobUrl" label="Job post link" error={errors.jobUrl}>
                <Input
                  {...fieldA11y("jobUrl", errors.jobUrl)}
                  type="url"
                  inputMode="url"
                  value={values.jobUrl}
                  onChange={(e) => set("jobUrl", e.target.value)}
                  placeholder="e.g. https://jobs.bdjobs.com/…"
                  maxLength={500}
                />
              </FormField>
              <FormField id="salaryMin" label="Salary from (৳ per month)" error={errors.salaryMin}>
                <Input
                  {...fieldA11y("salaryMin", errors.salaryMin)}
                  inputMode="numeric"
                  value={values.salaryMin}
                  onChange={(e) => set("salaryMin", e.target.value)}
                  placeholder="e.g. 30,000"
                  maxLength={14}
                />
              </FormField>
              <FormField id="salaryMax" label="Salary to (৳ per month)" error={errors.salaryMax}>
                <Input
                  {...fieldA11y("salaryMax", errors.salaryMax)}
                  inputMode="numeric"
                  value={values.salaryMax}
                  onChange={(e) => set("salaryMax", e.target.value)}
                  placeholder="e.g. 40,000"
                  maxLength={14}
                />
              </FormField>
              {isWishlist ? null : deadlineField}
            </div>
            <FormField id="notes" label="Notes" error={errors.notes}>
              <Textarea
                {...fieldA11y("notes", errors.notes)}
                value={values.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                placeholder="e.g. Referred by a senior; HR contact is Ms. Rahman"
                maxLength={5000}
              />
            </FormField>
          </div>
        ) : null}
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="outline" size="lg" className="h-10">
          <Link href={isEdit ? `/applications/${application!.id}` : "/applications"}>Cancel</Link>
        </Button>
        <Button type="submit" size="lg" className="h-10" disabled={submitting}>
          {submitting ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Add application"}
        </Button>
      </div>
    </form>
  );
}
