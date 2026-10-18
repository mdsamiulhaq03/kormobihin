import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRightIcon,
  BellRingIcon,
  ChartColumnIcon,
  MailQuestionIcon,
  RouteIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { STAGE_DOT } from "@/components/applications/badges";
import { Wordmark } from "@/components/app/wordmark";
import {
  Confetti,
  Dot,
  IconBadge,
  Plus,
  Squiggle,
  Tile,
  Triangle,
} from "@/components/decor/shapes";
import { PlayWhenVisible } from "@/components/landing/play-when-visible";
import { Button } from "@/components/ui/button";
import type { Stage } from "@/generated/prisma/enums";
import type { Showcase } from "@/lib/domain/showcase";
import { STAGE_LABELS } from "@/lib/domain/labels";
import { getDemoShowcase } from "@/lib/services/showcase";
import { cn } from "@/lib/utils";

// The preview shows live numbers from the demo account (refreshed every 5 minutes), so
// what a visitor sees here is what they find after logging in. This example is only used
// when the database can't be reached, and is labelled as an example.
export const revalidate = 300;

const EXAMPLE: Showcase = {
  total: 9,
  pipeline: [
    { stage: "WISHLIST", count: 3 },
    { stage: "APPLIED", count: 3 },
    { stage: "SHORTLISTED", count: 1 },
    { stage: "INTERVIEW", count: 1 },
    { stage: "OFFER", count: 1 },
  ],
  bestSource: { label: "Bdjobs", responded: 3, applied: 5, rate: 60 },
  topMatch: { company: "Brain Station 23", score: 90, label: "Strong", missing: ["Jest"] },
  lowMatch: {
    company: "Therap (BD) Ltd.",
    score: 30,
    label: "Weak",
    missing: ["Java", "Spring Boot"],
  },
  followUpCompany: "Pathao",
};

const FLOW: Stage[] = ["WISHLIST", "APPLIED", "SHORTLISTED", "INTERVIEW", "OFFER", "ACCEPTED"];

// Where Bangladeshi fresh graduates actually find jobs; these are the sources the app tracks.
const SOURCES = [
  "Bdjobs",
  "LinkedIn",
  "Facebook groups",
  "Company career sites",
  "Referrals from seniors",
];

type Tone = "primary" | "pink" | "sun" | "grape";

type Feature = { title: string; text: string; icon: LucideIcon; tone: Tone; proof: ReactNode };

