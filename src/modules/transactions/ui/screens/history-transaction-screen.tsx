import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { Sort } from "@/components/sort";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";

import { columns } from "@/modules/transactions/ui/components/transaction-columns";
import { TransactionFilters } from "@/modules/transactions/ui/components/transaction-filters";

import { useTransactionFilters } from "@/modules/transactions/stores/use-transaction-filter";

const SORTS = ["sent", "received"] as const;

export const HistoryTransactionScreen = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useTransactionFilters();

  const debouncedQuery = useDebounce(filters.q, 400);
  
  const { 
    requestCursor, 
    canGoBack, 
    goBack, 
    goForward,
  } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange: (page) => setFilters({ ...filters, page }),
  });

  const { data: transactions } = useSuspenseQuery(crpc.transaction.getMany.queryOptions({
    q: debouncedQuery,
    cursor: requestCursor,
    self: true,
    limit: filters.limit,
    status: filters.status,
    min: filters.min,
    max: filters.max,
    from: filters.from,
    to: filters.to,
    view: filters.view,
    by: filters.by,
  }));

  const canGoForward = transactions.hasNextPage && transactions.continueCursor != null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl">ประวัติธุรกรรม</h2>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_4fr]">
        <TransactionFilters total={transactions.page.length} />
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 grow">
              <Pagination
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onBack={goBack}
                onForward={() => {
                  const c = transactions.continueCursor;
                  if (c != null) goForward(c);
                }}
              />
            </div>

            <Sort
              activeValue={filters.view}
              values={SORTS}
              onChange={(value) => setFilters({ ...filters, view: value as "sent" | "received" })}
            />
          </div>
          
          <DataTable data={transactions.page} columns={columns({ view: filters.view })} />
        </div>
      </div>
    </section>
  );
};