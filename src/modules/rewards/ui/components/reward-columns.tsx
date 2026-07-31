"use client";

import Coin from "../../../../../public/coin.svg";
import placeholder from "../../../../../public/placeholder.png";

import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";
import { useLocale } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import { pickLocalized } from "@/lib/i18n/localized";

import { RewardActions } from "@/modules/rewards/ui/components/reward-actions";

type Reward = ApiOutputs["reward"]["getList"]["page"][0];

function RewardNameCell({ reward }: { reward: Reward }) {
  const locale = useLocale();
  const name = pickLocalized(reward.name, locale);

  return (
    <div className="flex items-center gap-2">
      <figure className="size-8 rounded-xs border-[1.5px] border-border">
        <img
          src={reward.imageUrl ?? placeholder.src}
          alt={name}
          className="size-full object-cover"
        />
      </figure>
      <span className="text-base font-normal line-clamp-1">{name}</span>
    </div>
  );
}

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
      id: "name",
      header: "รางวัล",
      cell: ({ row }) => <RewardNameCell reward={row.original} />,
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
      header: "พอยต์",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-base font-medium text-[#1cb0f6]">
          <img src={Coin.src} alt="Coin" className="size-6" />
          {row.original.pointCost}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => <RewardActions reward={row.original} />,
    },
  ];
};
