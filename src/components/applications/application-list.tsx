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
import { SOURCE_LABELS } from "@/lib/domain/labels";

function dateLine(app: ApplicationListItem) {
  if (app.appliedAt) return `Applied ${formatDate(app.appliedAt)}`;
  if (app.deadline) return `Deadline ${formatDate(app.deadline)}`;
  return `Added ${formatDate(app.createdAt)}`;
}

/** Table on wide screens, stacked cards on phones. */
export function ApplicationList({ applications }: { applications: ApplicationListItem[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Company &amp; role</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="pr-4 text-right">Match</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id} className="relative">
                <TableCell className="max-w-72 pl-4">
                  <Link
                    href={`/applications/${app.id}`}
                    className="font-medium after:absolute after:inset-0 hover:text-primary"
                  >
                    {app.company}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{app.title}</p>
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
                <TableCell className="pr-4 text-right">
                  <MatchBadge score={app.matchScore} label={app.matchLabel} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="grid gap-2 md:hidden">
        {applications.map((app) => {
          const salary = formatSalary(app.salaryMin, app.salaryMax);
          return (
            <li key={app.id}>
              <Link
                href={`/applications/${app.id}`}
                className="grid gap-2 rounded-xl border bg-background p-3 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{app.company}</p>
                    <p className="truncate text-sm text-muted-foreground">{app.title}</p>
                  </div>
                  <StageBadge stage={app.stage} />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{dateLine(app)}</span>
                  {app.location ? (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="size-3" aria-hidden />
                      {app.location}
                    </span>
                  ) : null}
                  {salary ? <span>{salary}</span> : null}
                  <MatchBadge score={app.matchScore} label={app.matchLabel} />
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
