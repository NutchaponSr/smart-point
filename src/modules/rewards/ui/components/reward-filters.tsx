"use client";

import { ListFilterIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Accordion } from "@/components/accordion";
import { CostFilter } from "@/components/cost-filter";
import { StarFilter } from "@/components/star-filter";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";

type RewardFiltersProps =
  | { variant?: "default" }
  | {
      variant: "popover";
      align?: ComponentProps<typeof PopoverContent>["align"];
      sideOffset?: ComponentProps<typeof PopoverContent>["sideOffset"];
      popoverContentClassName?: string;
    };

export const RewardFilters = (props: RewardFiltersProps) => {
  const [filters, setFilters] = useRewardFilters();

  const onChange = (key: keyof typeof filters, value: unknown) => {
    setFilters({ ...filters, [key]: value });
  };

  const onClear = () => {
    setFilters({
      minCost: 0,
      maxCost: 0,
      star: 0,
    });
  };

  const hasActiveFilters =
    filters.minCost > 0 || filters.maxCost > 0 || filters.star > 0;

  const body = (
    <>
      <header
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 p-4",
        )}
      >
        ตัวกรอง
        {hasActiveFilters && (
          <div className="grow text-right">
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={onClear}
            >
              รีเซ็ต
            </button>
          </div>
        )}
      </header>
      <Accordion title="ราคา">
        <CostFilter
          minCost={filters.minCost}
          maxCost={filters.maxCost}
          onMinCostChange={(minCost) => onChange("minCost", minCost)}
          onMaxCostChange={(maxCost) => onChange("maxCost", maxCost)}
        />
      </Accordion>
      <Accordion title="เรตติ้ง">
        <StarFilter
          star={filters.star}
          onStarChange={(star) => onChange("star", star)}
        />
      </Accordion>
    </>
  );

  if (props.variant === "popover") {
    const { variant: _v, align, sideOffset, popoverContentClassName } = props;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="elevated" size="iconLg">
            <ListFilterIcon className="size-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          sideOffset={sideOffset}
          className={cn("divide-y-2 divide-solid divide-border p-0", popoverContentClassName)}
        >
          {body}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <section
      aria-label="ตัวกรอง"
      className="grid max-h-[calc(100vh-2rem)] divide-y-2 divide-solid divide-border overflow-y-auto rounded-xs border-2 border-border bg-background lg:sticky lg:inset-y-4"
    >
      {body}
    </section>
  );
};
