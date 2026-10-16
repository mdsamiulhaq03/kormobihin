"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { FileUpIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { FormField, fieldA11y } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApiAction } from "@/hooks/use-api-action";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import { zodFieldErrors, type FieldErrors } from "@/lib/client/form-errors";
import { PDF_MAX_BYTES, RESUME_MAX_CHARS, resumeCreateSchema } from "@/lib/validators/resume";

export type ResumeDialogMode = { kind: "create" } | { kind: "edit"; id: string; label: string };

/**
 * Add or edit a CV. Text can be pasted, or extracted from a PDF on the server.
 * The parent mounts a fresh instance each time it opens, so state starts clean.
 */
export function ResumeDialog({ mode, onClose }: { mode: ResumeDialogMode; onClose: () => void }) {
  const { run, pending } = useApiAction();
  const fileInput = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(mode.kind === "edit" ? mode.label : "");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loadingContent, setLoadingContent] = useState(mode.kind === "edit");
  const [extracting, setExtracting] = useState(false);

  // When editing, load the full CV text (the list only has a preview).
  useEffect(() => {
    if (mode.kind !== "edit") return;
    const controller = new AbortController();
    apiRequest<{ content: string }>(`/api/resumes/${mode.id}`, { signal: controller.signal })
      .then((resume) => setContent(resume.content))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error("Couldn't load this CV.");
        onClose();
      })
      .finally(() => setLoadingContent(false));
    return () => controller.abort();
  }, [mode, onClose]);

  async function handlePdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (file.size > PDF_MAX_BYTES) {
      toast.error("The PDF is larger than 4 MB.");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    setExtracting(true);
    try {
      const result = await apiRequest<{ text: string; pages: number }>("/api/resumes/parse-pdf", {
        method: "POST",
        body: form,
      });
      setContent(result.text);
      setErrors((prev) => ({ ...prev, content: undefined }));
      if (!label.trim()) setLabel(file.name.replace(/\.pdf$/i, "").slice(0, 60));
      toast.success(
        `Text extracted from ${result.pages} page${result.pages === 1 ? "" : "s"}. Check it below.`,
      );
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Couldn't read the PDF.");
    } finally {
      setExtracting(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = resumeCreateSchema.safeParse({ label, content });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    const url = mode.kind === "edit" ? `/api/resumes/${mode.id}` : "/api/resumes";
    const isEdit = mode.kind === "edit";
    const result = await run(
      () =>
        apiRequest(url, {
          method: isEdit ? "PATCH" : "POST",
          body: parsed.data,
        }),
      { successMessage: isEdit ? "CV updated." : "CV added." },
    );
    if (result) onClose();
  }

  const busy = pending || extracting || loadingContent;

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={save} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{mode.kind === "edit" ? "Edit CV" : "Add a CV"}</DialogTitle>
            <DialogDescription>
              Upload a PDF or paste the text. Only the text is saved and used for AI matching.
            </DialogDescription>
          </DialogHeader>

          <FormField id="label" label="Name" error={errors.label}>
            <Input
              {...fieldA11y("label", errors.label)}
              value={label}
              maxLength={60}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Frontend CV"
            />
          </FormField>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={handlePdf}
              aria-label="Upload CV as PDF"
              tabIndex={-1}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
            >
              {extracting ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <FileUpIcon aria-hidden />
              )}
              {extracting ? "Reading PDF…" : "Upload PDF"}
            </Button>
            <span className="text-xs text-muted-foreground">Text-based PDF, up to 4 MB</span>
          </div>

          <FormField
            id="content"
            label="CV text"
            error={errors.content}
            hint={`${content.length.toLocaleString()} / ${RESUME_MAX_CHARS.toLocaleString()} characters`}
          >
            <Textarea
              {...fieldA11y("content", errors.content)}
              value={loadingContent ? "Loading…" : content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loadingContent}
              rows={12}
              className="max-h-[50svh] font-mono text-xs"
              placeholder="Paste your CV: education, skills, projects, experience…"
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
              Save CV
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
