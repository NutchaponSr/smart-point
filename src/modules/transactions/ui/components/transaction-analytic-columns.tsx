import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";
import { statuses } from "../../constants";
import { TransactionActions } from "./transaction-actions";
import { Checkbox } from "@/components/ui/checkbox";

type Transaction = ApiOutputs["transaction"]["getMany"]["page"][0];

export const columns = (): ColumnDef<Transaction>[] => {
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
      id: "employee",
      header: "พนักงาน",
      cell: ({ row }) => {
        const senderName = row.original.sender?.name ?? "ไม่พบข้อมูลผู้ส่ง";
        const receiverName = row.original.receiver?.name ?? "ไม่พบข้อมูลผู้รับ";

        return (
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <UserAvatar
                name={senderName}
                className={{
                  container: "size-9 after:border-[1.5px]",
                  fallback: "text-sm font-medium",
                }}
              />
              <div className="absolute -bottom-2 -right-2">
                <UserAvatar
                  name={receiverName}
                  className={{
                    container: "size-6 after:border-[1.5px]",
                    fallback: "text-xs font-medium bg-orange",
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-base font-medium">
                {senderName}{" "}
                <span className="font-normal">ให้ <u>{row.original.amount}</u> พอยต์ {" "}</span>
                <span className="text-blue">{receiverName}</span>
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "สถานะ",
      cell: ({ row }) => {
        return <>{statuses[row.original.status]}</>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <TransactionActions transaction={row.original} />
    }
  ]
}