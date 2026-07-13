"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";

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

import { divisions } from "@/modules/employee/constants";
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

const checkboxClassName =
  "appearance-none size-[calc(1lh+0.125rem)] border-[1.5px] border-border bg-background text-base leading-snug shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 checked:bg-[#58cc02] rounded-xs peer";

const labelClassName =
  "inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 items-center";

type FilterOptionCheckboxProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

const FilterOptionCheckbox = ({
  label,
  checked,
  onCheckedChange,
}: FilterOptionCheckboxProps) => (
  <label className={labelClassName}>
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className={checkboxClassName}
      />
      <CheckIcon className="pointer-events-none absolute hidden size-4.5 text-white peer-checked:block" />
    </span>
    {label}
  </label>
);

export const LeaderboardFilters = () => {
  const [filters, setFilters] = useLeaderboardFilters();

  const toggleDivision = (value: string, checked: boolean) => {
    const current = filters.division ?? [];
    const next = checked
      ? [...current, value]
      : current.filter((item) => item !== value);

    void setFilters({
      ...filters,
      division: next,
      page: 1,
    });
  };

  const onClear = () => {
    void setFilters({
      ...filters,
      division: [],
      page: 1,
    });
  };

  const hasActiveFilters = filters.division.length > 0;

  return (
    <section
      aria-label="ตัวกรอง"
      className="grid divide-y-2 divide-solid divide-border overflow-y-auto rounded-md border-2 bg-background"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <h2 className="text-base font-bold leading-snug">ตัวกรอง</h2>
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

      <Accordion title="BU / สังกัด">
        {divisions.map((division) => (
          <FilterOptionCheckbox
            key={division.slug}
            label={division.name.th}
            checked={filters.division.includes(division.slug)}
            onCheckedChange={(checked) =>
              toggleDivision(division.slug, checked)
            }
          />
        ))}
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
