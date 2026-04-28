"use client";

import {
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { InfoCard } from "@/components/info-card";
import { DataTable } from "@/components/data-table";

import { TransactionContent } from "@/modules/wallets/ui/components/transaction-content";
import { TransactionFilters } from "@/modules/transactions/ui/components/transaction-filters";
import { transactionColumns } from "@/modules/transactions/ui/components/transaction-columns";

import { useTransactionFilters } from "@/modules/transactions/stores/use-transaction-filter";
import { FeedTransactions } from "../components/feed-transactions";

const SORTS = ["sent", "received"] as const;

export const TransactionView = () => {
  const crpc = useCRPC();
  
  const [filters, setFilters] = useTransactionFilters();
  
  const debouncedQuery = useDebounce(filters.q, 400);

  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());
  const { data: transactions } = useSuspenseQuery(
    crpc.transaction.getHistory.queryOptions({
      query: debouncedQuery ?? "",
      status: filters.status ?? null,
      min: filters.min ?? 0,
      max: filters.max ?? 0,
      from: filters.from ?? null,
      to: filters.to ?? null,
      limit: filters.limit,
      cursor: filters.page * filters.limit,
      view: filters.view,
    })
  );

  const [sorting, setSorting] = useState<SortingState>([])

  const hasPrevPage = filters.page > 0;
  const hasNextPage = (filters.page + 1) * filters.limit < transactions.total;

  const table = useReactTable({
    data: transactions.items,
    columns: transactionColumns(),
    getRowId: (row) => String(row._id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <>
      <header className="flex flex-col gap-4 border-border p-4 md:py-6 md:px-8 border-b-0 sm:border-b-2 h-[81.25px]">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl hidden! sm:block!">ธุรกรรม</h1>
        </div>
      </header>

      <section className="grid gap-4 p-4 md:p-8 border-border border-b-2">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-[3fr_1.5fr]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InfoCard title="Point Sent" value={wallet.givingBudget} />
            <InfoCard color="orange" title="Point Received" value={wallet.receivingBudget} />
            <div className="col-span-1 md:col-span-2">
              <FeedTransactions />
            </div>
          </div>
          <div className="grid divide-y divide-solid divide-border px-2 overflow-y-auto lg:sticky lg:inset-y-4 lg:max-h-[calc(100vh-2rem)]">
            <TransactionContent 
              className="p-0"
              givingBudget={wallet.givingBudget} 
              receivingBudget={wallet.receivingBudget} 
              showHeader={false} 
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 p-4 md:p-8">
        <h2 className="text-xl">ประวัติธุรกรรม</h2>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_4fr]">
          <TransactionFilters
            total={transactions.total}
            filters={filters}
            onChange={setFilters}
          />
          <div className="w-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 grow">
                <Button
                  variant="elevated"
                  size="icon"
                  disabled={!hasPrevPage}
                  onClick={() => {
                    if (hasPrevPage) {
                      void setFilters({ ...filters, page: filters.page - 1 });
                    }
                  }}
                >
                  <ChevronLeftIcon className="size-5" />
                </Button>
                <Button
                  variant="elevated"
                  size="icon"
                  disabled={!hasNextPage}
                  onClick={() => {
                    if (hasNextPage) {
                      void setFilters({ ...filters, page: filters.page + 1 });
                    }
                  }}
                >
                  <ChevronRightIcon className="size-5" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {SORTS.map((sort) => (
                  <Button
                    variant={filters.view === sort ? "rounded" : "roundedOutline"}
                    size="smRounded"
                    key={sort}
                    className="capitalize"
                    onClick={() => {
                      void setFilters({
                        ...filters,
                        view: sort,
                        page: 0,
                      });
                    }}
                  >
                    {sort}
                  </Button>
                ))}
              </div>
            </div>

            <DataTable
              key={transactions.items.map((transaction) => String(transaction._id)).join(",")}
              table={table}
            />
          </div>
        </div>
      </section>
    </>
  );
};