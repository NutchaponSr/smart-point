import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { OverviewsView } from "@/modules/overviews/ui/views/overviews-view";

const Page = async () => {
  prefetch(crpc.wallet.getOne.queryOptions());
  prefetch(crpc.reward.getMany.queryOptions());
  prefetch(crpc.activity.count.queryOptions());

  return (
    <HydrateClient>
      <OverviewsView />
    </HydrateClient>
  );
}

export default Page;