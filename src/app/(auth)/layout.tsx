import Link from "next/link";
import { Wordmark } from "@/components/app/wordmark";
import { Dot, Plus, Squiggle, Tile, Triangle } from "@/components/decor/shapes";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden border-r-2 border-ink bg-primary p-10 text-primary-foreground lg:flex">
        <div aria-hidden className="bg-dots-light absolute inset-0 -z-10" />
        <Dot tone="sun" className="absolute -right-24 -bottom-24 -z-10 size-96" />
        <div aria-hidden>
          <Triangle tone="pink" className="absolute top-28 right-16 size-12 rotate-12" />
          <Tile tone="grape" className="absolute bottom-28 left-24 size-9" />
          <Plus tone="sun" className="absolute top-40 right-64 size-8" />
        </div>

        <Link
          href="/"
          className="w-fit rounded-full bg-paper py-1.5 pr-4 pl-1.5 text-ink"
          aria-label="KormoBihin home"
        >
          <Wordmark />
        </Link>
        <div className="my-auto grid max-w-lg gap-5 py-10">
          <p className="font-heading text-5xl leading-[1.04] font-extrabold tracking-tight text-balance">
            Every job you applied to, in one place.
          </p>
          <Squiggle tone="sun" className="h-4 w-36" />
          <p className="text-lg text-pretty text-primary-foreground/90">
            Track stages from Applied to Offer, never miss a deadline or interview, and see how well
            your CV matches each job before you apply.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-[1.75rem] border-2 border-ink bg-card p-6 shadow-pop sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
