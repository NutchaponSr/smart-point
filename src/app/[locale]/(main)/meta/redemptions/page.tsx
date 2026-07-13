import type { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";
import { loadRedemptionAdminFilters } from "@/modules/redemptions/search-params";
import { RedemptionShippingView } from "@/modules/redemptions/ui/views/redemption-shipping-view";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const filters = await loadRedemptionAdminFilters(searchParams);

  prefetch(
    crpc.redemption.getManyAdmin.queryOptions({
      q: filters.q,
      shippingStatus: filters.shippingStatus,
      status: filters.status,
      sort: filters.sort,
      from: filters.from ?? null,
      to: filters.to ?? null,
      by: filters.by ?? null,
      limit: filters.limit,
      cursor: null,
    }),
  );

  return (
    <HydrateClient>
      <RedemptionShippingView />
    </HydrateClient>
  );
};

export default Page;
