import { Skeleton } from "@/components/ui/skeleton";

export default function ResumesLoading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading CVs">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
