"use client";

import { toast } from "sonner";
import type { ApiOutputs } from "@convex/api";
import { useMutation } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react";

import { useCRPC } from "@/lib/convex/crpc";
import type { ShippingStatus } from "@/modules/rewards/constants";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { useReviewStore } from "../../stores/use-review";

import { Id } from "../../../../../convex/functions/_generated/dataModel";

interface Props {
  redemptionId: Id<"redemption">;
  reward: ApiOutputs["redemption"]["getMany"]["page"][0]["reward"];
  shippingStatus: ShippingStatus;
  hasReview: boolean;
  isCancelled?: boolean;
}

export const PurchaseActions = ({
  redemptionId,
  reward,
  shippingStatus,
  hasReview,
  isCancelled = false,
}: Props) => {
  const crpc = useCRPC();
  const { onOpen } = useReviewStore();

  const confirmDelivery = useMutation(
    crpc.redemption.confirmDelivery.mutationOptions(),
  );

  const canConfirmDelivery =
    !isCancelled && shippingStatus === "shipped" && !confirmDelivery.isPending;
  const canReview =
    !isCancelled && !hasReview && shippingStatus === "delivered";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        {shippingStatus === "shipped" && !isCancelled ? (
          <DropdownMenuItem
            disabled={!canConfirmDelivery}
            onClick={() =>
              confirmDelivery.mutate(
                { redemptionId },
                {
                  onSuccess: () => {
                    toast.success("ยืนยันรับของแล้ว");
                  },
                  onError: (error) => {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "ยืนยันรับของไม่สำเร็จ",
                    );
                  },
                },
              )
            }
          >
            {confirmDelivery.isPending ? "กำลังยืนยัน..." : "ส่งถึงแล้ว"}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={!canReview}
            onClick={() =>
              onOpen({
                redemptionId,
                reward: {
                  _id: reward._id,
                  image: reward.image,
                  name: reward.name,
                },
              })
            }
          >
            รีวิว
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled>ใบเสร็จ</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
