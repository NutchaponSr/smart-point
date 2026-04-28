import placeholder from "../../../../../public/placeholder.png";

import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/checkbox";

import { RewardActions } from "@/modules/rewards/ui/components/reward-actions";

type Reward = ApiOutputs["reward"]["getList"]["page"][0];

export const columns = (): ColumnDef<Reward>[] => {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          onClick={(e) => e.stopPropagation()}
          className="size-5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="size-5"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "รางวัล",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <figure className="size-8 rounded-xs border-[1.5px] border-border">
            <img
              src={row.original.imageUrl ?? placeholder.src}
              alt={row.original.name}
              className="size-full object-cover"
            />
          </figure>
          <span className="text-base font-normal line-clamp-1">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: "คงเหลือ",
      cell: ({ row }) => (
        <span className="text-base font-normal">
          {row.original.stock < 0 ? "ไม่จำกัด" : row.original.stock}
        </span>
      ),
    },
    {
      accessorKey: "pointCost",
      header: "ราคา",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RewardActions reward={row.original} />
      ),
    }
  ]
}