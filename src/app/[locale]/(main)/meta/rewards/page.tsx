import { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";
import { loadRewardFilters } from "@/modules/rewards/search-params";
import { RewardAnalyticView } from "@/modules/rewards/ui/views/reward-analytic-view";

interface Props {
  searchParams: Promise<SearchParams>
}

const Page = async ({ searchParams }: Props) => {
  const params = await loadRewardFilters(searchParams);

  prefetch(crpc.reward.getList.queryOptions({
    limit: params.limit,
    cursor: null,
    q: params.q,
    minCost: params.minCost,
    maxCost: params.maxCost,
    star: params.star,
  }))

  return (
    <HydrateClient>
      <RewardAnalyticView />
    </HydrateClient>
  )
}

export default Page;