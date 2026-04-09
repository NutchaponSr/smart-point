import { 
  CheckIcon, 
  ChevronRightIcon, 
  ListFilterIcon 
} from "lucide-react";
import { CurrencyInput } from "react-currency-input-field";

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { Status, statuses } from "@/modules/transactions/constants";
import { useFilter } from "@/modules/transactions/stores/use-filter";

export const TransactionFilter = () => {
  const { status, setStatus, min, setMin, max, setMax } = useFilter();

  const hasFilter = (status?.length && status.length > 0) || (min !== undefined && min > 0) || (max !== undefined && max > 0);

  const onClear = () => {
    setStatus(null);
    setMin(0);
    setMax(0);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="elevated" size="iconLg">
          <ListFilterIcon className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={12}>
        {hasFilter && (
          <div className="flex items-center justify-end p-2 border-b-2 border-border border-dashed">
            <Button variant="ghost" size="xs" onClick={onClear}>
              Clear
            </Button>
          </div>
        )}

        <div className="grid divide-y divide-solid divide-border rounded-xs bg-background overflow-y-auto">
          <details className="group/details flex-wrap items-center justify-between gap-4 p-4 block">
            <summary className="flex cursor-pointer items-center [&::-webkit-details-marker]:hidden [&::marker]:hidden grow group-open/details:mb-2">
              สถานะ
              <ChevronRightIcon className="col-start-2 ml-auto size-4.5 shrink-0 group-open/details:rotate-90" />
            </summary>
            <fieldset className="flex flex-col border-none gap-2 grow basis-0">
              {Object.entries(statuses).map(([key, value]) => (
                <label key={key} className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 items-center">
                  <span className="relative inline-flex shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={status?.includes(key as Status) ?? false}
                      onChange={(e) => {
                        const currentStatus = status || [];
                        if (e.target.checked) {
                          setStatus([...currentStatus, key as Status]);
                        } else {
                          const newStatus = currentStatus.filter(s => s !== key);
                          setStatus(newStatus.length > 0 ? newStatus : null);
                        }
                      }}
                      className="appearance-none size-[calc(1lh+0.125rem)] border-[1.5px] border-border bg-background text-base leading-snug shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 checked:bg-pink rounded-xs peer"
                    />
                    <CheckIcon className="pointer-events-none absolute hidden size-4.5 text-accent-foreground peer-checked:block group-open" />
                  </span>
                  {value}
                </label>
              ))}
            </fieldset>
          </details>
          <details className="group/details flex-wrap items-center justify-between gap-4 p-4 block border-t-[1.5px]">
            <summary className="flex cursor-pointer items-center [&::-webkit-details-marker]:hidden [&::marker]:hidden grow group-open/details:mb-2">
              จำนวนพอยนต์
              <ChevronRightIcon className="col-start-2 ml-auto size-4.5 shrink-0 group-open/details:rotate-90" />
            </summary>
            <div className="grid gap-3">
              <fieldset className="flex flex-col border-none gap-2">
                <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
                  <label className="inline-flex cursor-pointer text-sm gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 items-center">ขั้นต่ำ</label>
                </legend>
                <CurrencyInput
                  id="min-amount"
                  name="min-amount"
                  allowNegativeValue={false}
                  placeholder="ระบุจำนวน"
                  decimalScale={2}
                  value={min}
                  onValueChange={(val) => setMin(val ? parseFloat(val) : 0)}
                  className="font-[inherit] min-h-10 px-4 text-sm leading-snug border-2 border-border rounded-xs block w-full bg-background placeholder:text-muted-foreground focus:outline-1 focus:outline-purple focus:border-purple focus:border-2 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-3"
                />
              </fieldset>
              <fieldset className="flex flex-col border-none gap-2">
                <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
                  <label className="inline-flex cursor-pointer text-sm gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 items-center">สูงสุด</label>
                </legend>
                <CurrencyInput
                  id="max-amount"
                  name="max-amount"
                  allowNegativeValue={false}
                  placeholder="ระบุจำนวน"
                  decimalScale={2}
                  value={max}
                  onValueChange={(val) => setMax(val ? parseFloat(val) : 0)}
                  className="font-[inherit] min-h-10 px-4 text-sm leading-snug border-2 border-border rounded-xs block w-full bg-background placeholder:text-muted-foreground focus:outline-1 focus:outline-purple focus:border-purple focus:border-2 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-3"
                />
              </fieldset>
            </div>
          </details>
        </div>
      </PopoverContent>
    </Popover>
  );
}