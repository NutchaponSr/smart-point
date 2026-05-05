import { format } from "date-fns";
import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

import { statuses } from "@/modules/transactions/constants";

type Transaction = ApiOutputs["transaction"]["getMany"]["page"][0];

interface Props {
  view: "sent" | "received";
}

export const columns = ({ view }: Props): ColumnDef<Transaction>[] => {
  return [
    {
      id: "employeeName",
      header: "พนักงาน",
      cell: ({ row }) => {
        const senderName = row.original.sender?.name ?? "ไม่พบข้อมูลผู้ส่ง";
        const receiverName = row.original.receiver?.name ?? "ไม่พบข้อมูลผู้รับ";

        if (view === "sent") {
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
          )
        } else {
          return (
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <UserAvatar
                  name={receiverName}
                  className={{
                    container: "size-9 after:border-[1.5px]",
                    fallback: "text-sm font-medium bg-orange",
                  }}
                />
                <div className="absolute -bottom-2 -right-2">
                  <UserAvatar
                    name={senderName}
                    className={{
                      container: "size-6 after:border-[1.5px]",
                      fallback: "text-xs font-medium",
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-base font-medium">
                  {receiverName}{" "}
                  <span className="font-normal">ได้รับ <u>{row.original.amount}</u> พอยต์ จาก{" "}</span>
                  <span className="text-blue">{senderName}</span>
                </p>
              </div>
            </div>
          );
        }
      },
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