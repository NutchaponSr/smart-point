import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";

const SORT_OPTIONS = ["curated", "trending", "hot_and_new"] as const;

export const RewardSort = () => {
  const t = useTranslations("reward.sort");
  const [filters, setFilters] = useRewardFilters();

  return (
    <div role="tablist" className="flex gap-3 overflow-x-auto">
      {SORT_OPTIONS.map((sort) => (
        <Button
          key={sort}
          size="sm"
          variant={filters.sort === sort ? "default" : "ghost"}
          onClick={() => setFilters({ sort })}
          className={cn(filters.sort === sort && "text-[#1cb0f6]")}
        >
          {t(sort)}
        </Button>
      ))}
    </div>
  );
};
