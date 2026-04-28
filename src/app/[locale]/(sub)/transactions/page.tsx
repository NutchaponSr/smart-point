import { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { loadTransactionFilters } from "@/modules/transactions/search-params";
import { TransactionView } from "@/modules/transactions/ui/views/transaction-view";

type Props = {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: Props) => {
  const { q, status, min, max, from, to, limit, page, view } =
    await loadTransactionFilters(searchParams);

  prefetch(crpc.wallet.getOne.queryOptions());
  prefetch(
    crpc.transaction.getHistory.queryOptions({
      limit,
      query: q,
      status: status ?? undefined,
      min,
      max,
      from: from ?? undefined,
      to: to ?? undefined,
      cursor: page * limit,
      view,
    })
  );

  return (
    <HydrateClient>
      <TransactionView />
    </HydrateClient>
  );
};

export default Page;