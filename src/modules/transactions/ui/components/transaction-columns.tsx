import { format } from "date-fns";
import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

import { statuses } from "../../constants";

type Transaction = ApiOutputs["transaction"]["getHistory"]["items"]["sent"][0];

export const transactionColumns = (): ColumnDef<Transaction>[] => {
  return [
    {
      accessorKey: "receiver",
      header: "พนักงาน",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2.5">
            {row.original.receiver && (
              <UserAvatar
                name={row.original.receiver.name}
                src={row.original.receiver.image}
                className={{
                  container: "size-9 after:border-[1.5px]",
                  fallback: "text-sm font-medium",
                }}
              />
            )}
            <div className="flex flex-col">
              <h4 className="text-base">{row.original.receiver?.name}</h4>
              <small className="text-sm text-muted-foreground">{row.original.receiver?.department}</small>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "amount",
      header: "จำนวนพอยต์",
    },
    {
      accessorKey: "status",
      header: "สถานะ",
      cell: ({ row }) => {
        return <>{statuses[row.original.status]}</>
      },
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: "วันที่",
      cell: ({ row }) => {
        return <>{format(new Date(row.original._creationTime), "LLL dd, y")}</>
      },
    },
  ]
}