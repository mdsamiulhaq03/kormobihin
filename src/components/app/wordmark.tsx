import { cn } from "@/lib/utils";

/** The KormoBihin logo: a green "K" sticker with a little sun, plus the name. */
export function Wordmark({
  className,
  hideName = false,
}: {
  className?: string;
  hideName?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span aria-hidden className="relative grid size-9 place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-ink bg-primary" />
        <span className="absolute -top-0.5 -right-1 size-3 rounded-full border-2 border-ink bg-sun" />
        <span className="relative font-heading text-lg leading-none font-extrabold text-white">
          K
        </span>
      </span>
      <span
        className={cn(
          "font-heading text-lg font-extrabold tracking-tight whitespace-nowrap sm:text-xl",
          hideName && "sr-only",
        )}
      >
        KormoBihin
      </span>
    </span>
  );
}
