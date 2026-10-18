import Link from "next/link";
import {
  AlarmClockIcon,
  CalendarClockIcon,
  CalendarXIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  MailQuestionIcon,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatRelativeDays,
} from "@/lib/client/format";
import { DAY_MS, DEADLINE_SOON_DAYS, NO_RESPONSE_AFTER_DAYS } from "@/lib/domain/flags";
import { UPCOMING_WINDOW_DAYS } from "@/lib/domain/stats";
import { groupUpNext, type UpNextItem, type UpNextKind } from "@/lib/domain/up-next";
import { cn } from "@/lib/utils";

// The date anchor takes the darker shade of the status colour (≥5:1 on white); the icon
// and the action text carry the same meaning without colour.
const KIND_STYLE: Record<UpNextKind, { icon: LucideIcon; iconColor: string; anchor: string }> = {
  INTERVIEW: { icon: CalendarClockIcon, iconColor: "text-amber-600", anchor: "text-amber-700" },
  DEADLINE_SOON: { icon: AlarmClockIcon, iconColor: "text-red-600", anchor: "text-red-700" },
  NO_RESPONSE: { icon: MailQuestionIcon, iconColor: "text-orange-600", anchor: "text-orange-700" },
  DEADLINE_PASSED: {
    icon: CalendarXIcon,
    iconColor: "text-muted-foreground",
    anchor: "text-muted-foreground",
  },
};

/** The big anchor on the left of each row: the date that matters, or days waited. */
function anchorFor(kind: UpNextKind, date: Date, now: Date) {
  if (kind === "NO_RESPONSE") {
    const waited = Math.round((now.getTime() - date.getTime()) / DAY_MS);
    return { top: String(waited), bottom: waited === 1 ? "day" : "days" };
  }
  const { day, month } = formatDayMonth(date);
  return { top: day, bottom: month };
}

function whenText(item: UpNextItem, now: Date): string | null {
  if (item.kind === "INTERVIEW") {
    return `${formatDateTime(item.date)} · ${formatRelativeDays(item.date, now)}`;
  }
  if (item.kind === "NO_RESPONSE") return null;
  return `Deadline ${formatDate(item.date)} · ${formatRelativeDays(item.date, now)}`;
}

/** Rows past this number fold into "Show N more", so 20+ applications stay scannable. */
const VISIBLE_ITEMS = 5;

function UpNextRow({ item, now }: { item: UpNextItem; now: Date }) {
  const { icon: Icon, iconColor, anchor: anchorColor } = KIND_STYLE[item.kind];
  const anchor = anchorFor(item.kind, item.date, now);
  const when = whenText(item, now);
  return (
    <li>
      <Link
        href={`/applications/${item.applicationId}`}
        className="group flex items-center gap-4 rounded-2xl px-2 py-3 transition-colors hover:bg-sun/25"
      >
        <span
          className="grid w-14 shrink-0 justify-items-center rounded-xl border-2 border-ink bg-card py-1.5 shadow-pop-press"
          aria-hidden
        >
          <span
            className={cn(
              "font-heading text-2xl leading-none font-extrabold tabular-nums",
              anchorColor,
            )}
          >
            {anchor.top}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">{anchor.bottom}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2 font-bold group-hover:text-primary">
            <Icon className={cn("mt-1 size-4 shrink-0", iconColor)} aria-hidden />
            {item.action}
          </span>
          <span className="block text-xs text-muted-foreground">
            {item.detail}
            {when ? ` · ${when}` : ""}
          </span>
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

function UpNextGroups({ items, now }: { items: UpNextItem[]; now: Date }) {
  return groupUpNext(items).map((group) => (
    <section key={group.id} aria-labelledby={`up-next-${group.id}`} className="grid gap-1">
      <h3
        id={`up-next-${group.id}`}
        className="flex items-center gap-2 px-2 font-heading text-sm font-bold"
      >
        {group.label}
        <span className="rounded-full border-2 border-ink px-1.5 text-xs tabular-nums">
          {group.items.length}
        </span>
      </h3>
      <ul className="-mx-2 grid divide-y divide-foreground/5">
        {group.items.map((item) => (
          <UpNextRow key={item.key} item={item} now={now} />
        ))}
      </ul>
    </section>
  ));
}

/** The featured card: what needs the user, this week first, then what is overdue. */
export function UpNextCard({ items, now }: { items: UpNextItem[]; now: Date }) {
  const visible = items.slice(0, VISIBLE_ITEMS);
  const rest = items.slice(VISIBLE_ITEMS);
  return (
    <Card className="h-full shadow-sticker-pink">
      <CardHeader>
        <CardTitle>
          <h2 className="text-2xl font-extrabold">Up next</h2>
        </CardTitle>
        <CardDescription>
          {/* Says when items appear, so the flags never feel arbitrary. */}
          Interviews in the next {UPCOMING_WINDOW_DAYS} days, deadlines {DEADLINE_SOON_DAYS} days
          ahead, and a follow-up nudge {NO_RESPONSE_AFTER_DAYS} days after you apply with no reply.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {items.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheckIcon className="size-4 text-primary" aria-hidden />
            Nothing needs you right now. A good day to send a new application.
          </p>
        ) : (
          <>
            <UpNextGroups items={visible} now={now} />
            {rest.length > 0 ? (
              <details className="group/more grid gap-4">
                <summary className="w-fit cursor-pointer list-none rounded-full border-2 border-ink px-4 py-2 text-sm font-bold transition-colors hover:bg-sun [&::-webkit-details-marker]:hidden">
                  <span className="group-open/more:hidden">Show {rest.length} more</span>
                  <span className="hidden group-open/more:inline">Show fewer</span>
                </summary>
                <div className="mt-4 grid gap-4">
                  <UpNextGroups items={rest} now={now} />
                </div>
              </details>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
