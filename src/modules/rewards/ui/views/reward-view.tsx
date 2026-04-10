"use client";

import { HiShoppingBag } from "react-icons/hi2";
import { useInfiniteQuery } from "better-convex/react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { SearchInput } from "@/components/search-input";

import { RewardScreen } from "@/modules/rewards/ui/screens/reward-screen";

import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";

export const RewardView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useRewardFilters();

  const { data: recommends } = useSuspenseQuery(crpc.reward.getRecommend.queryOptions());
  const { data: rewards, fetchNextPage, hasNextPage } = useInfiniteQuery(crpc.reward.getMany.infiniteQueryOptions({
    ...filters,
  }));

  return (
    <>
      <header className="relative z-20 border-t-0 border-b-2 border-border bg-body px-4 py-8 lg:ps-16 lg:pe-16">
        <div className="flex flex-col gap-4">
          <div className="flex w-full items-center gap-4">
            <SearchInput value={filters.q} onChange={(q) => setFilters({ ...filters, q })} placeholder="ค้นหา" />
            <Button variant="elevated" size="lg" className="hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <HiShoppingBag className="size-6" />
              รถเข็น
            </Button>
          </div>
        </div>
      </header>

      <RewardScreen 
        initialRecommends={recommends} 
        initialRewards={rewards} 
        onLoad={() => fetchNextPage()}
        hasNextPage={hasNextPage}
      />
    </>
  );
};