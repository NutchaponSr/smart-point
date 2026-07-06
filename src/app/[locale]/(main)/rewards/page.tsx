import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { RewardView } from "@/modules/rewards/ui/views/reward-view";

const Page = () => {
  prefetch(crpc.reward.getRecommend.queryOptions());

  return (
    <HydrateClient>
      <RewardView />
    </HydrateClient>
  );
}

export default Page;