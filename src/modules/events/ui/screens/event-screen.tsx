"use client";

import type { ApiOutputs } from "@convex/api";
import { useMutation } from "@tanstack/react-query";
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useState } from "react";
import { GoPersonFill } from "react-icons/go";
import { toast } from "sonner";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { useCRPC } from "@/lib/convex/crpc";
import { cn } from "@/lib/utils";
import placeholder from "../../../../../public/placeholder.png";
import { columns } from "../components/participant-columns";
import { useConfirm } from "@/hooks/use-confirm";

interface Props {
  activity: ApiOutputs["activity"]["getOne"];
  onReload: () => Promise<unknown>;
}

export const EventScreen = ({ activity, onReload }: Props) => {
  const crpc = useCRPC();

  const [ConfirmationDialog, confirmStart] = useConfirm({
    title: "ยกเลิกเข้าร่วมกิจกรรม",
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const join = useMutation(crpc.activity.join.mutationOptions());
  const leave = useMutation(crpc.activity.leave.mutationOptions());
  const isMutating = join.isPending || leave.isPending;
  const isFull =
    activity.maxParticipants != null &&
    activity.participantCount >= activity.maxParticipants;
  const disableJoin = !activity.isActive || isFull || isMutating;
  const disableLeave = isMutating;

  const handleJoin = () => {
    join.mutate(
      { activityId: activity._id },
      {
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const handleLeave = async () => {
    const ok = await confirmStart();
    if (!ok) return;

    leave.mutate(
      { activityId: activity._id },
      {
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const table = useReactTable({
    data: activity.participants,
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
    },
  });

  return (
    <section className="mx-auto w-full max-w-product-page flex-1 flex flex-col">
      <article className="relative grid rounded-xs border-2 border-border bg-background lg:grid-cols-[2fr_1fr]">
        <figure className="group relative col-span-full overflow-hidden rounded-t-xs border-b-2 border-border bg-cover">
          <img
            src={placeholder.src}
            alt={activity.name}
            loading="lazy"
            className="w-full"
          />
        </figure>

        <section className="lg:border-r-2">
          <header className="grid gap-4 p-6 not-first:border-t-2">
            <h1 className="text-[2rem] font-normal leading-[1.2]">
              {activity.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activity.description}
            </p>
          </header>
          <section className="grid grid-cols-[auto_1fr] gap-px border-t-2 border-border p-0 sm:grid-cols-[auto_auto_minmax(max-content,1fr)]">
            <div className="px-6 py-4 outline-2 outline-offset-0 outline-border">
              <div className="relative grid w-fit border-[1.5px] border-border">
                <div
                  className="bg-pink px-2 py-1"
                  itemProp="point"
                  content={String(activity.point)}
                >
                  {activity.point}
                </div>
              </div>
            </div>
            <div className="flex items-center px-6 py-4 max-sm:col-span-full">
              {activity.maxParticipants ? (
                <>
                  <GoPersonFill className="size-4.5 stroke-[0.25]" />
                  <span className="text-base font-normal">
                    {activity.participantCount} / {activity.maxParticipants}
                  </span>
                  {activity.participantCount === activity.maxParticipants && (
                    <div className="relative grid w-fit border-[1.5px] border-border ml-2">
                      <div className="bg-destructive px-2 py-1 text-white text-sm">
                        เต็ม
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-base font-normal underline">ไม่จำกัด</span>
              )}
            </div>
          </section>
          <section className="border-t-2 border-border">
            <table className="grid w-full border-spacing-0 gap-4 lg:table lg:border-separate bg-[#f4f4f0]">
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
          </section>
        </section>

        <section>
          <ConfirmationDialog />
          <div className="grid gap-4 p-4 border-b-2">
            {activity.isJoined ? (
              <Button variant="destructive" onClick={handleLeave} disabled={disableLeave}>
                {leave.isPending ? "กำลังยกเลิก..." : "ยกเลิกเข้าร่วม"}
              </Button>
            ) : (
              <Button onClick={handleJoin} disabled={disableJoin}>
                {join.isPending ? "กำลังเข้าร่วม..." : "เข้าร่วม"}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b-2">
            <SearchInput
              value={
                (table.getColumn("employeeName")?.getFilterValue() as string) ??
                ""
              }
              onChange={(value) =>
                table.getColumn("employeeName")?.setFilterValue(value)
              }
              placeholder="ค้นหาพนักงาน"
            />
          </div>
        </section>
      </article>
    </section>
  );
};
