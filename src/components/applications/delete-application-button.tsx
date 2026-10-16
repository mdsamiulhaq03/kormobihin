"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function DeleteApplicationButton({
  applicationId,
  company,
}: {
  applicationId: string;
  company: string;
}) {
  const router = useRouter();
  const { run, pending } = useApiAction();
  const [open, setOpen] = useState(false);

  async function remove() {
    const result = await run(
      () => apiRequest(`/api/applications/${applicationId}`, { method: "DELETE" }),
      {
        successMessage: "Application deleted.",
        refresh: false,
      },
    );
    if (result) {
      router.replace("/applications");
      router.refresh();
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2Icon aria-hidden /> Delete
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this application?</DialogTitle>
            <DialogDescription>
              {company}, its timeline and interview records will be removed permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
