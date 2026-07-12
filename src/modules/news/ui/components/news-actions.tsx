"use client";

import { useRouter } from "next/navigation";
import type { ApiOutputs } from "@convex/api";
import { MoreHorizontalIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { useConfirm } from "@/hooks/use-confirm";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  news: ApiOutputs["news"]["getList"]["page"][0];
}

export const NewsActions = ({ news }: Props) => {
  const crpc = useCRPC();
  const router = useRouter();

  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบข่าวสาร",
  });

  const remove = useMutation(crpc.news.remove.mutationOptions());

  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          <DropdownMenuItem onClick={() => router.push(`/meta/news/${news._id}/edit`)}>
            แก้ไข
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              const ok = await confirm();
              if (ok) {
                remove.mutate({ newsId: news._id });
              }
            }}
          >
            ลบ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmationDialog />
    </div>
  );
};
