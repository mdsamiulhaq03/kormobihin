"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { KanbanSquareIcon, ListIcon, Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobSource, type Stage } from "@/generated/prisma/enums";
import { SOURCE_LABELS, STAGE_LABELS } from "@/lib/domain/labels";
import { STAGES } from "@/lib/domain/stages";
import { cn } from "@/lib/utils";

const ALL = "all";

const SORT_LABELS = {
  newest: "Newest first",
  oldest: "Oldest first",
  deadline: "Deadline",
  company: "Company A–Z",
  match: "Best match",
} as const;

/** Filters live in the URL (?stage=APPLIED&q=react), so they survive refresh and can be shared. */
export function ApplicationFilters({ view }: { view: "list" | "board" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("q") ?? "");

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "" || value === ALL) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    startTransition(() =>
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }),
    );
  }

  // Wait until typing pauses before searching, instead of a request per keystroke.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (search === current) return;
    const timer = setTimeout(() => update({ q: search.trim() }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [search]);

  const hasFilters = ["q", "stage", "source"].some((key) => params.get(key));
  const stageParam = params.get("stage") as Stage | null;
  const sourceParam = params.get("source") as JobSource | null;
  const sortParam = params.get("sort") ?? "newest";
  const sortValue = (sortParam in SORT_LABELS ? sortParam : "newest") as keyof typeof SORT_LABELS;
  // Labels are passed to SelectValue explicitly so the closed dropdown always shows text.
  const stageLabel =
    stageParam && STAGE_LABELS[stageParam] ? STAGE_LABELS[stageParam] : "All stages";
  const sourceLabel =
    sourceParam && SOURCE_LABELS[sourceParam] ? SOURCE_LABELS[sourceParam] : "All sources";

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search company, title or location"
          aria-label="Search applications"
          className="h-9 bg-background pl-8"
        />
        {pending ? (
          <Loader2Icon
            className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-label="Updating"
          />
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Select value={params.get("stage") ?? ALL} onValueChange={(stage) => update({ stage })}>
          <SelectTrigger className="h-9 w-full bg-background sm:w-36" aria-label="Filter by stage">
            <SelectValue>{stageLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All stages</SelectItem>
            {STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={params.get("source") ?? ALL} onValueChange={(source) => update({ source })}>
          <SelectTrigger className="h-9 w-full bg-background sm:w-40" aria-label="Filter by source">
            <SelectValue>{sourceLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sources</SelectItem>
            {Object.values(JobSource).map((source) => (
              <SelectItem key={source} value={source}>
                {SOURCE_LABELS[source]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortValue} onValueChange={(sort) => update({ sort })}>
          <SelectTrigger
            className="h-9 w-full bg-background sm:w-36"
            aria-label="Sort applications"
          >
            <SelectValue>{SORT_LABELS[sortValue]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex rounded-lg border bg-background p-0.5" role="group" aria-label="View">
          {(
            [
              ["list", ListIcon, "List"],
              ["board", KanbanSquareIcon, "Board"],
            ] as const
          ).map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ view: value === "list" ? null : value })}
              aria-pressed={view === value}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-sm text-muted-foreground transition-colors",
                view === value && "bg-muted font-medium text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {hasFilters ? (
          <Button
            variant="ghost"
            className="h-9"
            onClick={() => {
              setSearch("");
              update({ q: null, stage: null, source: null });
            }}
          >
            <XIcon aria-hidden /> Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
