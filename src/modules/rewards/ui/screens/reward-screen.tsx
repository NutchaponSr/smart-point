import { ApiOutputs } from "@convex/api";

import { RewardContent } from "@/modules/rewards/ui/components/reward-content";

interface Props {
  hasNextPage: boolean;
  initialRecommends: ApiOutputs["reward"]["getRecommend"];
  initialRewards: ApiOutputs["reward"]["getMany"]["page"];
  onLoad: () => void;
}

export const RewardScreen = ({ hasNextPage, initialRecommends, initialRewards, onLoad }: Props) => {
  return (
    <div className="grid gap-16! px-4 py-16 lg:ps-16 lg:pe-16">
      <RewardContent rewards={initialRewards} hasNextPage={hasNextPage} onLoad={onLoad} />
    </div>
  );
};