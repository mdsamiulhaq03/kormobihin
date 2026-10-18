import type { ReactNode } from "react";
import { Dot, Squiggle, Tile, Triangle } from "@/components/decor/shapes";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid gap-1.5">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

/**
 * Empty and first-run states: the one place inside the app where the playful shapes come
 * out, because there is no data to compete with.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative isolate flex flex-col items-center gap-4 overflow-hidden rounded-[1.75rem] border-2 border-ink bg-card px-6 py-14 text-center shadow-sticker">
      <div aria-hidden className="bg-dots absolute inset-x-0 top-0 -z-10 h-28 opacity-70" />
      <Triangle
        tone="pink"
        className="absolute top-6 left-[12%] hidden size-7 -rotate-12 sm:block"
      />
      <Tile tone="grape" className="absolute top-10 right-[14%] hidden size-6 sm:block" />
      <Dot tone="sun" className="absolute bottom-8 left-[18%] hidden size-5 sm:block" />
      <div className="grid size-16 place-items-center rounded-full border-2 border-ink bg-sun text-ink shadow-pop [&_svg]:size-7">
        {icon}
      </div>
      <div className="grid justify-items-center gap-2">
        <p className="max-w-md font-heading text-2xl font-extrabold tracking-tight text-balance">
          {title}
        </p>
        <Squiggle tone="primary" className="h-3 w-24" />
        <p className="max-w-sm text-pretty text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
