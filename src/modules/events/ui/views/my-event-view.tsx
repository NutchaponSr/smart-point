"use client";

import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  useReactTable 
} from "@tanstack/react-table";
import { ApiOutputs } from "@convex/api";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { Pagination } from "@/components/pagniation";

import { AttachButton } from "../components/attach-button";

import { categories, statuses } from "@/modules/events/constants";
import { useEventFilters } from "@/modules/events/stores/use-event-filters";
import { EventFilters } from "../components/event-filters";
import { format } from "date-fns";

export const MyEventView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useEventFilters();

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

  const { data: events } = useSuspenseQuery(crpc.activity.list.queryOptions({
    q: debouncedQuery,
    limit: filters.limit,
    cursor: requestCursor,
    view: filters.view,
    status: filters.status,
  }));
  
  const canGoForward = events.hasNextPage && events.continueCursor != null;

  const table = useReactTable({
    data: events.page,
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <header className="flex flex-col gap-4 border-border p-4 md:py-6 md:px-8 border-b-0 sm:border-b-2 h-[81.25px]">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl hidden! sm:block!">กิจกรรม</h1>
        </div>
      </header>

      <section className="space-y-4 p-4 md:p-8">
        <h2 className="text-xl">กิจกรรมของฉัน</h2>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_4fr]">
          <EventFilters />
          <div className="w-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 grow">
                <Pagination 
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                  onBack={goBack}
                  onForward={() => {
                    const c = events.continueCursor;
                    if (c != null) goForward(c);
                  }}
                />
              </div>
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
                          "px-4 py-3 text-left align-middle select-none",
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
        </div>
      </section>
    </>
  )
}

type Event = ApiOutputs["activity"]["list"]["page"][0];

const columns = (): ColumnDef<Event>[] => {
  return [
    {
      accessorKey: "name",
      header: "กิจกรรม",
    },
    {
      accessorKey: "category",
      header: "ประเภท",
      cell: ({ row }) => (
        <span className="text-base font-normal">{categories[row.original.category].th}</span>
      ),
    },
    {
      accessorKey: "startDate",
      header: "วันที่เริ่ม",
      cell: ({ row }) => (
        <span className="text-base font-normal">{format(row.original.startDate, "LLL dd, yyyy")}</span>
      ),
    },
    {
      accessorKey: "endDate",
      header: "วันที่สิ้นสุด",
      cell: ({ row }) => (
        <span className="text-base font-normal">{format(row.original.endDate || new Date(), "LLL dd, yyyy")}</span>
      ),
    },
    {
      id: "status",
      header: "สถานะ",
      cell: ({ row }) => {
        const participationStatus = row.original.myParticipation.status;
        const status =
          participationStatus in statuses
            ? statuses[participationStatus as keyof typeof statuses]
            : null;

        return (
          <div className="flex items-center justify-between">
            <span className="text-base font-normal">
              {status?.th ?? participationStatus}
            </span>
            {status?.en === "Registered" && <AttachButton event={row.original} />}
          </div>
        )
      } 
    },
  ]
}