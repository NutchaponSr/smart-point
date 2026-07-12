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
    <RewardContent rewards={initialRewards} hasNextPage={hasNextPage} onLoad={onLoad} />
  );
};