import placeholder from "../../../../../public/placeholder.png";

import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

import { statuses } from "@/modules/rewards/constants";
import { PurchaseActions } from "./purchase-actions";

type Purchase = ApiOutputs["redemption"]["getMany"]["page"][0];

export const purchaseColumns = (): ColumnDef<Purchase>[] => {

  return [
    {
      accessorKey: "reward",
      header: "รางวัล",
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <figure className="size-16 border-r-2 border-border">
              <img src={row.original.reward.image || placeholder.src} alt={row.original.reward.name} className="size-full object-cover" />
            </figure>

            <div className="flex flex-col p-4">
              <h4 className="text-base">{row.original.reward.name}</h4>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "quantity",
      header: "จำนวน",
      cell: ({ row }) => {
        return <>{row.original.redemption.quantity}</>
      }
    },
    {
      accessorKey: "pointSpent",
      header: "ค่าพอยต์ที่ใช้",
      cell: ({ row }) => {
        return <>{row.original.redemption.pointSpent}</>
      }
    },
    {
      accessorKey: "status",
      header: "สถานะ",
      cell: ({ row }) => {
        return <>{statuses[row.original.redemption.status]}</>
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-2">
            {!row.original.review ? "Not reviewed" : "Reviewed"}

            <PurchaseActions
              redemptionId={row.original.redemption._id}
              reward={row.original.reward}
              reviewDisabled={
                !!row.original.review
              }
            />
          </div>
        )
      }
    }
  ]
}