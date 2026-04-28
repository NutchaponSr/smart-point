import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/checkbox";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { EventActions } from "@/modules/events/ui/components/event-actions";

import { categories } from "@/modules/events/constants";

type Event = ApiOutputs["activity"]["getMany"]["page"][0];

export const columns = (): ColumnDef<Event>[] => {
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
      header: "กิจกรรม",
    },
    {
      accessorKey: "category",
      header: "ประเภท",
      cell: ({ row }) => (
        <span className="text-base font-normal">{categories[row.original.category].th}</span>
      ),
    },
    {
      accessorKey: "joinedCount",
      header: "ผู้เข้าร่วม",
      cell: ({ row }) => (
        <AvatarGroup>
          {row.original.participantsPreview.slice(0, 3).map((participant) => (
            <UserAvatar
              key={participant.employeeId}
              name={participant.name}
              src={participant.image ?? undefined}
              className={{
                container: "size-8 after:border-[1.5px]",
                fallback: "text-sm font-medium",
              }}
            />
          ))}
          <AvatarGroupCount className="border-[1.5px] border-border!">
            {row.original.participantsPreview.length - 3 > 0 ? `${row.original.participantsPreview.length - 3}` : 0}
          </AvatarGroupCount>
        </AvatarGroup>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <EventActions activity={row.original} />
      ),
    }
  ]
}