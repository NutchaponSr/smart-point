import { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { loadTransactionFilters } from "@/modules/transactions/search-params";
import { TransactionView } from "@/modules/transactions/ui/views/transaction-view";

type Props = {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: Props) => {
  const params = await loadTransactionFilters(searchParams);

  prefetch(crpc.wallet.getOne.queryOptions());
  prefetch(
    crpc.transaction.getMany.queryOptions({
      q: params.q,
      self: true,
      limit: params.limit,
      cursor: null,
      status: params.status,
      min: params.min,
      max: params.max,
      from: params.from,
      to: params.to,
      view: params.view,
      by: params.by,
    })
  );

  return (
    <HydrateClient>
      <TransactionView />
    </HydrateClient>
  );
};

export default Page;