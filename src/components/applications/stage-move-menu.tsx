"use client";

import { useState } from "react";
import { ArrowRightIcon, ChevronDownIcon } from "lucide-react";
import { StageChangeDialog, stageActionLabel } from "@/components/applications/stage-change-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Stage } from "@/generated/prisma/enums";

/**
 * Compact "Move" menu for board cards. Only valid next stages are offered, and every
 * move goes through the same confirm-and-note dialog as the detail page.
 */
export function StageMoveMenu({
  applicationId,
  company,
  nextStages,
  activeCount,
}: {
  applicationId: string;
  company: string;
  nextStages: readonly Stage[];
  activeCount: number;
}) {
  const [target, setTarget] = useState<Stage | null>(null);
  if (nextStages.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="xs" aria-label={`Move ${company} to another stage`}>
            Move
            <ChevronDownIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{company}</DropdownMenuLabel>
          {nextStages.map((stage) => (
            <DropdownMenuItem key={stage} onSelect={() => setTarget(stage)}>
              <ArrowRightIcon aria-hidden />
              {stageActionLabel(stage)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <StageChangeDialog
        applicationId={applicationId}
        company={company}
        target={target}
        activeCount={activeCount}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
