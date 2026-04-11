"use client";

import type { ApiOutputs } from "@convex/api";
import { MoreHorizontalIcon } from "lucide-react";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { useReviewStore } from "../../stores/use-review";

import { Id } from "../../../../../convex/functions/_generated/dataModel";

interface Props {
  redemptionId: Id<"redemption">;
  reward: ApiOutputs["redemption"]["getMany"]["page"][0]["reward"];
  reviewDisabled: boolean;
}

export const PurchaseActions = ({
  redemptionId,
  reward,
  reviewDisabled,
}: Props) => {
  const { onOpen } = useReviewStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem
          disabled={reviewDisabled}
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
          Review
        </DropdownMenuItem>
        <DropdownMenuItem>Receipt</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}