import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { OverviewsView } from "@/modules/overviews/ui/views/overviews-view";

const Page = async () => {
  prefetch(crpc.wallet.getOne.queryOptions());

  return (
    <HydrateClient>
      <OverviewsView />
    </HydrateClient>
  );
}

export default Page;