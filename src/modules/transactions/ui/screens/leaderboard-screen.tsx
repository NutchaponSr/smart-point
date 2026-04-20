import type { ApiOutputs } from "@convex/api";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LeaderCard } from "../components/leader-card";
import { columns } from "../components/leaderboard-columns";

const medalColors = {
  1: "text-amber-400",
  2: "text-gray-400",
  3: "text-red-900",
};

interface Props {
  initialData: ApiOutputs["leaderboard"]["getMany"]["page"];
  currentCursor: number;
  limit: number;
  nextCursor: number | null;
  onChangeCursor: (cursor: number) => void;
}

export const LeaderboardScreen = ({
  initialData,
  currentCursor,
  limit,
  nextCursor,
  onChangeCursor,
}: Props) => {
  const hasPrevPage = currentCursor > 0;
  const hasNextPage = nextCursor !== null;

  const table = useReactTable({
    data: initialData,
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="grid gap-4 p-4 md:p-8">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        {initialData.slice(0, 3).map((item) => (
          <LeaderCard
            key={item.employeeId}
            name={item.employeeName}
            src={item.employeeCode}
            medalColor={medalColors[item.rank as keyof typeof medalColors]}
            score={item.points}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="iconLg"
          disabled={!hasPrevPage}
          onClick={() => onChangeCursor(Math.max(0, currentCursor - limit))}
        >
          <ChevronLeftIcon className="size-6" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="iconLg"
          disabled={!hasNextPage}
          onClick={() => {
            if (nextCursor !== null) {
              onChangeCursor(nextCursor);
            }
          }}
        >
          <ChevronRightIcon className="size-6" />
        </Button>
      </div>
      <table className="grid w-full border-spacing-0 gap-4 lg:table lg:border-separate lg:rounded-xs lg:border-2 lg:border-border lg:overflow-hidden">
        <thead className="hidden lg:table-header-group">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="block rounded-sm border-2 border-border lg:table-row"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className={cn(
                    "px-4 py-3 text-left align-middle rounded-sm select-none",
                    header.column.getCanSort() && "cursor-pointer",
                  )}
                >
                  <span className="inline-flex items-center gap-2 text-base font-semibold">
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
                className="block rounded-xs border-2 border-border lg:table-row bg-background"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="block p-4 text-left align-middle not-first:border-t-2 not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-xs lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-xs"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
    </section>
  );
};
