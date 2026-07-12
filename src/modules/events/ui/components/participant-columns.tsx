import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

type Participant = ApiOutputs["activity"]["getOne"]["joinedEmployees"][0];

interface ColumnOptions {
  approvingIds: Set<string>;
  onApprove: (participantId: string) => void;
  onOpenEvidence: (participant: Participant) => void;
}

export const columns = (options: ColumnOptions): ColumnDef<Participant>[] => {
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
      header: "พนักงาน",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={row.original.name}
            className={{
              container: "size-8 after:border-[1.5px]",
              fallback: "text-sm font-medium",
            }}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.department}
            </span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "สถานะ",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.status}</span>
      )
    },
    {
      id: "evidence",
      header: "หลักฐาน",
      cell: ({ row }) => (
        row.original.evidenceStorageId ? (
          <Button
            type="button"
            size="sm"
            onClick={() => options.onOpenEvidence(row.original)}
          >
            ดูไฟล์
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      ),
    },
    {
      id: "approve",
      header: "อนุมัติ",
      cell: ({ row }) => {
        const canApprove =
          row.original.status === "attended" && !!row.original.evidenceStorageId;
        return (
          <Button
            type="button"
            size="sm"
            className="bg-pink"
            disabled={!canApprove || options.approvingIds.has(row.original.participantId)}
            onClick={() => options.onApprove(row.original.participantId)}
          >
            อนุมัติ
          </Button>
        );
      },
    }
  ]
}