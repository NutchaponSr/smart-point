import { format, startOfDay } from "date-fns";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { Accordion } from "@/components/accordion";
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
import { DateFilter } from "@/modules/transactions/ui/components/date-filter";
import {
  shippingStatuses,
  statuses,
  Status,
  type ShippingStatus,
} from "@/modules/rewards/constants";
import { useRedemptionAdminFilters } from "@/modules/redemptions/stores/use-redemption-admin-filters";

interface Props {
  total: number;
}

const LIMIT_OPTIONS = ["10", "25", "50", "100"] as const;
const SORT_OPTIONS = [
  { value: "purchase-date", label: "วันที่แลก" },
  { value: "recently-updated", label: "อัปเดตล่าสุด" },
] as const;
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

export const RedemptionShippingFilters = ({ total }: Props) => {
  const [filters, setFilters] = useRedemptionAdminFilters();

  const dateRangeLabel = formatDateRangeLabel(filters.from, filters.to);

  return (
    <section
      aria-label="ตัวกรองจัดส่งรางวัล"
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
          placeholder="ค้นหารางวัล, พนักงาน..."
          onChange={(q) => setFilters({ ...filters, q, page: 0 })}
        />
      </div>

      <div className="p-4">
        <SearchInput
          value={filters.by ?? ""}
          placeholder="รหัสพนักงาน"
          onChange={(by) =>
            setFilters({ ...filters, by: by.trim() === "" ? null : by, page: 0 })
          }
        />
      </div>

      <Accordion title="สถานะจัดส่ง">
        {Object.entries(shippingStatuses).map(([key, value]) => (
          <label
            key={key}
            className="inline-flex cursor-pointer items-center gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30"
          >
            <span className="relative inline-flex shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={
                  filters.shippingStatus?.includes(key as ShippingStatus) ??
                  false
                }
                onChange={(e) => {
                  const current = filters.shippingStatus ?? [];
                  if (e.target.checked) {
                    void setFilters({
                      ...filters,
                      shippingStatus: [...current, key as ShippingStatus],
                      page: 0,
                    });
                  } else {
                    const next = current.filter((s) => s !== key);
                    void setFilters({
                      ...filters,
                      shippingStatus: next.length > 0 ? next : null,
                      page: 0,
                    });
                  }
                }}
                className="peer size-[calc(1lh+0.125rem)] shrink-0 cursor-pointer appearance-none rounded-xs border-[1.5px] border-border bg-background text-base leading-snug checked:bg-pink disabled:cursor-not-allowed disabled:opacity-30"
              />
              <CheckIcon className="pointer-events-none absolute hidden size-4.5 text-accent-foreground peer-checked:block" />
            </span>
            <span className={value.color}>{value.label}</span>
          </label>
        ))}
      </Accordion>

      <Accordion title="สถานะการแลก">
        {Object.entries(statuses).map(([key, value]) => (
          <label
            key={key}
            className="inline-flex cursor-pointer items-center gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30"
          >
            <span className="relative inline-flex shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={filters.status?.includes(key as Status) ?? false}
                onChange={(e) => {
                  const current = filters.status ?? [];
                  if (e.target.checked) {
                    void setFilters({
                      ...filters,
                      status: [...current, key as Status],
                      page: 0,
                    });
                  } else {
                    const next = current.filter((s) => s !== key);
                    void setFilters({
                      ...filters,
                      status: next.length > 0 ? next : null,
                      page: 0,
                    });
                  }
                }}
                className="peer size-[calc(1lh+0.125rem)] shrink-0 cursor-pointer appearance-none rounded-xs border-[1.5px] border-border bg-background text-base leading-snug checked:bg-pink disabled:cursor-not-allowed disabled:opacity-30"
              />
              <CheckIcon className="pointer-events-none absolute hidden size-4.5 text-accent-foreground peer-checked:block" />
            </span>
            {value}
          </label>
        ))}
      </Accordion>

      <Accordion title="เรียงลำดับ">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="w-full justify-between">
              {filters.sort === "recently-updated" ? "อัปเดตล่าสุด" : "วันที่แลก"}
              <ChevronDownIcon className="size-4.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={filters.sort}
                onValueChange={(sort) => {
                  if (sort !== "recently-updated" && sort !== "purchase-date") {
                    return;
                  }
                  setFilters({ ...filters, sort, page: 0 });
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
