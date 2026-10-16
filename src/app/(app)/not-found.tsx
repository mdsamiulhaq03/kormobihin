import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-background px-6 py-16 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <SearchXIcon className="size-5" aria-hidden />
      </div>
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">Not found</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          This item doesn&apos;t exist or isn&apos;t yours.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/applications">Back to applications</Link>
      </Button>
    </div>
  );
}
