"use client";

import { 
  flexRender, 
  getCoreRowModel, 
  RowSelectionState, 
  useReactTable 
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";
import { usePagination } from "@/hooks/use-pagination";

import { Button } from "@/components/ui/button";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagniation";

import { columns } from "@/modules/events/ui/components/event-columns";
import { EventFiltersPopover } from "@/modules/events/ui/components/event-filters";

import { useEventExcel } from "@/modules/events/hooks/use-event-excel";
import { useEventFilters } from "@/modules/events/stores/use-event-filters";
import { links } from "@/modules/dashboard/constants";
import { Navigations } from "@/components/navigations";

export const EventsView = () => {
  const crpc = useCRPC(); 

  const [filters, setFilters] = useEventFilters();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบรางวัล",
  });

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
  
  const { data: events } = useSuspenseQuery(crpc.activity.getMany.queryOptions({
    q: debouncedQuery,
    limit: filters.limit,
    cursor: requestCursor,
    view: filters.view,
    minParticipants: filters.minParticipants,
    maxParticipants: filters.maxParticipants,
  }));
  const { onImport, onExport } = useEventExcel({
    searchQuery: debouncedQuery,
    view: filters.view,
    minParticipants: filters.minParticipants ?? null,
    maxParticipants: filters.maxParticipants ?? null,
  });
  
  const canGoForward = events.hasNextPage && events.continueCursor != null;

  const tableColumnDefs = useMemo(() => columns(), []);

  const table = useReactTable({
    data: events.page,
    columns: tableColumnDefs,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  return (
    <Main
      title="กิจกรรม"
      onImport={onImport}
      onExport={onExport}
      searchValue={filters.q}
      onSearchChange={(q) => setFilters({ ...filters, q })}
      newLink="/meta/events/new"
      filter={<EventFiltersPopover />}
      menu={<Navigations links={links} />}
    >
      <section className="p-4 md:p-8">
        <div className="grid gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Pagination
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onBack={goBack}
                onForward={() => {
                  const c = events.continueCursor;
                  if (c != null) goForward(c);
                }}
              />
              {(table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()) && (
                <Button 
                  variant="elevated" 
                  className="bg-destructive text-white"
                  onClick={() => {}}
                >
                  ลบ
                </Button>
              )}
            </div>
            <table className="grid w-full border-spacing-0 gap-4 lg:table lg:border-separate lg:rounded-xs lg:border-2 lg:border-border lg:overflow-hidden">
              <thead className="hidden lg:table-header-group">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="block rounded-xs border-2 border-border lg:table-row">
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
                  <tr key={row.id} className="block rounded-xs border-2 border-border lg:table-row bg-background even:bg-muted">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="block p-4 text-left align-middle not-first:border-t-2 not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-xs lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-xs lg:first:border-r-2">
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
    </Main>
  );
};
