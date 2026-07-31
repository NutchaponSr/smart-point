"use client";

import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";
import { useLocale } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { pickLocalized } from "@/lib/i18n/localized";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { EventActions } from "@/modules/events/ui/components/event-actions";

import { categories, buRestrictedCategories } from "@/modules/events/constants";
import { formatAllowedBuLabels } from "@/modules/events/utils/bu-labels";

type Event = ApiOutputs["activity"]["getMany"]["page"][0];

function EventNameCell({ event }: { event: Event }) {
  const locale = useLocale();
  return (
    <span className="text-base font-normal line-clamp-1">
      {pickLocalized(event.name, locale)}
    </span>
  );
}

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
      id: "name",
      header: "กิจกรรม",
      cell: ({ row }) => <EventNameCell event={row.original} />,
    },
    {
      accessorKey: "category",
      header: "ประเภท",
      cell: ({ row }) => (
        <span className="text-base font-normal">
          {categories[row.original.category].th}
        </span>
      ),
    },
    {
      id: "allowedBu",
      header: "BU",
      cell: ({ row }) => {
        if (
          !buRestrictedCategories.includes(
            row.original.category as (typeof buRestrictedCategories)[number],
          )
        ) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        const labels = formatAllowedBuLabels(
          row.original.allowedDivisions,
          row.original.allowedDepartments,
        );
        return (
          <div className="flex max-w-xs flex-wrap gap-1">
            {labels.map((label) => (
              <span
                key={label}
                className="rounded-md bg-[#f3e0ff] px-2 py-0.5 text-xs font-medium text-[#a568cc]"
              >
                {label}
              </span>
            ))}
          </div>
        );
      },
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
            {row.original.participantsPreview.length - 3 > 0
              ? `${row.original.participantsPreview.length - 3}`
              : 0}
          </AvatarGroupCount>
        </AvatarGroup>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => <EventActions activity={row.original} />,
    },
  ];
};
