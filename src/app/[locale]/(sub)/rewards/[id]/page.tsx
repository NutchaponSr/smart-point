import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { RewardInfoView } from "@/modules/rewards/ui/views/reward-info-view";

interface Props {
  params: Promise<{ id: string }>;
}

const Page = async ({ params }: Props) => {
  const { id } = await params;

  prefetch(crpc.reward.getOne.queryOptions({ rewardId: id }));

  return (
    <HydrateClient>
      <RewardInfoView rewardId={id} />
    </HydrateClient>
  );
};

export default Page;