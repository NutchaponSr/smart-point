"use client";

import { useDebounce } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";
import { RowSelectionState } from "@tanstack/react-table";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";
import { usePagination } from "@/hooks/use-pagination";

import { Button } from "@/components/ui/button";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagniation";
import { Navigations } from "@/components/navigations";

import { TransactionAnalyticList } from "@/modules/transactions/ui/components/transaction-analytic-list";
import { TransactionFilters } from "@/modules/transactions/ui/components/transaction-filters";

import { links } from "@/modules/dashboard/constants";

import { useTransactionExcel } from "@/modules/transactions/hooks/use-transaction-excel";
import { useTransactionFilters } from "@/modules/transactions/stores/use-transaction-filter";

export const TransactionAnalyticView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useTransactionFilters();
  const [ConfirmationDialog, confirm] = useConfirm({
    title: "อนุมัติธุรกรรม",
  });
  const [RejectionDialog, reject] = useConfirm({
    title: "ปฏิเสธธุรกรรม",
  });

  const bulkApprove = useMutation(crpc.transaction.bulkApprove.mutationOptions());

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

  const { data: transactions } = useSuspenseQuery(
    crpc.transaction.getMany.queryOptions({
      limit: filters.limit,
      cursor: requestCursor,
      q: debouncedQuery,
      status: filters.status,
      min: filters.min,
      max: filters.max,
      from: filters.from ?? null,
      to: filters.to ?? null,
      self: false,
    }),
  );

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    setRowSelection({});
  }, [filters.page]);

  const selectedTransactionIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const showBulkActions = selectedTransactionIds.length > 0;

  const { onExport } = useTransactionExcel({
    searchQuery: debouncedQuery,
    status: filters.status,
    min: filters.min,
    max: filters.max,
    from: filters.from ?? null,
    to: filters.to ?? null,
    self: false,
  });

  const canGoForward = transactions.hasNextPage && transactions.continueCursor != null;

  return (
    <Main
      title="ธุรกรรม"
      onExport={onExport}
      menu={<Navigations links={links} />}
    >
      <ConfirmationDialog />
      <RejectionDialog />
      <section className="space-y-4 p-4 md:p-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_4fr]">
          <TransactionFilters total={transactions.page.length} />
          <div className="w-full">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-[#4b4b4b]">
                รายการธุรกรรม
              </h2>
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

            <div
              className={cn(
                "mb-4 grid transition-all duration-200",
                showBulkActions
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-3 rounded-md border-2 border-[#84d8ff] bg-[#ddf4ff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-[#1899d6]">
                    เลือก {selectedTransactionIds.length} รายการ
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={bulkApprove.isPending}
                      onClick={async () => {
                        const ok = await confirm();

                        if (ok) {
                          bulkApprove.mutate(
                            {
                              transactionIds: selectedTransactionIds,
                              confirm: true,
                            },
                            { onSuccess: () => setRowSelection({}) },
                          );
                        }
                      }}
                    >
                      อนุมัติ
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={bulkApprove.isPending}
                      onClick={async () => {
                        const ok = await reject();

                        if (ok) {
                          bulkApprove.mutate(
                            {
                              transactionIds: selectedTransactionIds,
                              confirm: false,
                            },
                            { onSuccess: () => setRowSelection({}) },
                          );
                        }
                      }}
                    >
                      ปฏิเสธ
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <TransactionAnalyticList
              transactions={transactions.page}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          </div>
        </div>
      </section>
    </Main>
  );
};
