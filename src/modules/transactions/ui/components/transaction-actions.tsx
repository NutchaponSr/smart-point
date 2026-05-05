"use client";

import type { ApiOutputs } from "@convex/api";
import { MoreHorizontalIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";

interface Props {
  transaction: ApiOutputs["transaction"]["getMany"]["page"][0];
}

export const TransactionActions = ({ transaction }: Props) => {
  const crpc = useCRPC();

  const approve = useMutation(crpc.transaction.approve.mutationOptions());

  const [ConfirmationDialog, confirm] = useConfirm({
    title: "อนุมัติธุรกรรม",
  });
  const [RejectionDialog, reject] = useConfirm({
    title: "ปฏิเสธธุรกรรม",
  });

  if (transaction.status === "completed") return null;

  return (
    <>
      <ConfirmationDialog />
      <RejectionDialog />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          <DropdownMenuItem onClick={async () => {
            const ok = await confirm();
            
            if (ok) {
              approve.mutate({ transactionId: transaction._id, confirm: true });
            }
          }}>
            อนุมัติ
          </DropdownMenuItem>
          <DropdownMenuItem onClick={async () => {
            const ok = await reject();

            if (ok) {
              approve.mutate({ transactionId: transaction._id, confirm: false });
            }
          }}>
            ปฏิเสธ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};