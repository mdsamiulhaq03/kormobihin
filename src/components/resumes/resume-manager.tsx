"use client";

import { useCallback, useState } from "react";
import { FileTextIcon, Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { ResumeDialog, type ResumeDialogMode } from "@/components/resumes/resume-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiAction } from "@/hooks/use-api-action";
import { apiRequest } from "@/lib/client/api-client";
import { formatDate, plural } from "@/lib/client/format";
import type { ResumeListItem } from "@/lib/client/types";

type DialogMode = ResumeDialogMode | null;

export function ResumeManager({ resumes }: { resumes: ResumeListItem[] }) {
  const { run, pending } = useApiAction();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [deleting, setDeleting] = useState<ResumeListItem | null>(null);
  const closeDialog = useCallback(() => setDialog(null), []);

  async function remove() {
    if (!deleting) return;
    const result = await run(
      () => apiRequest(`/api/resumes/${deleting.id}`, { method: "DELETE" }),
      {
        successMessage: "CV deleted.",
      },
    );
    if (result) setDeleting(null);
  }

  return (
    <>
      <PageHeader
        title="My CVs"
        description="Keep a version of your CV for each kind of job, e.g. Frontend and General."
        actions={
          resumes.length > 0 ? (
            <Button onClick={() => setDialog({ kind: "create" })}>
              <PlusIcon aria-hidden /> Add CV
            </Button>
          ) : null
        }
      />

      {resumes.length === 0 ? (
        <EmptyState
          icon={<FileTextIcon className="size-5" aria-hidden />}
          title="No CVs yet"
          description="Add your CV once and link it to applications. KormoBihin uses it to check how well you match each job."
          action={
            <Button onClick={() => setDialog({ kind: "create" })}>
              <PlusIcon aria-hidden /> Add your first CV
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resumes.map((resume) => (
            <Card key={resume.id}>
              <CardHeader>
                <CardTitle>
                  <h2 className="flex items-center gap-2">
                    <FileTextIcon className="size-4 text-primary" aria-hidden />
                    {resume.label}
                  </h2>
                </CardTitle>
                <CardDescription>
                  {resume.applicationCount === 0
                    ? "Not linked to any application yet"
                    : `Used in ${plural(resume.applicationCount, "application")}`}
                </CardDescription>
                <CardAction className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Edit ${resume.label}`}
                    onClick={() => setDialog({ kind: "edit", id: resume.id, label: resume.label })}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Delete ${resume.label}`}
                    onClick={() => setDeleting(resume)}
                  >
                    <Trash2Icon />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-4 text-sm whitespace-pre-line text-muted-foreground">
                  {resume.preview}
                  {resume.characters > resume.preview.length ? "…" : ""}
                </p>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Updated {formatDate(resume.updatedAt)}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {dialog ? <ResumeDialog mode={dialog} onClose={closeDialog} /> : null}

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => !open && !pending && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.label}”?</DialogTitle>
            <DialogDescription>
              {deleting && deleting.applicationCount > 0
                ? `${plural(deleting.applicationCount, "application uses", "applications use")} this CV. They will be kept, but without a CV linked, so their match can't be re-checked until you choose another.`
                : "It isn't linked to any application. This can't be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
              Delete CV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
