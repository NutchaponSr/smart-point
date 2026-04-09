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

import { useFilter } from "@/modules/transactions/stores/use-filter";

export const DateFilter = () => {
  const { from, to, setFrom, setTo } = useFilter();

  const date: DateRange | undefined =
    from || to
      ? {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      }
      : undefined;

  const onSelect = (range: DateRange | undefined) => {
    setFrom(range?.from ? startOfDay(range.from).getTime() : null);
    setTo(range?.to ? endOfDay(range.to).getTime() : null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="elevated" size="iconLg">
          <BsCalendar2Event className="size-5 stroke-[0.25]" />
        </Button>
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