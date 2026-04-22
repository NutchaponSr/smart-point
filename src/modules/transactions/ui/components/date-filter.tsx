import { endOfDay, startOfDay } from "date-fns";
import { BsCalendar2Event } from "react-icons/bs";
import { type DateRange } from "react-day-picker";

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import { useTransactionFilters } from "@/modules/transactions/stores/use-transaction-filter";

export const DateFilter = ({ children }: { children: React.ReactNode }) => {
  const [filters, setFilters] = useTransactionFilters();

  const date: DateRange | undefined =
    filters.from || filters.to
      ? {
        from: filters.from ? new Date(filters.from) : undefined,
        to: filters.to ? new Date(filters.to) : undefined,
      }
      : undefined;

  const onSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      void setFilters({ ...filters, from: null, to: null, page: 0 });
      return;
    }
    const fromMs = startOfDay(range.from).getTime();
    const endDate = range.to ?? range.from;
    const toMs = endOfDay(endDate).getTime();
    void setFilters({
      ...filters,
      from: fromMs,
      to: toMs,
      page: 0,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={12} className="w-fit">
        <div className="flex items-center justify-end p-2 border-b-2 border-border border-dashed">
          <Button variant="ghost" size="sm" onClick={() => onSelect(undefined)}>
            Clear
          </Button>
        </div>
        <div className="p-2">
          <Calendar
            mode="range"
            defaultMonth={date?.from ?? new Date()}
            selected={date}
            onSelect={onSelect}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};