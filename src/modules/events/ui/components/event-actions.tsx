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
  activity: ApiOutputs["activity"]["getMany"]["page"][0];
}

export const EventActions = ({ activity }: Props) => {
  const crpc = useCRPC();
  const router = useRouter();

  const remove = useMutation(crpc.activity.remove.mutationOptions());

  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบกิจกรรม",
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem onClick={() => router.push(`/meta/events/${activity.id}/join`)}>
          ผู้เข้าร่วม
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/meta/events/${activity.id}/edit`)}>
          แก้ไข
        </DropdownMenuItem>
        <DropdownMenuItem onClick={async () => {
          const ok = await confirm();

          if (ok) {
            remove.mutate({ activityId: activity.id });
          }
        }}>
          ลบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}