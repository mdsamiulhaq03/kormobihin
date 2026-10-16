import Link from "next/link";
import {
  BellRingIcon,
  ChartColumnIcon,
  GitBranchIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAGE_LABELS } from "@/lib/domain/labels";

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: GitBranchIcon,
    title: "One pipeline for every job",
    text: "Bdjobs, LinkedIn, Facebook groups, company sites: track them all, from Wishlist to Offer, with a full timeline.",
  },
  {
    icon: SparklesIcon,
    title: "AI CV match",
    text: "See a 0–100 match score, the skills you have, the ones you're missing, and three ways to improve your CV.",
  },
  {
    icon: BellRingIcon,
    title: "Nothing slips through",
    text: "Automatic flags when a company hasn't replied in 3 weeks or a deadline is 3 days away. Interviews in one list.",
  },
  {
    icon: ChartColumnIcon,
    title: "Know what works",
    text: "Response, interview and offer rates, and which job sites actually reply to you.",
  },
];

const PIPELINE = ["WISHLIST", "APPLIED", "SHORTLISTED", "INTERVIEW", "OFFER"] as const;

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">
            K
          </span>
          KormoBihin
        </span>
        <nav className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="grid gap-6">
            <p className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              For fresh graduates in Bangladesh
            </p>
            <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Every job you applied to. One place. No more lost applications.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              KormoBihin tracks each application from Applied to Offer, reminds you to follow up,
              and uses AI to show how well your CV matches the job.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5">
                <Link href="/register">Create free account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5">
                <Link href="/login">Try the demo</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-4 sm:p-6" aria-hidden>
            <div className="grid gap-3">
              {PIPELINE.map((stage, index) => (
                <div
                  key={stage}
                  className="flex items-center justify-between rounded-xl border bg-background px-4 py-3 shadow-xs"
                  style={{ marginLeft: `${index * 4}%` }}
                >
                  <span className="text-sm font-medium">{STAGE_LABELS[stage]}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {[4, 9, 3, 2, 1][index]} jobs
                  </span>
                </div>
              ))}
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground">
                <SparklesIcon className="size-4" />
                <span className="text-sm">
                  CV match <strong>90/100</strong>. Missing: Jest
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="grid content-start gap-2">
                <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden />
                </div>
                <h2 className="font-medium">{title}</h2>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        KormoBihin. Built for the NT Tech Innovation full-stack assessment.
      </footer>
    </div>
  );
}
