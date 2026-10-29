"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";
import { useLocale } from "next-intl";

import { pickLocalized } from "@/lib/i18n/localized";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

export type DonationAdminRow = ApiOutputs["donation"]["getManyAdmin"]["page"][0];

export const donationColumns = (): ColumnDef<DonationAdminRow>[] => [
  {
    accessorKey: "donor",
    header: "ผู้บริจาค",
    cell: ({ row }) => <DonorCell row={row.original} />,
  },
  {
    accessorKey: "points",
    header: "พอยต์",
    cell: ({ row }) => (
      <span className="text-base font-bold tabular-nums">
        {row.original.points.toLocaleString("th-TH")}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "วันที่",
    cell: ({ row }) => (
      <span className="text-base">
        {format(new Date(row.original.createdAt), "d MMM yyyy", { locale: th })}
      </span>
    ),
  },
];

function DonorCell({ row }: { row: DonationAdminRow }) {
  const locale = useLocale();
  const name = pickLocalized(row.donorName, locale);
  const department = pickLocalized(row.department, locale);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar
        name={name}
        className={{
          container: "size-10 shrink-0",
          fallback: "text-sm font-bold",
        }}
      />
      <div className="min-w-0">
        <p className="truncate text-base font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">
          {row.employeeId} · {department}
          {row.division ? ` · ${row.division}` : ""}
        </p>
      </div>
    </div>
  );
}
