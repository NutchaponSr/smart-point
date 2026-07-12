import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { Status, statuses } from "@/modules/transactions/constants";
import {
  useTransactionFilters,
} from "@/modules/transactions/stores/use-transaction-filter";
import { Accordion } from "@/components/accordion";
import { CostFilter } from "@/components/cost-filter";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateFilter } from "./date-filter";
import { format, startOfDay } from "date-fns";

interface Props {
  total: number;
}

const LIMIT_OPTIONS = ["10", "25", "50", "100"] as const;
const DATE_LABEL_PATTERN = "dd/MM/yyyy";

const formatDateRangeLabel = (from: number | null, to: number | null): string => {
  if (from == null) return "ช่วงเวลา";

  const fromDate = new Date(from);
  const toDate = to != null ? new Date(to) : fromDate;
  const isSameDay =
    startOfDay(fromDate).getTime() === startOfDay(toDate).getTime();

  if (isSameDay) return format(fromDate, DATE_LABEL_PATTERN);
  return `${format(fromDate, DATE_LABEL_PATTERN)} – ${format(toDate, DATE_LABEL_PATTERN)}`;
};

export const TransactionFilters = ({ total }: Props) => {
  const [filters, setFilters] = useTransactionFilters();

  const onChange = (key: keyof typeof filters, value: unknown) => {
    setFilters({ ...filters, [key]: value });
  }

  const dateRangeLabel = formatDateRangeLabel(filters.from, filters.to);

  return (
    <div className="grid divide-y-2 divide-solid divide-border rounded-md border-2 border-border bg-background overflow-y-auto lg:sticky lg:inset-y-4 lg:max-h-[calc(100vh-2rem)]">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="grow font-bold">แสดง 1-{total} จาก {total} รายการ</div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <SearchInput 
          value={filters.q}
          placeholder="Search transactions"
          onChange={(q) => onChange("q", q)}
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
                  const currentStatus = filters.status || [];
                  if (e.target.checked) {
                    void setFilters({
                      ...filters,
                      status: [...currentStatus, key as Status],
                      page: 0,
                    });
                  } else {
                    const newStatus = currentStatus.filter(s => s !== key);
                    void setFilters({
                      ...filters,
                      status: newStatus.length > 0 ? newStatus : null,
                      page: 0,
                    });
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
          onMinCostChange={(minCost) => onChange("min", minCost)}
          onMaxCostChange={(maxCost) => onChange("max", maxCost)}
        />
      </Accordion>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <DateFilter
          from={filters.from}
          to={filters.to}
          onChange={({ from, to }) =>
            void setFilters({ ...filters, from, to, page: 0 })
          }
        >
          <button type="button" className="flex w-full text-start hover:underline">
            {dateRangeLabel}
          </button>
        </DateFilter>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <fieldset className="flex flex-col border-none gap-2 grow basis-0">
          <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
            <label className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 filter-header">
              จำนวนรายการ
            </label>
          </legend>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" className="justify-between">
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
        </fieldset>
      </div>
    </div>
  );
};