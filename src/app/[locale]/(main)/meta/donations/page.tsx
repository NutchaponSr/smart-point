import type { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";
import { loadDonationAdminFilters } from "@/modules/donations/search-params";
import { DonationAdminView } from "@/modules/donations/ui/views/donation-admin-view";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const filters = await loadDonationAdminFilters(searchParams);

  prefetch(
    crpc.donation.getManyAdmin.queryOptions({
      q: filters.q,
      min: filters.min,
      max: filters.max,
      from: filters.from ?? null,
      to: filters.to ?? null,
      limit: filters.limit,
      cursor: null,
    }),
  );

  return (
    <HydrateClient>
      <DonationAdminView />
    </HydrateClient>
  );
};

export default Page;
