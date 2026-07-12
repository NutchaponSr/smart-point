import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";

export const RewardSort = () => {
  const [filters, setFilters] = useRewardFilters();

  return (
    <div role="tablist" className="flex gap-3 overflow-x-auto">
      <Button 
        size="sm" 
        variant={filters.sort === "curated" ? "default" : "ghost"} 
        onClick={() => setFilters({ sort: "curated" })}
        className={cn(filters.sort === "curated" && "text-[#1cb0f6]")}
      >
        คัดสรร
      </Button>
      <Button 
        size="sm" 
        variant={filters.sort === "trending" ? "default" : "ghost"} 
        onClick={() => setFilters({ sort: "trending" })}
        className={cn(filters.sort === "trending" && "text-[#1cb0f6]")}
      >
        เป็นกระแส
      </Button>
      <Button 
        size="sm" 
        variant={filters.sort === "hot_and_new" ? "default" : "ghost"} 
        onClick={() => setFilters({ sort: "hot_and_new" })}
        className={cn(filters.sort === "hot_and_new" && "text-[#1cb0f6]")}
      >
        ใหม่ล่าสุด
      </Button>
    </div>
  );
};