// Each feature carries one real line from the demo account as proof.
function features(data: Showcase): Feature[] {
  const matches = [data.topMatch, data.lowMatch].filter((m) => m !== null);
  return [
    {
      title: "One pipeline for every job",
      text: "Follow each application from Wishlist to Offer, with every move kept in a timeline.",
      icon: RouteIcon,
      tone: "primary",
      proof: (
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
          {FLOW.map((stage, index) => (
            <li key={stage} className="flex items-center gap-1">
              <span className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-card px-2 py-0.5 font-semibold">
                <span className={cn("size-2 rounded-full", STAGE_DOT[stage])} aria-hidden />
                {STAGE_LABELS[stage]}
              </span>
              {index < FLOW.length - 1 ? (
                <ArrowRightIcon className="size-3 text-muted-foreground" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
      ),
    },
    {
      title: "AI CV match",
      text: "A 0–100 score, the skills you have, the ones you’re missing, and three ways to improve your CV. Honest about low scores too.",
      icon: SparklesIcon,
      tone: "pink",
      proof: (
        <dl className="grid gap-2 text-sm">
          {matches.map(({ company, score, missing }) => (
            <div key={company} className="flex items-baseline gap-3">
              <dt className="w-10 font-heading text-2xl font-extrabold text-primary tabular-nums">
                {score}
              </dt>
              <dd className="text-muted-foreground">
                <span className="font-semibold text-foreground">{company}</span>
                {missing.length > 0 ? `, missing ${missing.join(", ")}` : ", nothing missing"}
              </dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      title: "Nothing slips through",
      text: "A nudge when a company hasn’t replied in 3 weeks or a deadline is 3 days away, and every interview round in one list.",
      icon: BellRingIcon,
      tone: "sun",
      proof: (
        <p className="flex items-center gap-2.5 text-sm">
          <IconBadge icon={MailQuestionIcon} tone="paper" size="sm" />
          <span>
            <span className="font-semibold">Follow up with {data.followUpCompany ?? "Pathao"}</span>
            <span className="text-muted-foreground">: no reply yet</span>
          </span>
        </p>
      ),
    },
    {
      title: "Know what works",
      text: "Reply, interview and offer rates, and which job sites actually answer you.",
      icon: ChartColumnIcon,
      tone: "grape",
      proof: data.bestSource ? (
        <p className="text-sm">
          <span className="font-semibold">{data.bestSource.label} replies most often:</span>{" "}
          <span className="text-muted-foreground">
            {data.bestSource.responded} of {data.bestSource.applied} ({data.bestSource.rate}%)
          </span>
        </p>
      ) : null,
    },
  ];
}

/** Start time for a step of the preview animation (see .kb-* in globals.css). */
const delay = (ms: number) => ({ "--kb-delay": `${ms}ms` }) as CSSProperties;

function DemoPreview({ data, live }: { data: Showcase; live: boolean }) {
  const match = data.topMatch;
  const summary = data.pipeline
    .map(({ stage, count }) => `${count} ${STAGE_LABELS[stage].toLowerCase()}`)
    .join(", ");
  return (
    <figure className="relative isolate grid gap-3">
      {/* Dot-grid blob peeking out behind the card. */}
      <div
        aria-hidden
        className="bg-dots absolute -inset-4 -z-10 translate-x-5 translate-y-5 rounded-[2.5rem_2.5rem_2.5rem_0.5rem] sm:-inset-6 sm:translate-x-8 sm:translate-y-8"
      />
      <div
        className="grid gap-6 rounded-[1.75rem_1.75rem_1.75rem_0.5rem] border-2 border-ink bg-card p-5 text-card-foreground shadow-pop-hover sm:p-7"
        role="img"
        aria-label={`Preview of the demo account: ${summary}${match ? `, and a CV match of ${match.score} out of 100 for ${match.company}${match.missing.length ? `, missing ${match.missing.join(", ")}` : ""}` : ""}.`}
      >
        <div className="grid gap-3">
          <p className="font-heading text-sm font-bold">Pipeline: {data.total} jobs</p>
          <div className="kb-wipe-x flex h-4 overflow-hidden rounded-full border-2 border-ink">
            {data.pipeline.map(({ stage, count }, index) => (
              <span
                key={stage}
                className={cn(STAGE_DOT[stage], index > 0 && "border-l-2 border-ink")}
                style={{ width: `${(count / Math.max(data.total, 1)) * 100}%` }}
              />
            ))}
          </div>
          <ul className="grid grid-cols-4 gap-x-4 gap-y-3">
            {data.pipeline.map(({ stage, count }, index) => (
              <li key={stage} className="kb-pop grid gap-0.5" style={delay(100 + index * 110)}>
                <span className="font-heading text-2xl leading-none font-extrabold tabular-nums">
                  {count}
                </span>
                <span className="text-xs text-muted-foreground">{STAGE_LABELS[stage]}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* A section of the same card, not a card inside it. */}
        {match ? (
          <div className="grid gap-4 border-t-2 border-dashed border-ink/25 pt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-heading text-sm font-bold">
                <IconBadge icon={SparklesIcon} tone="pink" size="sm" />
                CV match
              </p>
              <p className="text-xs text-muted-foreground">{match.company}</p>
            </div>
            <div className="flex items-end gap-4">
              <p
                className="kb-rise font-heading text-7xl leading-[0.85] font-extrabold tracking-tight text-primary tabular-nums"
                style={delay(550)}
              >
                {match.score}
              </p>
              <div className="grid gap-1.5 pb-1">
                <p className="font-heading font-bold">{match.label} match</p>
                {match.missing.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Missing from the CV:{" "}
                    {match.missing.map((skill) => (
                      <span
                        key={skill}
                        className="kb-pop inline-block rounded-full border-2 border-ink bg-pink px-2 py-0.5 font-bold text-ink"
                        style={delay(1150)}
                      >
                        {skill}
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="h-4 overflow-hidden rounded-full border-2 border-ink bg-card">
              <div
                className="kb-grow-x h-full rounded-r-full bg-primary"
                style={{ ...delay(650), width: `${match.score}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
      <figcaption className="text-xs text-muted-foreground">
        {live
          ? "Live from the demo account. Log in to explore it."
          : "An example pipeline. Log in to the demo account to see real data."}
      </figcaption>
    </figure>
  );
}

/** Job sources scrolling past, duplicated once so the loop is seamless. */
function SourceMarquee() {
  const row = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-8 pr-8 motion-safe:animate-[kb-marquee_32s_linear_infinite]"
    >
      {SOURCES.map((source, index) => (
        <li key={source} className="flex items-center gap-8">
          <span className="font-heading text-xl font-bold whitespace-nowrap sm:text-2xl">
            {source}
          </span>
          <Dot
            tone={(["sun", "pink", "grape"] as const)[index % 3]}
            className="size-3.5 border-paper"
          />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Where you find jobs" className="border-y-2 border-ink bg-ink text-paper">
      <div className="flex overflow-hidden py-5 hover:[&_ul]:[animation-play-state:paused]">
        <p className="sr-only">
          Track jobs from Bdjobs, LinkedIn, Facebook groups, company career sites and referrals.
        </p>
        {row(true)}
        {row(true)}
      </div>
    </section>
  );
}

export default async function Home() {
  const showcase = await getDemoShowcase();
  const data = showcase ?? EXAMPLE;
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" aria-label="KormoBihin home">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" className="h-11 px-3 sm:px-4">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="h-11 px-4">
            <Link href="/register">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative">
          <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-16 lg:pb-28">
            <div className="relative isolate grid gap-7">
              {/* The big sun behind the headline. */}
              <Dot
                tone="sun"
                className="absolute -top-6 -left-16 -z-10 size-48 border-0 sm:-top-12 sm:-left-32 sm:size-80"
              />
              <Confetti>
                <Triangle tone="pink" className="absolute -top-6 right-6 size-9 -rotate-12" />
                <Plus tone="grape" className="absolute bottom-24 -left-10 size-7" />
              </Confetti>
              <h1 className="max-w-[12ch] font-heading text-5xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Every job you applied to, in one place.
              </h1>
              <p className="max-w-lg text-lg text-pretty">
                For fresh graduates in Bangladesh: track each application from Applied to Offer, get
                nudged to follow up, and see how well your CV fits the job before you send it.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="h-14 pr-2 pl-6 text-base">
                  <Link href="/register">
                    Create free account
                    <span className="grid size-10 place-items-center rounded-full border-2 border-ink bg-card text-ink">
                      <ArrowRightIcon aria-hidden />
                    </span>
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-6 text-base">
                  <Link href="/login?demo=1">Try the demo</Link>
                </Button>
              </div>
              <p className="w-fit max-w-sm rounded-[1.25rem_1.25rem_1.25rem_0.25rem] border-2 border-ink bg-card px-4 py-2.5 text-sm shadow-pop">
                {/* A drawn strike: the browser line-through sits on the Bengali headline
                    bar (matra) and reads as a rendering glitch. */}
                <span
                  lang="bn"
                  className="relative inline-block font-(family-name:--font-bangla) text-lg font-bold after:absolute after:inset-x-[-2px] after:top-[60%] after:h-[3px] after:-rotate-6 after:rounded-full after:bg-pink"
                >
                  কর্মহীন
                </span>{" "}
                (KormoBihin) means “jobless” in Bangla. Let’s fix that.
              </p>
            </div>

            <div className="relative">
              <Confetti>
                <Tile tone="grape" className="absolute -top-8 right-10 size-8" />
                <Dot tone="pink" className="absolute -bottom-10 left-6 size-6" />
                <Plus tone="primary" className="absolute top-1/3 -right-8 size-8" />
              </Confetti>
              <PlayWhenVisible>
                <DemoPreview data={data} live={showcase !== null} />
              </PlayWhenVisible>
            </div>
          </div>
        </section>

        <SourceMarquee />

        <section aria-labelledby="features-title" className="relative py-20 lg:py-28">
          <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 sm:px-6">
            <div className="grid gap-4">
              <h2
                id="features-title"
                className="max-w-[18ch] font-heading text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl"
              >
                Built for the way the job hunt works here.
              </h2>
              <Squiggle tone="primary" className="h-4 w-40" />
            </div>

            <div className="relative">
              {/* The dashed path runs card to card in order: the journey of an application. */}
              <svg
                aria-hidden
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 hidden size-full md:block"
              >
                <path
                  d="M25 25 H75 L25 75 H75"
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth="2.5"
                  strokeDasharray="8 8"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <ul className="relative grid gap-12 md:grid-cols-2 md:gap-x-16 md:gap-y-20">
                {features(data).map(({ title, text, icon, tone, proof }) => (
                  <li
                    key={title}
                    className="group relative grid content-start gap-4 rounded-2xl border-2 border-ink bg-card px-6 pt-10 pb-6 shadow-sticker transition-transform duration-300 ease-bounce motion-safe:hover:scale-[1.02] motion-safe:hover:-rotate-1"
                  >
                    <IconBadge
                      icon={icon}
                      tone={tone}
                      size="lg"
                      className="absolute -top-7 left-6 group-hover:motion-safe:animate-[kb-wiggle_450ms_ease-in-out]"
                    />
                    <h3 className="font-heading text-2xl font-bold tracking-tight">{title}</h3>
                    <p className="max-w-[60ch] text-pretty text-muted-foreground">{text}</p>
                    {proof}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:pb-28">
          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-hidden rounded-[2rem] border-2 border-ink bg-primary px-6 py-12 text-primary-foreground shadow-pop sm:flex-row sm:items-center sm:justify-between sm:px-12">
            <div aria-hidden className="bg-dots-light absolute inset-y-0 right-0 w-1/2" />
            <Confetti>
              <Dot tone="sun" className="absolute -top-10 right-1/3 size-24" />
              <Triangle tone="pink" className="absolute right-10 bottom-4 size-10 rotate-12" />
            </Confetti>
            <p className="relative max-w-[22ch] font-heading text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
              Not ready to sign up? Look around the demo first.
            </p>
            <Button asChild size="lg" variant="outline" className="relative h-14 px-7 text-base">
              <Link href="/login?demo=1">
                Try the demo <ArrowRightIcon aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-ink py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Wordmark className="text-foreground" />
          <p>A job tracker for the Bangladeshi job hunt.</p>
        </div>
      </footer>
    </div>
  );
}
