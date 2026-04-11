import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { PurchasesView } from "@/modules/cart/ui/views/purchases-view";


const Page = () => {
  prefetch(crpc.redemption.getMany.queryOptions());

  return (
    <HydrateClient>
      <PurchasesView />
    </HydrateClient>
  );
};

export default Page;
