import { ApiOutputs } from "@convex/api";

import { Button } from "@/components/ui/button";

import { Reward } from "@/modules/rewards/ui/components/reward";

import { RewardSort } from "@/modules/rewards/ui/components/reward-sort";
import { RewardFilters } from "@/modules/rewards/ui/components/reward-filters";

import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";

import { generateSort } from "@/modules/rewards/utils";

interface Props {
  rewards: ApiOutputs["reward"]["getMany"]["page"];
  hasNextPage: boolean;
  onLoad: () => void;
}

export const RewardContent = ({ rewards, hasNextPage, onLoad }: Props) => {
  const [filters] = useRewardFilters();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-between gap-[.5rem] items-center flex-wrap">
        <h2 className="text-[20px] font-normal leading-[1.3]">
          {generateSort(filters.sort || "curated")}
        </h2>
        <RewardSort />
      </div>

      <div className="grid grid-cols-1 items-start gap-x-16 gap-y-8 lg:grid-cols-[1fr_3fr]">
        <RewardFilters />

        <div className="container">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {rewards.map((reward) => (
              <Reward key={reward._id} reward={reward} variant="card" />
            ))}
          </div>

          {hasNextPage && ( 
            <div className="mt-8 w-full text-center">
              <Button size="lg" variant="outline" onClick={onLoad}>
                ดูเพิ่มเติม
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};