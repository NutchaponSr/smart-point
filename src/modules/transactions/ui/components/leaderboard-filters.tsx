"use client";

import { ChevronDownIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/accordion";
import { SearchInput } from "@/components/search-input";

import {
  periodValues,
  useLeaderboardFilters,
} from "@/modules/transactions/stores/use-leaderboard-filters";

const LIMIT_OPTIONS = ["10", "25", "50", "100"] as const;

const PERIOD_LABELS: Record<(typeof periodValues)[number], string> = {
  "24hr": "24 ชั่วโมง",
  "7d": "7 วัน",
  "30d": "30 วัน",
  fullTime: "ทั้งหมด",
};

export const LeaderboardFilters = () => {
  const [filters, setFilters] = useLeaderboardFilters();

  return (
    <section
      aria-label="ตัวกรอง"
      className="grid divide-y-2 divide-solid divide-border overflow-y-auto rounded-md border-2 bg-background"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <h2 className="text-base font-bold leading-snug">ตัวกรอง</h2>
      </header>

      <div className="p-4">
        <SearchInput
          value={filters.q}
          placeholder="ค้นหาพนักงาน"
          onChange={(q) => setFilters({ ...filters, q })}
        />
      </div>

      <Accordion title="ช่วงเวลา">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="w-full justify-between">
              {PERIOD_LABELS[filters.period]}
              <ChevronDownIcon className="size-4.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={filters.period}
                onValueChange={(period) => {
                  if (!periodValues.includes(period as (typeof periodValues)[number])) {
                    return;
                  }
                  setFilters({
                    ...filters,
                    period: period as (typeof periodValues)[number],
                  });
                }}
              >
                {periodValues.map((period) => (
                  <DropdownMenuRadioItem key={period} value={period}>
                    {PERIOD_LABELS[period]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Accordion>

      <Accordion title="จำนวนรายการ">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="w-full justify-between">
              {filters.limit}
              <ChevronDownIcon className="size-4.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={filters.limit.toString()}
                onValueChange={(limit) => {
                  setFilters({ ...filters, limit: parseInt(limit) });
                }}
              >
                {LIMIT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {option}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Accordion>
    </section>
  );
};
