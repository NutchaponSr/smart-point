import { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { PurchasesView } from "@/modules/cart/ui/views/purchases-view";

import { loadPurchaseFilters } from "@/modules/cart/search-params";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const params = await loadPurchaseFilters(searchParams);

  prefetch(crpc.redemption.getMany.queryOptions({
    q: params.q,
    limit: params.limit,
    sort: params.sort,
    from: params.from,
    to: params.to,
    cursor: null,
  }));

  return (
    <HydrateClient>
      <PurchasesView />
    </HydrateClient>
  );
};

export default Page;
