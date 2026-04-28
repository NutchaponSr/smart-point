"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";
import { usePagination } from "@/hooks/use-pagination";

import { Button } from "@/components/ui/button";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagniation";

import { useAnalyticTransactionFilters } from "../../stores/use-transaction-filter";
import { columns } from "../components/transaction-analytic-columns";
import { TransactionFilters } from "../components/transaction-filters";
import { useTransactionExcel } from "../../hooks/use-transaction-excel";

export const TransactionAnalyticView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useAnalyticTransactionFilters();
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
    }),
  );

  const { onExport } = useTransactionExcel({ data: transactions.page });

  const canGoForward = transactions.hasNextPage && transactions.continueCursor != null;

  const tableColumnDefs = useMemo(() => columns(), []);

  const table = useReactTable({
    data: transactions.page,
    columns: tableColumnDefs,
    getRowId: (row) => row._id,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Main title="ธุรกรรม" onExport={onExport}>
      <ConfirmationDialog />
      <RejectionDialog />
      <section className="space-y-4 p-4 md:p-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_4fr]">
          <TransactionFilters
            total={transactions.page.length}
            filters={filters}
            onChange={setFilters}
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
              {(table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()) && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="elevated" 
                    className="bg-pink"
                    onClick={async () => {
                      const ok = await confirm();

                      if (ok) {
                        bulkApprove.mutate({
                          transactionIds: table.getSelectedRowModel().rows.map((row) => row.original._id),
                          confirm: true,
                        });
                      }
                    }}
                  >
                    อนุมัติ
                  </Button>
                  <Button 
                    variant="elevated" 
                    className="bg-destructive"
                    onClick={async () => {
                      const ok = await reject();

                      if (ok) {
                        bulkApprove.mutate({
                          transactionIds: table.getSelectedRowModel().rows.map((row) => row.original._id),
                          confirm: false,
                        });
                      }
                    }}
                  >
                    ปฏิเสธ
                  </Button>
                </div>
              )}
            </div>

            <table className="grid w-full border-spacing-0 gap-4 lg:table lg:border-separate lg:rounded-xs lg:border-2 lg:border-border lg:overflow-hidden">
              <thead className="hidden lg:table-header-group">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="block rounded-xs border-2 border-border lg:table-row"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "px-4 py-3 text-left align-middle select-none first:w-[48px]! lg:first:border-r-2",
                          header.column.getCanSort() && "cursor-pointer",
                        )}
                      >
                        <span className="inline-flex items-center justify-center gap-2 text-base font-semibold">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          {header.column.getIsSorted() &&
                            (header.column.getIsSorted() === "asc" ? (
                              <ArrowUpIcon className="size-4" />
                            ) : (
                              <ArrowDownIcon className="size-4" />
                            ))}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody className="contents lg:table-row-group lg:rounded-xs">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="block rounded-xs border-2 border-border lg:table-row bg-background even:bg-muted"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="block p-4 text-left align-middle not-first:border-t-2 not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-xs lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-xs first:border-r-2"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr className="block rounded-xs border-2 border-border lg:table-row bg-background">
                    <td
                      colSpan={table.getAllColumns().length}
                      className="block p-4 text-left align-middle not-first:border-t not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-xs lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-xs"
                    >
                      Nothing yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Main>
  );
};
