import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { statuses } from "@/modules/events/constants";

type Participant = ApiOutputs["activity"]["getOne"]["joinedEmployees"][0];
type ParticipantStatus = Participant["status"];

interface ColumnOptions {
  approvingIds: Set<string>;
  rejectingIds: Set<string>;
  onApprove: (participantId: string) => void;
  onReject: (participantId: string) => void;
  onOpenEvidence: (participant: Participant) => void;
}

const statusBadgeClassName: Record<ParticipantStatus, string> = {
  registered: "text-[#1899d6]",
  attended: "text-[#cc7800]",
  rewarded: "text-[#58a700]",
  cancelled: "text-muted-foreground",
};

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
      ),
    },
    {
      accessorKey: "status",
      header: "สถานะ",
      cell: ({ row }) => {
        const status = row.original.status;
        const label =
          status in statuses ? statuses[status as keyof typeof statuses].th : status;
        return (
          <span
            className={`text-sm font-semibold ${statusBadgeClassName[status] ?? ""}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      id: "evidence",
      header: "หลักฐาน",
      cell: ({ row }) =>
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
        ),
    },
    {
      id: "review",
      header: "ตรวจสอบ",
      cell: ({ row }) => {
        const canReview =
          row.original.status === "attended" && !!row.original.evidenceStorageId;
        const participantId = row.original.participantId;

        return (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              title="บวกคะแนนพิเศษให้พนักงาน"
              disabled={
                !canReview || options.approvingIds.has(participantId)
              }
              onClick={() => options.onApprove(participantId)}
            >
              อนุมัติ
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              title="ปฏิเสธหลักฐาน — พนักงานสามารถแนบใหม่ได้"
              disabled={
                !canReview || options.rejectingIds.has(participantId)
              }
              onClick={() => options.onReject(participantId)}
            >
              ปฏิเสธ
            </Button>
          </div>
        );
      },
    },
  ];
};
