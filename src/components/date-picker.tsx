import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

type DatePickerProps = {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  showClear?: boolean;
} & (
  | {
    output?: "date";
    value?: Date;
    onSelect: (date: Date) => void;
  }
  | {
    output: "number";
    value?: number;
    onSelect: (timestamp: number) => void;
  }
);

export const DatePicker = (props: DatePickerProps) => {
  const {
    children,
    align = "end",
    showClear = true,
  } = props;

  const selectedDate =
    props.output === "number"
      ? (props.value ? new Date(props.value) : undefined)
      : props.value;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent align={align} sideOffset={12} className="w-fit">
        <div className="p-2">
          <Calendar
            mode="single"
            defaultMonth={selectedDate ?? new Date()}
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              if (props.output === "number") {
                props.onSelect(date.getTime());
                return;
              }
              props.onSelect(date);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};