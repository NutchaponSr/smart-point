import placeholder from "../../../../../public/placeholder.png";

import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { statuses } from "@/modules/rewards/constants";
import { PurchaseActions } from "./purchase-actions";

type Purchase = ApiOutputs["redemption"]["getMany"]["page"][0];

export const purchaseColumns = (startRank = 4): ColumnDef<Purchase>[] => {
  return [
    {
      id: "rank",
      header: "ลำดับ",
      cell: ({ row }) => {
        const rank = startRank + row.index;
        return (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xs border-2 border-border bg-muted text-base font-bold tabular-nums",
            )}
          >
            {rank}
          </div>
        );
      },
    },
    {
      accessorKey: "reward",
      header: "รางวัล",
      cell: ({ row }) => {
        return (
          <div className="flex min-w-0 items-center gap-3">
            <figure className="size-10 shrink-0 overflow-hidden rounded-xs border-2 border-border">
              <img
                src={row.original.reward.image || placeholder.src}
                alt={row.original.reward.name}
                className="size-full object-cover"
              />
            </figure>
            <div className="min-w-0">
              <h4 className="truncate text-base font-medium">
                {row.original.reward.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {new Date(row.original.redemption.createdAt).toLocaleDateString(
                  "th-TH",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "จำนวน",
      cell: ({ row }) => {
        return (
          <span className="text-base tabular-nums">
            {row.original.redemption.quantity}
          </span>
        );
      },
    },
    {
      accessorKey: "pointSpent",
      header: "พอยต์ที่ใช้",
      cell: ({ row }) => {
        return (
          <span className="text-base font-bold tabular-nums">
            {row.original.redemption.pointSpent.toLocaleString("th-TH")}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "สถานะ",
      cell: ({ row }) => {
        return (
          <span className="text-sm text-muted-foreground">
            {statuses[row.original.redemption.status]}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm text-muted-foreground">
              {!row.original.review ? "ยังไม่รีวิว" : "รีวิวแล้ว"}
            </span>
            <PurchaseActions
              redemptionId={row.original.redemption._id}
              reward={row.original.reward}
              reviewDisabled={!!row.original.review}
            />
          </div>
        );
      },
    },
  ];
};
