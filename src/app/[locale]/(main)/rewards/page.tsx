import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { RewardView } from "@/modules/rewards/ui/views/reward-view";

const Page = () => {
  prefetch(crpc.wallet.getOne.queryOptions());
  prefetch(crpc.reward.getRecommend.queryOptions());

  return (
    <HydrateClient>
      <div className="mx-auto max-w-[1058px] pt-6 w-full">
        <RewardView />
      </div>
    </HydrateClient>
  );
};

export default Page;
