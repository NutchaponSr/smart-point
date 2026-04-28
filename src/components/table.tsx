import {
  useReactTable,
  getCoreRowModel,
  RowSelectionState,
  flexRender,
  ColumnDef,
  Table,
} from "@tanstack/react-table";
import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  getRowId?: (row: TData) => string;
  emptyMessage?: string;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
}

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  emptyMessage = "Nothing yet",
  onRowSelectionChange,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      if (onRowSelectionChange) {
        const next = typeof updater === "function" ? updater(rowSelection) : updater;
        onRowSelectionChange(next);
      }
    },
    state: { rowSelection },
  });

  return (
    <table className="grid w-full border-spacing-0 gap-4 lg:table lg:border-separate lg:rounded-xs lg:border-2 lg:border-border lg:overflow-hidden">
      <DataTableHead table={table} />
      <DataTableBody table={table} columns={columns} emptyMessage={emptyMessage} />
    </table>
  );
}

function DataTableHead<TData>({ table }: { table: Table<TData> }) {
  return (
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
                {header.column.getIsSorted() === "asc" && <ArrowUpIcon className="size-4" />}
                {header.column.getIsSorted() === "desc" && <ArrowDownIcon className="size-4" />}
              </span>
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
}

const ROW_CELL_CLASS =
  "block p-4 text-left align-middle not-first:border-t-2 not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-xs lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-xs first:border-r-2";

function DataTableBody<TData>({
  table,
  columns,
  emptyMessage,
}: {
  table: Table<TData>;
  columns: ColumnDef<TData, any>[];
  emptyMessage: string;
}) {
  const rows = table.getRowModel().rows;

  return (
    <tbody className="contents lg:table-row-group lg:rounded-xs">
      {rows.length > 0 ? (
        rows.map((row) => (
          <tr key={row.id} className="block rounded-xs border-2 border-border lg:table-row bg-background even:bg-muted">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className={ROW_CELL_CLASS}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))
      ) : (
        <tr className="block rounded-xs border-2 border-border lg:table-row bg-background">
          <td colSpan={columns.length} className={ROW_CELL_CLASS}>
            {emptyMessage}
          </td>
        </tr>
      )}
    </tbody>
  );
}