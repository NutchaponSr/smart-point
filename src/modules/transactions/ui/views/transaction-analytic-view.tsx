"use client";

import { RowSelectionState } from "@tanstack/react-table";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { useEffect, useMemo, useState } from "react";

import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";
import { usePagination } from "@/hooks/use-pagination";

import { Button } from "@/components/ui/button";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagniation";
import { DataTable } from "@/components/data-table";

import { useTransactionExcel } from "../../hooks/use-transaction-excel";
import { useTransactionFilters } from "../../stores/use-transaction-filter";
import { columns } from "../components/transaction-analytic-columns";
import { TransactionFilters } from "../components/transaction-filters";

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

  const transactionColumns = useMemo(() => columns(), []);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    setRowSelection({});
  }, [filters.page]);

  const selectedTransactionIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const showBulkActions = selectedTransactionIds.length > 0;

  const { onExport } = useTransactionExcel({ data: transactions.page });

  const canGoForward = transactions.hasNextPage && transactions.continueCursor != null;

  return (
    <Main title="ธุรกรรม" onExport={onExport}>
      <ConfirmationDialog />
      <RejectionDialog />
      <section className="space-y-4 p-4 md:p-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_4fr]">
          <TransactionFilters
            total={transactions.page.length}
          />
          <div className="w-full">
            <div className="flex items-center justify-between mb-5">
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
              {showBulkActions && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="elevated"
                    className="bg-pink"
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
                    variant="elevated"
                    className="bg-destructive"
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
              )}
            </div>

            <DataTable
              data={transactions.page}
              columns={transactionColumns}
              enableRowSelection
              getRowId={(row) => row._id}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          </div>
        </div>
      </section>
    </Main>
  );
};
