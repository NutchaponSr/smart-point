"use client";

import { useInfiniteQuery } from "better-convex/react";

import { useCRPC } from "@/lib/convex/crpc";
import { PurchaseFilters } from "../components/purchase-filters";
import { usePurchaseFilters } from "../../stores/use-purchase-filters";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { purchaseColumns } from "../components/purchase-columns";

export const PurchasesView = () => {
  const crpc = useCRPC();

  const [filters] = usePurchaseFilters();

  const { data: redemptions, fetchNextPage, hasNextPage } = useInfiniteQuery(
    crpc.redemption.getMany.infiniteQueryOptions({
      ...filters,
    })
  );

  const table = useReactTable({
    data: redemptions,
    columns: purchaseColumns(),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <header className="flex flex-col gap-4 border-border p-4 md:py-6 md:px-8 border-b-0 sm:border-b-2 h-[82px]">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl hidden! sm:block!">ประวัติการแลก</h1>
        </div>
      </header>

      <section className="space-y-4 p-4 md:p-8">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-[1fr_4fr]">
          <div className="grid divide-y-2 divide-solid divide-border rounded-xs border-2 border-border bg-background overflow-y-auto lg:sticky lg:inset-y-4 lg:max-h-[calc(100vh-2rem)]">
            <PurchaseFilters />
          </div>

          <div>
            <table className="grid w-full border-spacing-0 gap-4 lg:table lg:border-separate lg:rounded-xs lg:border-2 lg:border-border lg:overflow-hidden">
            <thead className="hidden lg:table-header-group">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="block rounded-sm border-2 border-border lg:table-row">
                  {headerGroup.headers.map((header) => (
                    <th 
                      key={header.id} 
                      onClick={header.column.getToggleSortingHandler()}
                      className="px-4 py-3 text-left align-middle rounded-sm select-none"
                    >
                      <span className="inline-flex items-center gap-2 text-base font-semibold">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                      <td key={cell.id} className="block text-left p-4 first:p-0 align-middle not-first:border-t-2 not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-xs lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-xs">
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
        </div>
      </section>
    </>
  );
};
