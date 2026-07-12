import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { PinIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { NewsActions } from "@/modules/news/ui/components/news-actions";

type NewsRow = ApiOutputs["news"]["getList"]["page"][0];

export const columns = (): ColumnDef<NewsRow>[] => {
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
      accessorKey: "title",
      header: "หัวข้อ",
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            {row.original.isPinned && (
              <PinIcon className="size-3.5 shrink-0 text-pink" />
            )}
            <span className="line-clamp-1 text-base font-normal">
              {row.original.title}
            </span>
          </div>
          {row.original.summary && (
            <span className="line-clamp-1 text-sm text-muted-foreground">
              {row.original.summary}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "isPublished",
      header: "สถานะ",
      cell: ({ row }) => (
        <span
          className={
            row.original.isPublished
              ? "text-sm font-medium text-[#58cc02]"
              : "text-sm text-muted-foreground"
          }
        >
          {row.original.isPublished ? "เผยแพร่แล้ว" : "แบบร่าง"}
        </span>
      ),
    },
    {
      accessorKey: "publishedAt",
      header: "วันที่เผยแพร่",
      cell: ({ row }) => (
        <span className="text-base font-normal">
          {row.original.publishedAt
            ? format(new Date(row.original.publishedAt), "d MMM yyyy", {
                locale: th,
              })
            : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => <NewsActions news={row.original} />,
    },
  ];
};
