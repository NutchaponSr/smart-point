import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { Status, statuses } from "@/modules/transactions/constants";
import {
  useAnalyticTransactionFilters,
  useTransactionFilters,
} from "@/modules/transactions/stores/use-transaction-filter";
import { Accordion } from "@/components/accordion";
import { CostFilter } from "@/components/cost-filter";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateFilter } from "./date-filter";
import { format, startOfDay } from "date-fns";

type TransactionFilterState = ReturnType<typeof useTransactionFilters>[0];
type TransactionFilterSetter = ReturnType<typeof useTransactionFilters>[1];
type AnalyticTransactionFilterState = ReturnType<
  typeof useAnalyticTransactionFilters
>[0];
type AnalyticTransactionFilterSetter = ReturnType<
  typeof useAnalyticTransactionFilters
>[1];

type StandardFilterProps = {
  filters: TransactionFilterState;
  onChange: TransactionFilterSetter;
};

type AnalyticFilterProps = {
  filters: AnalyticTransactionFilterState;
  onChange: AnalyticTransactionFilterSetter;
};

interface Props {
  total: number;
}

type TransactionFiltersProps = Props & (StandardFilterProps | AnalyticFilterProps);
const LIMIT_OPTIONS = ["10", "25", "50", "100"] as const;

export const TransactionFilters = ({ total, filters, onChange }: TransactionFiltersProps) => {
  const setPageZeroWithPatch = (patch: Partial<typeof filters>) => {
    void onChange({
      ...filters,
      ...patch,
      page: 0,
    });
  };

  const onCostChange = (key: "min" | "max", value: number | null) => {
    setPageZeroWithPatch({ [key]: value ?? 0 } as Partial<typeof filters>);
  };

  const isDateFilterEnabled = "from" in filters;

  const dateRangeLabel = (() => {
    if (!isDateFilterEnabled || filters.from == null) return "ช่วงเวลา";
    const fromD = new Date(filters.from);
    const toD = filters.to != null ? new Date(filters.to) : fromD;
    const sameDay =
      startOfDay(fromD).getTime() === startOfDay(toD).getTime();
    const pattern = "dd/MM/yyyy";
    if (sameDay) return format(fromD, pattern);
    return `${format(fromD, pattern)} – ${format(toD, pattern)}`;
  })();

  return (
    <div className="grid divide-y-2 divide-solid divide-border rounded-xs border-2 border-border bg-background overflow-y-auto lg:sticky lg:inset-y-4 lg:max-h-[calc(100vh-2rem)]">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="grow">แสดง 1-{total} จาก {total} รายการ</div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <SearchInput 
          value={filters.q}
          placeholder="Search transactions"
          onChange={(q) => setPageZeroWithPatch({ q })}
        />
      </div>
      <Accordion title="สถานะ">
        {Object.entries(statuses).map(([key, value]) => (
          <label key={key} className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 items-center">
            <span className="relative inline-flex shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={filters.status?.includes(key as Status) ?? false}
                onChange={(e) => {
                  const currentStatus = filters.status ?? [];
                  if (e.target.checked) {
                    setPageZeroWithPatch({
                      status: [...currentStatus, key as Status],
                    } as Partial<typeof filters>);
                  } else {
                    const newStatus = currentStatus.filter(s => s !== key);
                    setPageZeroWithPatch({
                      status: newStatus.length > 0 ? newStatus : null,
                    } as Partial<typeof filters>);
                  }
                }}
                className="appearance-none size-[calc(1lh+0.125rem)] border-[1.5px] border-border bg-background text-base leading-snug shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 checked:bg-pink rounded-xs peer"
              />
              <CheckIcon className="pointer-events-none absolute hidden size-4.5 text-accent-foreground peer-checked:block group-open" />
            </span>
            {value}
          </label>
        ))}
      </Accordion>
      <Accordion title="จำนวนพอยต์">
        <CostFilter
          minCost={filters.min}
          maxCost={filters.max}
          onMinCostChange={(minCost) => onCostChange("min", minCost)}
          onMaxCostChange={(maxCost) => onCostChange("max", maxCost)}
        />
      </Accordion>
      {"from" in filters ? (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <DateFilter>
            <button type="button" className="hover:underline w-full text-start flex">
              {dateRangeLabel}
            </button>
          </DateFilter>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <fieldset className="flex flex-col border-none gap-2 grow basis-0">
          <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
            <label className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 filter-header">
              จำนวนรายการ
            </label>
          </legend>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="justify-between">
                {filters.limit} 
                <ChevronDownIcon className="size-4.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuRadioGroup
                  value={filters.limit.toString()}
                  onValueChange={(limit) => {
                    setPageZeroWithPatch({ limit: parseInt(limit, 10) });
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
        </fieldset>
      </div>
    </div>
  );
};