"use client";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shown when a page in the app fails to load (e.g. the database is unreachable).
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[1.75rem] border-2 border-ink bg-card px-6 py-16 text-center shadow-sticker">
      <div className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlertIcon className="size-5" aria-hidden />
      </div>
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">Couldn&apos;t load this page</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Something went wrong while loading your data. Check your connection and try again.
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCcwIcon aria-hidden />
        Try again
      </Button>
    </div>
  );
}
