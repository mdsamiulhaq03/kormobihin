"use client";

import { ArrowRightIcon, ChevronDownIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Stage } from "@/generated/prisma/enums";
import { useApiAction } from "@/hooks/use-api-action";
import { apiRequest } from "@/lib/client/api-client";
import { STAGE_LABELS } from "@/lib/domain/labels";

/** Compact "Move to…" menu used on board cards. Only valid next stages are offered. */
export function StageMoveMenu({
  applicationId,
  nextStages,
}: {
  applicationId: string;
  nextStages: readonly Stage[];
}) {
  const { run, pending } = useApiAction();
  if (nextStages.length === 0) return null;

  const move = (stage: Stage) =>
    run(
      () =>
        apiRequest(`/api/applications/${applicationId}/stage`, {
          method: "POST",
          body: { stage },
        }),
      { successMessage: `Moved to ${STAGE_LABELS[stage]}` },
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="xs" disabled={pending} aria-label="Move to another stage">
          {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
          Move
          <ChevronDownIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {nextStages.map((stage) => (
          <DropdownMenuItem key={stage} onSelect={() => move(stage)}>
            <ArrowRightIcon aria-hidden />
            {STAGE_LABELS[stage]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
