import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { ApiOutputs } from "@convex/api";
import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { SearchInput } from "@/components/search-input";

import { Pagination } from "@/modules/transactions/ui/components/pagination";
import { DateFilter } from "@/modules/transactions/ui/components/date-filter";
import { TransactionFilter } from "@/modules/transactions/ui/components/transaction-filter";
import { transactionColumns } from "@/modules/transactions/ui/components/transaction-columns";

import { useFilter } from "@/modules/transactions/stores/use-filter";

type TransactionHistoryProps = {
  transactions: ApiOutputs["transaction"]["getHistory"]["items"]["sent"];
  total: number;
}

export const TransactionHistory = ({ transactions, total }: TransactionHistoryProps) => {
  const { query, setQuery, page, setPage, limit, setLimit } = useFilter();

  const [sorting, setSorting] = useState<SortingState>([])

  const hasPrevPage = page > 0;
  const hasNextPage = (page + 1) * limit < total;

  const table = useReactTable({
    data: transactions,
    columns: transactionColumns(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl">ประวัติธุรกรรม</h2>

      <div className="flex items-center gap-2">
        <Button
          variant="elevated"
          size="iconLg"
          disabled={!hasPrevPage}
          onClick={() => {
            if (hasPrevPage) {
              void setPage(page - 1);
            }
          }}
        >
          <ChevronLeftIcon className="size-5" />
        </Button>
        <Pagination limit={limit} setLimit={setLimit} setPage={setPage} />
        <SearchInput
          value={query || ""}
          placeholder="ค้นหา..."
          onChange={setQuery}
        />
        <DateFilter />
        <TransactionFilter />
        <Button
          variant="elevated"
          size="iconLg"
          disabled={!hasNextPage}
          onClick={() => {
            if (hasNextPage) {
              void setPage(page + 1);
            }
          }}
        >
          <ChevronRightIcon className="size-5" />
        </Button>
      </div>

      <table className="grid w-full border-spacing-0 gap-4 lg:table lg:border-separate lg:rounded-xs lg:border-2 lg:border-border lg:overflow-hidden">
        <thead className="hidden lg:table-header-group">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="block rounded-sm border-2 border-border lg:table-row">
              {headerGroup.headers.map((header) => (
                <th 
                  key={header.id} 
                  onClick={header.column.getToggleSortingHandler()}
                  className={cn(
                    "px-4 py-3 text-left align-middle rounded-sm select-none",
                    header.column.getCanSort() && "cursor-pointer"
                  )}
                >
                  <span className="inline-flex items-center gap-2 text-base font-semibold">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() && (
                      header.column.getIsSorted() === "asc" ? (
                        <ArrowUpIcon className="size-4" />
                      ) : (
                        <ArrowDownIcon className="size-4" />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="contents lg:table-row-group lg:rounded-xs">
          {table.getRowModel().rows.length > 0 ? 
            table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="block rounded-xs border-2 border-border lg:table-row bg-background">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="block p-4 text-left align-middle not-first:border-t-2 not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-xs lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-xs">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          )) : (
            <tr className="block rounded-xs border-2 border-border lg:table-row bg-background">
              <td colSpan={table.getAllColumns().length} className="block p-4 text-left align-middle not-first:border-t not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-xs lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-xs"> 
                Nothing yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}