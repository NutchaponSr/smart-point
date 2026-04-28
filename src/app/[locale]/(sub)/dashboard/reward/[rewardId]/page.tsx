import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";
import { EditRewardView } from "@/modules/rewards/ui/views/edit-reward-view";

interface Props {
  params: Promise<{ rewardId: string }>;
}

const Page = async ({ params }: Props) => {
  const { rewardId } = await params;

  prefetch(crpc.reward.getOne.queryOptions({ rewardId }));

  return (
    <HydrateClient>
      <EditRewardView rewardId={rewardId} />
    </HydrateClient>
  );
};

export default Page;
