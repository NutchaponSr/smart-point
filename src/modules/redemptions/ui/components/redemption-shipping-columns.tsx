"use client";

import placeholder from "../../../../../public/placeholder.png";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import {
  shippingStatuses,
  statuses,
  Status,
  type ShippingStatus,
} from "@/modules/rewards/constants";

export type RedemptionAdminRow =
  ApiOutputs["redemption"]["getManyAdmin"]["page"][0];

interface ColumnOptions {
  onUpdate: (row: RedemptionAdminRow) => void;
}

const redemptionStatusBadgeClassName: Record<Status, string> = {
  pending: "bg-[#ffe8c2] text-[#cc7800]",
  fulfilled: "bg-[#d7ffb8] text-[#58a700]",
  cancelled: "bg-[#ffdfdf] text-[#ea2b2b]",
};

function ShippingStatusBadge({
  status,
  shippingStatus,
}: {
  status: RedemptionAdminRow["redemption"]["status"];
  shippingStatus: ShippingStatus;
}) {
  if (status === "cancelled") {
    return (
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-md px-2.5 py-1.5 text-xs font-bold",
          redemptionStatusBadgeClassName.cancelled,
        )}
      >
        {statuses.cancelled}
      </span>
    );
  }

  const meta = shippingStatuses[shippingStatus];

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md px-2.5 py-1.5 text-xs font-bold",
        shippingStatus === "pending" && "bg-[#ddf4ff] text-[#1899d6]",
        shippingStatus === "processing" && "bg-[#ffe8c2] text-[#cc7800]",
        (shippingStatus === "shipped" || shippingStatus === "delivered") &&
          "bg-[#d7ffb8] text-[#58a700]",
      )}
    >
      {meta.label}
    </span>
  );
}

export const redemptionShippingColumns = ({
  onUpdate,
}: ColumnOptions): ColumnDef<RedemptionAdminRow>[] => [
  {
    accessorKey: "employee",
    header: "พนักงาน",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          name={row.original.employee.name}
          className={{
            container: "size-10 shrink-0",
            fallback: "text-sm font-bold",
          }}
        />
        <div className="min-w-0">
          <p className="truncate text-base font-medium">
            {row.original.employee.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {row.original.employee.employeeId} · {row.original.employee.department}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "reward",
    header: "รางวัล",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-3">
        <figure className="size-10 shrink-0 overflow-hidden rounded-xs border-2 border-border">
          <img
            src={row.original.reward.image || placeholder.src}
            alt={row.original.reward.name}
            className="size-full object-cover"
          />
        </figure>
        <div className="min-w-0">
          <p className="truncate text-base font-medium">
            {row.original.reward.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(
              new Date(row.original.redemption.createdAt),
              "d MMM yyyy",
              { locale: th },
            )}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "จำนวน",
    cell: ({ row }) => (
      <span className="text-base tabular-nums">
        {row.original.redemption.quantity}
      </span>
    ),
  },
  {
    accessorKey: "pointSpent",
    header: "พอยต์",
    cell: ({ row }) => (
      <span className="text-base font-bold tabular-nums">
        {row.original.redemption.pointSpent.toLocaleString("th-TH")}
      </span>
    ),
  },
  {
    accessorKey: "shippingStatus",
    header: "สถานะจัดส่ง",
    cell: ({ row }) => (
      <ShippingStatusBadge
        status={row.original.redemption.status}
        shippingStatus={row.original.redemption.shippingStatus}
      />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          disabled={row.original.redemption.status === "cancelled"}
          onClick={() => onUpdate(row.original)}
        >
          อัปเดต
        </Button>
      </div>
    ),
  },
];
