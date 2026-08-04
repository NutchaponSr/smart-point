"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

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

import { pickLocalized } from "@/lib/i18n/localized";

import { divisions } from "@/modules/employee/constants";
import {
  periodValues,
  useLeaderboardFilters,
} from "@/modules/transactions/stores/use-leaderboard-filters";

const LIMIT_OPTIONS = ["10", "25", "50", "100"] as const;

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
  const t = useTranslations("leaderboard.filters");
  const locale = useLocale();
  const [filters, setFilters] = useLeaderboardFilters();

  const periodLabel = (period: (typeof periodValues)[number]) =>
    t(`period-${period}`);

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
      aria-label={t("aria-label")}
      className="grid divide-y-2 divide-solid divide-border overflow-y-auto rounded-md border-2 bg-background"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <h2 className="text-base font-bold leading-snug">{t("title")}</h2>
        {hasActiveFilters && (
          <div className="grow text-right">
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={onClear}
            >
              {t("reset")}
            </button>
          </div>
        )}
      </header>

      <div className="p-4">
        <SearchInput
          value={filters.q}
          placeholder={t("search-placeholder")}
          onChange={(q) => setFilters({ ...filters, q })}
        />
      </div>

      <Accordion title={t("period")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="w-full justify-between">
              {periodLabel(filters.period)}
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
                    {periodLabel(period)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Accordion>

      <Accordion title={t("division")}>
        {divisions.map((division) => (
          <FilterOptionCheckbox
            key={division.slug}
            label={pickLocalized(division.name, locale)}
            checked={filters.division.includes(division.slug)}
            onCheckedChange={(checked) =>
              toggleDivision(division.slug, checked)
            }
          />
        ))}
      </Accordion>

      <Accordion title={t("limit")}>
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
