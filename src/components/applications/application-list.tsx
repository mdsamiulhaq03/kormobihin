import Link from "next/link";
import { CalendarClockIcon, MapPinIcon } from "lucide-react";
import { FlagList, MatchBadge, StageBadge } from "@/components/applications/badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatSalary } from "@/lib/client/format";
import type { ApplicationListItem } from "@/lib/client/types";
import { FLAG_LABELS } from "@/lib/domain/flags";
import { SOURCE_LABELS, STAGE_LABELS } from "@/lib/domain/labels";
import { CLOSED_STAGES } from "@/lib/domain/stages";
import { cn } from "@/lib/utils";

/** Rejected and declined rows step back so the live applications stand out. */
const isClosed = (stage: ApplicationListItem["stage"]) => CLOSED_STAGES.includes(stage);

function dateLine(app: ApplicationListItem) {
  if (app.appliedAt) return `Applied ${formatDate(app.appliedAt)}`;
  if (app.deadline) return `Deadline ${formatDate(app.deadline)}`;
  return `Added ${formatDate(app.createdAt)}`;
}

/** Table on wide screens, stacked cards on phones. */
export function ApplicationList({ applications }: { applications: ApplicationListItem[] }) {
  // The Match column only appears once at least one CV match has been checked.
  const showMatch = applications.some((app) => app.matchScore != null);

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-sticker md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Company &amp; role</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Salary</TableHead>
              {showMatch ? <TableHead className="pr-4 text-right">Match</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow
                key={app.id}
                className={cn(
                  "relative",
                  isClosed(app.stage) && "bg-muted/60 text-muted-foreground",
                )}
              >
                <TableCell className="max-w-72 pl-4 whitespace-normal">
                  <Link
                    href={`/applications/${app.id}`}
                    className="line-clamp-2 font-heading font-bold after:absolute after:inset-0 hover:text-primary"
                    aria-label={`${app.company}, ${app.title}, ${STAGE_LABELS[app.stage]}${app.flags.length ? `, ${app.flags.map((f) => FLAG_LABELS[f]).join(", ")}` : ""}`}
                  >
                    {app.company}
                  </Link>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{app.title}</p>
                  {app.flags.length > 0 ? (
                    <div className="mt-1">
                      <FlagList flags={app.flags} />
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <StageBadge stage={app.stage} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {SOURCE_LABELS[app.source]}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {dateLine(app)}
                  {app.nextInterview ? (
                    <span className="flex items-center gap-1 text-xs text-amber-700">
                      <CalendarClockIcon className="size-3" aria-hidden />
                      Interview {formatDate(app.nextInterview.scheduledAt)}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                  {formatSalary(app.salaryMin, app.salaryMax) ?? "—"}
                </TableCell>
                {showMatch ? (
                  <TableCell className="pr-4 text-right">
                    {app.matchScore != null ? (
                      <MatchBadge score={app.matchScore} label={app.matchLabel} />
                    ) : (
                      <span className="text-muted-foreground" aria-label="Not checked">
                        —
                      </span>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="grid grid-cols-1 gap-2 md:hidden">
        {applications.map((app) => {
          const salary = formatSalary(app.salaryMin, app.salaryMax);
          return (
            <li key={app.id}>
              <Link
                href={`/applications/${app.id}`}
                className={cn(
                  "grid grid-cols-1 gap-2 rounded-2xl border-2 p-4 transition-colors hover:bg-sun/20",
                  isClosed(app.stage)
                    ? "border-ink/30 bg-muted/60 text-muted-foreground"
                    : "border-ink bg-card shadow-pop-press",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-heading font-bold">{app.company}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{app.title}</p>
                  </div>
                  <StageBadge stage={app.stage} />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{dateLine(app)}</span>
                  {app.location ? (
                    <span className="flex min-w-0 items-center gap-1">
                      <MapPinIcon className="size-3 shrink-0" aria-hidden />
                      {app.location}
                    </span>
                  ) : null}
                  {salary ? <span>{salary}</span> : null}
                  {app.matchScore != null ? (
                    <MatchBadge score={app.matchScore} label={app.matchLabel} />
                  ) : null}
                </div>
                <FlagList flags={app.flags} />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
