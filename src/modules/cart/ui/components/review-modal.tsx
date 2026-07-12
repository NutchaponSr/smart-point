"use client";

import ElementEditable from "@/components/element-editable";

import placeholder from "../../../../../public/placeholder.png";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { StarPicker } from "@/components/star-picker";

import { useReviewStore } from "../../stores/use-review";

export const ReviewModal = () => {
  const crpc = useCRPC();

  const { redemptionId, reward, isOpen, onClose } = useReviewStore();

  const review = useMutation(crpc.redemption.reviewRedemption.mutationOptions());

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!redemptionId) return;

    review.mutate({
      redemptionId,
      stars,
      comment: comment.trim(),
    }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const disableSubmit =
    stars === 0 ||
    review.isPending ||
    redemptionId === null ||
    comment.trim().length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0">
        <section className="flex flex-row gap-4 sm:gap-5 p-4 sm:p-5">
          <figure className="size-14 overflow-hidden rounded-xs border-2 border-border bg-cover">
            <img
              src={reward?.image || placeholder.src}
              alt={reward?.name || "Reward"}
              className="size-full object-cover"
            />
          </figure>
          <section className="flex flex-1 flex-col gap-1">
            <a href={`/rewards/${reward?._id}`} className="line-clamp-2 text-base font-medium no-underline">
              {reward?.name}
            </a>
          </section>
        </section>
        <section className="flex flex-col gap-4 border-border p-4 pt-0 md:p-6 md:pt-0">
          <form className="flex flex-col items-start gap-2" onSubmit={handleSubmit}>
            <div className="flex grow w-full flex-wrap items-center justify-between gap-2">
              <label className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30">
                Liked it? Give it a rating:
              </label>
              <div className="flex shrink-0 items-center">
                <StarPicker value={stars} onChange={setStars} />
              </div>
            </div>

            <div className="flex flex-col w-full">
              <ElementEditable 
                value={comment}
                placeholder="Write a review"
                onChange={setComment}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-pink hover:bg-pink"
              disabled={disableSubmit}
            >
              Post Review
            </Button>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
};
