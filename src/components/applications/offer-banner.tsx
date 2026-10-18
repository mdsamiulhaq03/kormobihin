import Link from "next/link";
import { ChevronRightIcon, PartyPopperIcon } from "lucide-react";
import { Dot, IconBadge, Triangle } from "@/components/decor/shapes";

/**
 * The lasting "you got an offer" moment, on the application and on the dashboard.
 * A toast disappears in seconds; the best news of a job hunt should stay on screen.
 */
export function OfferBanner({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  /** When set, the whole banner links to the offer. */
  href?: string;
}) {
  const content = (
    <>
      <div aria-hidden className="bg-dots-light absolute inset-y-0 right-0 -z-10 w-1/3" />
      <Dot tone="sun" className="absolute -top-6 right-16 -z-10 hidden size-16 sm:block" />
      <Triangle
        tone="pink"
        className="absolute right-16 bottom-2 -z-10 hidden size-8 rotate-12 sm:block"
      />
      <IconBadge icon={PartyPopperIcon} tone="sun" />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="font-heading text-lg font-bold">{title}</p>
        <p className="text-sm text-primary-foreground/85">{body}</p>
      </div>
      {href ? <ChevronRightIcon className="mt-1 size-5 shrink-0 self-center" aria-hidden /> : null}
    </>
  );
  const className =
    "relative isolate flex items-start gap-4 overflow-hidden rounded-2xl border-2 border-ink bg-primary px-5 py-5 text-primary-foreground shadow-pop";

  return href ? (
    <Link
      href={href}
      className={`${className} transition-[transform,box-shadow] duration-300 ease-bounce hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-hover motion-reduce:transition-none motion-reduce:hover:translate-0`}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
