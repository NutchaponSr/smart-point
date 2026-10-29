"use client";

import { format, startOfDay } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

import { Accordion } from "@/components/accordion";
import { CostFilter } from "@/components/cost-filter";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDonationAdminFilters } from "@/modules/donations/stores/use-donation-admin-filters";
import { DateFilter } from "@/modules/transactions/ui/components/date-filter";

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

export const DonationFilters = ({ total }: Props) => {
  const [filters, setFilters] = useDonationAdminFilters();
  const dateRangeLabel = formatDateRangeLabel(filters.from, filters.to);

  return (
    <section
      aria-label="ตัวกรองบริจาค"
      className="grid divide-y-2 divide-solid divide-border overflow-y-auto rounded-md border-2 bg-background lg:sticky lg:inset-y-4 lg:max-h-[calc(100vh-2rem)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <h2 className="text-base font-bold leading-snug">
          แสดง {total} รายการ
        </h2>
      </header>

      <div className="p-4">
        <SearchInput
          value={filters.q}
          placeholder="ค้นหาชื่อหรือรหัสพนักงาน..."
          onChange={(q) => setFilters({ ...filters, q, page: 0 })}
        />
      </div>

      <Accordion title="จำนวนพอยต์">
        <CostFilter
          minCost={filters.min}
          maxCost={filters.max}
          decimalScale={0}
          onMinCostChange={(min) =>
            setFilters({ ...filters, min: min ?? 0, page: 0 })
          }
          onMaxCostChange={(max) =>
            setFilters({ ...filters, max: max ?? 0, page: 0 })
          }
        />
      </Accordion>

      <div className="p-4">
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
                  setFilters({ ...filters, limit: parseInt(limit), page: 0 });
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
