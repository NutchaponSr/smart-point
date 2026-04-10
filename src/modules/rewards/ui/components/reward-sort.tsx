import { Button } from "@/components/ui/button";

import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";

export const RewardSort = () => {
  const [filters, setFilters] = useRewardFilters();

  return (
    <div role="tablist" className="flex gap-3 overflow-x-auto">
      <Button 
        size="smRounded" 
        variant={filters.sort === "curated" ? "rounded" : "roundedOutline"} 
        onClick={() => setFilters({ sort: "curated" })}
      >
        คัดสรร
      </Button>
      <Button 
        size="smRounded" 
        variant={filters.sort === "trending" ? "rounded" : "roundedOutline"} 
        onClick={() => setFilters({ sort: "trending" })}
      >
        เป็นกระแส
      </Button>
      <Button 
        size="smRounded" 
        variant={filters.sort === "hot_and_new" ? "rounded" : "roundedOutline"} 
        onClick={() => setFilters({ sort: "hot_and_new" })}
      >
        ใหม่ล่าสุด
      </Button>
    </div>
  );
};