"use client";

import { Suspense, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import placeholder from "../../../../../public/placeholder.png";

import { ApiOutputs } from "@convex/api";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import {
  Dialog,
  DialogContent,
  DialogHidden,
} from "@/components/ui/dialog";

import { CombinedPointsBadge } from "@/modules/cart/ui/components/currency";
import { RewardInfoView } from "@/modules/rewards/ui/views/reward-info-view";

interface Props {
  reward: ApiOutputs["reward"]["getMany"]["page"][0];
}

export const Reward = ({ reward }: Props) => {
  const [open, setOpen] = useState(false);
  const crpc = useCRPC();
  const queryClient = useQueryClient();

  const rewardQueryOptions = crpc.reward.getOne.staticQueryOptions({
    rewardId: reward._id,
  });

  const openDialog = () => {
    void queryClient.prefetchQuery(rewardQueryOptions);
    setOpen(true);
  };

  return (
    <div className="flex flex-row items-start gap-8">
      <img
        src={reward.image || placeholder.src}
        alt={reward.name}
        width={100}
        height={100}
        className="bg-no-repeat bg-position-[50%] inline-block h-[100px] w-[100px] rounded-md border-2 border-border object-cover"
      />

      <div className="flex flex-col gap-1 min-w-0 grow">
        <h3 className="text-lg font-bold py-2 whitespace-pre-wrap break-all overflow-hidden">
          {reward.name}
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <CombinedPointsBadge amount={reward.pointCost} size="sm" />
          <StarRating
            rating={reward.totalStars}
            text={String(reward.totalReviews)}
            className="text-sm font-semibold text-primary"
          />
        </div>
        <p className="text-base text-[#777] m-0 leading-[1.7] line-clamp-2 break-all overflow-hidden">
          {reward.description}
        </p>
      </div>

      <Button onClick={openDialog}>ดูเพิ่มเติม</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
          <DialogHidden />
          <Suspense
            fallback={
              <div className="p-8 text-center text-muted-foreground">
                กำลังโหลด...
              </div>
            }
          >
            {open ? (
              <RewardInfoView
                rewardId={reward._id}
                className="max-w-none p-0 lg:px-0 lg:py-0"
              />
            ) : null}
          </Suspense>
        </DialogContent>
      </Dialog>
    </div>
  );
};
