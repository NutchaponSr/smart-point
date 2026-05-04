import type { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";
import { loadTransactionFilters } from "@/modules/transactions/search-params";
import { TransactionAnalyticView } from "@/modules/transactions/ui/views/transaction-analytic-view";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const { limit, q, status, min, max, from, to } =
    await loadTransactionFilters(searchParams);

  prefetch(
    crpc.transaction.getMany.queryOptions({
      limit,
      q,
      status,
      min,
      max,
      from: from ?? null,
      to: to ?? null,
      cursor: null,
      self: false,
    }),
  );

  return (
    <HydrateClient>
      <TransactionAnalyticView />
    </HydrateClient>
  );
};

export default Page;
