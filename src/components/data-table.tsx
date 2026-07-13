import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  OnChangeFn,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props<T> {
  data: T[];
  columns: ColumnDef<T>[];
  footer?: React.ReactNode;
  enableRowSelection?: boolean;
  getRowId?: (originalRow: T, index: number) => string;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

export const DataTable = <T,>({
  data,
  columns,
  footer,
  enableRowSelection = false,
  getRowId,
  rowSelection: rowSelectionControlled,
  onRowSelectionChange: onRowSelectionChangeControlled,
}: Props<T>) => {
  const [rowSelectionInternal, setRowSelectionInternal] = useState<RowSelectionState>({});

  const controlled =
    rowSelectionControlled !== undefined && onRowSelectionChangeControlled !== undefined;
  const rowSelection = controlled ? rowSelectionControlled : rowSelectionInternal;
  const onRowSelectionChange = controlled ? onRowSelectionChangeControlled : setRowSelectionInternal;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection,
    ...(getRowId ? { getRowId } : {}),
    onRowSelectionChange,
    state: { rowSelection },
  });

  return (
    <table className="grid w-full border-spacing-0 gap-4 lg:table lg:border-separate lg:rounded-md lg:border-2 lg:border-border lg:overflow-hidden">
      <thead className="hidden lg:table-header-group">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="block border-2 border-border lg:table-row">
            {headerGroup.headers.map((header) => (
              <th 
                key={header.id} 
                onClick={header.column.getToggleSortingHandler()}
                className={cn(
                  "px-4 py-3 text-left align-middle select-none has-[input[type=checkbox]]:border-r-2 has-[input[type=checkbox]]:border-border has-data-[slot=checkbox]:border-r-2 has-data-[slot=checkbox]:border-border has-[input[type=checkbox]]:w-[48px]! has-data-[slot=checkbox]:w-[48px]!",
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

      <tbody className="contents lg:table-row-group lg:rounded-md">
        {table.getRowModel().rows.length > 0 ? 
          table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="block rounded-md border-2 border-border lg:table-row bg-background even:bg-muted">
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="block p-4 text-left align-middle not-first:border-t-2 not-first:border-border has-[input[type=checkbox]]:border-r-2 has-[input[type=checkbox]]:border-border has-data-[slot=checkbox]:border-r-2 has-data-[slot=checkbox]:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-md lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-md has-[input[type=checkbox]]:w-[48px]! has-data-[slot=checkbox]:w-[48px]!"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        )) : (
          <tr className="block rounded-md border-2 border-border lg:table-row bg-background">
            <td colSpan={table.getAllColumns().length} className="block p-4 text-left align-middle not-first:border-t not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-md lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-md"> 
              Nothing yet
            </td>
          </tr>
        )}
      </tbody>

      {footer && (
        <tfoot className="contents font-normal lg:table-footer-group">
          <tr className="block rounded-xs border-2 border-border lg:table-row">
            <td
              colSpan={table.getAllColumns().length}
              className="block p-4 text-left align-middle not-first:border-t-2 not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-sm lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-sm"
            >
              {footer}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}