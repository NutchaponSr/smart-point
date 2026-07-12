import { endOfDay, startOfDay } from "date-fns";
import { type DateRange } from "react-day-picker";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

type DateFilterProps = {
  children: React.ReactNode;
  from: number | null;
  to: number | null;
  onChange: (range: { from: number | null; to: number | null }) => void;
};

export const DateFilter = ({
  children,
  from,
  to,
  onChange,
}: DateFilterProps) => {
  const date: DateRange | undefined =
    from != null || to != null
      ? {
          from: from != null ? new Date(from) : undefined,
          to: to != null ? new Date(to) : undefined,
        }
      : undefined;

  const onSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      onChange({ from: null, to: null });
      return;
    }
    const fromMs = startOfDay(range.from).getTime();
    const endDate = range.to ?? range.from;
    const toMs = endOfDay(endDate).getTime();
    onChange({ from: fromMs, to: toMs });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={12} className="w-fit">
        <div className="flex items-center justify-end border-b-2 border-dashed border-border p-2">
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
