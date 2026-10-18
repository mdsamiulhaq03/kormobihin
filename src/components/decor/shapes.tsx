import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Decorative primitives for the Playful Geometric look. Every piece is aria-hidden: they
// set the mood at the edges and never carry information.

type Tone = "primary" | "pink" | "sun" | "grape" | "ink" | "paper";

const FILL: Record<Tone, string> = {
  primary: "bg-primary",
  pink: "bg-pink",
  sun: "bg-sun",
  grape: "bg-grape",
  ink: "bg-ink",
  paper: "bg-paper",
};

const STROKE: Record<Tone, string> = {
  primary: "text-primary",
  pink: "text-pink",
  sun: "text-sun",
  grape: "text-grape",
  ink: "text-ink",
  paper: "text-paper",
};

type ShapeProps = { tone?: Tone; className?: string; style?: CSSProperties };

/** Solid circle with an ink outline. Size and position come from className. */
export function Dot({ tone = "sun", className, style }: ShapeProps) {
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "pointer-events-none block rounded-full border-2 border-ink",
        FILL[tone],
        className,
      )}
    />
  );
}

/** Outlined triangle. */
export function Triangle({ tone = "pink", className, style }: ShapeProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 36"
      style={style}
      className={cn("pointer-events-none block", STROKE[tone], className)}
    >
      <path
        d="M20 3 37 33H3Z"
        fill="currentColor"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Rounded square tilted like a dropped sticker. */
export function Tile({ tone = "grape", className, style }: ShapeProps) {
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "pointer-events-none block rotate-12 rounded-md border-2 border-ink",
        FILL[tone],
        className,
      )}
    />
  );
}

/** Plus sign drawn with two pills. */
export function Plus({ tone = "primary", className, style }: ShapeProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      style={style}
      className={cn("pointer-events-none block", STROKE[tone], className)}
    >
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/** Hand-drawn wave, used under headings and as a section divider. */
export function Squiggle({ tone = "sun", className, style }: ShapeProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 12"
      preserveAspectRatio="none"
      style={style}
      className={cn("pointer-events-none block", STROKE[tone], className)}
    >
      <path
        d="M2 7c9-7 16 5 25 0s16-7 25 0 16 5 25 0 16-7 25 0 9 3 16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A lucide icon sitting inside an outlined colour circle (icons are never left floating). */
export function IconBadge({
  icon: Icon,
  tone = "primary",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const light = tone === "sun" || tone === "paper";
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-2 border-ink",
        FILL[tone],
        light ? "text-ink" : "text-white",
        size === "sm" && "size-7 [&_svg]:size-3.5",
        size === "md" && "size-10 [&_svg]:size-5",
        size === "lg" && "size-14 [&_svg]:size-6",
        className,
      )}
    >
      <Icon />
    </span>
  );
}

/**
 * A scatter of confetti behind a block. Hidden on phones, where floating shapes would
 * crowd the text. The parent must be `relative`.
 */
export function Confetti({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 hidden sm:block", className)}
    >
      {children}
    </div>
  );
}
