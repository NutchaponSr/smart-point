import { ApiOutputs } from "@convex/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";

import { useCRPC } from "@/lib/convex/crpc";

import { categories } from "@/modules/events/constants";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Activity = ApiOutputs["activity"]["list"]["page"][0];

const columns = (): ColumnDef<Activity>[] => {
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
      id: "status",
      header: "สถานะ",
      cell: ({ row }) => (
        <span className="text-base font-normal">{row.original.myParticipation.status}</span>
      ),
    }
  ]
}

export const EventList = () => {
  const crpc = useCRPC();

  const { data: eventsData } = useSuspenseQuery(
    crpc.activity.list.queryOptions({ limit: 100 }),
  );
  const events = eventsData.page;

  const table = useReactTable({
    data: events,
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="grid gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-[20px] font-normal leading-[1.3]">กิจกรรม</h2>
        
      </header>

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
    </section>
  );
}