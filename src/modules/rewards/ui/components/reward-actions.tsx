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
  reward: ApiOutputs["reward"]["getList"]["page"][0];
}

export const RewardActions = ({ reward }: Props) => {
  const crpc = useCRPC();
  const router = useRouter();

  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบพนักงาน",
  });

  const remove = useMutation(crpc.reward.remove.mutationOptions());

  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/reward/${reward._id}`)}>
            แก้ไข
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={async () => {
              const ok = await confirm();

              if (ok) {
                remove.mutate({ rewardId: reward._id });
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
