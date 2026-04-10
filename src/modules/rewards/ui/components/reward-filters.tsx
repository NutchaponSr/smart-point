import { Accordion } from "@/components/accordion";
import { CostFilter } from "@/components/cost-filter";

import { StarFilter } from "@/components/star-filter";

import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";

export const RewardFilters = () => {
  const [filters, setFilters] = useRewardFilters();

  const onChange = (key: keyof typeof filters, value: unknown) => {
    setFilters({ ...filters, [key]: value });
  }

  const onClear = () => {
    setFilters({
      minCost: 0,
      maxCost: 0,
      star: 0,
    });
  }

  return (
    <div aria-label="Filter" className="grid divide-y divide-solid divide-border rounded-xs border-2 border-border bg-background overflow-y-auto lg:sticky lg:inset-y-4 lg:max-h-[calc(100vh-2rem)]">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        ตัวกรอง
        {(filters.minCost > 0 || filters.maxCost > 0 || filters.star > 0) && (
          <div className="grow text-right">
            <button className="cursor-pointer underline" onClick={onClear}>
              รีเซ็ต
            </button>
          </div>
        )}
      </header>
      <Accordion title="ราคา">
        <CostFilter 
          minCost={filters.minCost}
          maxCost={filters.maxCost}
          onMinCostChange={(minCost) => onChange("minCost", minCost)}
          onMaxCostChange={(maxCost) => onChange("maxCost", maxCost)}
        />
      </Accordion>
      <Accordion title="เรตติ้ง">
        <StarFilter 
          star={filters.star}
          onStarChange={(star) => onChange("star", star)}
        />
      </Accordion>
    </div>
  );
}