import Coin from "../../../../../public/coin.svg";
import placeholder from "../../../../../public/placeholder.png";

import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import {
  shippingStatuses,
  statuses,
  type ShippingStatus,
} from "@/modules/rewards/constants";
import { PurchaseActions } from "./purchase-actions";

type Purchase = ApiOutputs["redemption"]["getMany"]["page"][0];

function PurchaseShippingStatusBadge({
  status,
  shippingStatus,
}: {
  status: Purchase["redemption"]["status"];
  shippingStatus: ShippingStatus;
}) {
  if (status === "cancelled") {
    return (
      <span className="text-sm font-medium text-muted-foreground">
        {statuses.cancelled}
      </span>
    );
  }

  const meta = shippingStatuses[shippingStatus];

  return (
    <span className={cn("text-sm font-medium", meta.color)}>{meta.label}</span>
  );
}

export const purchaseColumns = (): ColumnDef<Purchase>[] => {
  return [
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
          <span className="flex items-center gap-1 text-base font-medium tabular-nums text-[#1cb0f6]">
            <img src={Coin.src} alt="Coin" className="size-6" />
            {row.original.redemption.pointSpent}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "สถานะจัดส่ง",
      cell: ({ row }) => {
        return (
          <PurchaseShippingStatusBadge
            status={row.original.redemption.status}
            shippingStatus={row.original.redemption.shippingStatus}
          />
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
              reviewDisabled={
                !!row.original.review ||
                row.original.redemption.shippingStatus !== "delivered"
              }
            />
          </div>
        );
      },
    },
  ];
};
