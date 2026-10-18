import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the real dashboard (header, pipeline + Up next, replies by source) so nothing
// jumps when the data arrives. On phones Up next comes first, as on the page.
export default function DashboardLoading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-44 rounded-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-5 rounded-xl border-2 border-ink/10 p-6">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-full rounded-full sm:hidden" />
          <Skeleton className="mx-auto hidden size-48 rounded-full sm:block" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-5" />
            ))}
          </div>
        </div>
        <div className="-order-1 grid content-start gap-4 rounded-xl border-2 border-ink/10 p-6 lg:order-none">
          <Skeleton className="h-7 w-28" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-14 shrink-0 rounded-xl" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border-2 border-ink/10 p-6">
        <Skeleton className="h-7 w-56" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    </div>
  );
}
