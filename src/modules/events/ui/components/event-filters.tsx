import { SearchInput } from "@/components/search-input";

import { useEventFilters } from "../../stores/use-event-filters";
import { Accordion } from "@/components/accordion";
import { CostFilter } from "@/components/cost-filter";
import { CheckIcon } from "lucide-react";

export const EventFilters = () => {
  const [filters, setFilters] = useEventFilters();

  const onChange = (key: keyof typeof filters, value: unknown) => {
    setFilters({ ...filters, [key]: value });
  }

  return (
    <div className="grid divide-y-2 divide-solid divide-border rounded-xs border-2 border-border bg-background overflow-y-auto lg:sticky lg:inset-y-4 lg:max-h-[calc(100vh-2rem)] select-none">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="grow">Showing 1-10 of 10 activities</div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <SearchInput 
          value={filters.q}
          placeholder="Search activities"
          onChange={(q) => onChange("q", q)}
        />
      </div>
      <Accordion title="จำนวนผู้เข้าร่วม">
        <CostFilter 
          decimalScale={0}
          minCost={filters.minParticipants}
          maxCost={filters.maxParticipants}
          onMinCostChange={(minParticipants) => onChange("minParticipants", minParticipants)}
          onMaxCostChange={(maxParticipants) => onChange("maxParticipants", maxParticipants)}
        />
      </Accordion>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <fieldset className="flex flex-col border-none gap-2 grow basis-0">
          <label className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 justify-between">
            แสดงเข้าร่วมแล้วเท่านั้น
            <span className="relative inline-flex shrink-0 items-center justify-center">
              <input 
                type="checkbox"
                checked={filters.isJoined}
                onChange={(e) => onChange("isJoined", e.target.checked)}
                className="appearance-none size-[calc(1lh+0.125rem)] border-[1.5px] border-border bg-background text-base leading-snug shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 checked:bg-pink rounded-xs peer"
              />
              <CheckIcon className="pointer-events-none absolute hidden size-4.5 text-accent-foreground peer-checked:block group-open" />
            </span>
          </label>
        </fieldset>
      </div>
    </div>
  );
}