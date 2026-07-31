"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { toast } from "sonner";

import ElementEditable from "@/components/element-editable";
import placeholder from "../../../../../public/placeholder.png";

import { pickLocalized } from "@/lib/i18n/localized";
import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarPicker } from "@/components/star-picker";

import { useReviewStore } from "../../stores/use-review";

export const ReviewModal = () => {
  const locale = useLocale();
  const crpc = useCRPC();

  const { redemptionId, reward, isOpen, onClose } = useReviewStore();
  const rewardName = pickLocalized(reward?.name, locale);

  const review = useMutation(crpc.redemption.reviewRedemption.mutationOptions());

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setStars(0);
    setComment("");
  }, [isOpen, redemptionId]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!redemptionId || stars === 0) return;

    review.mutate(
      {
        redemptionId,
        stars,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("ส่งรีวิวแล้ว ขอบคุณ!");
          onClose();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "ไม่สามารถส่งรีวิวได้",
          );
        },
      },
    );
  };

  const disableSubmit =
    stars === 0 || review.isPending || redemptionId === null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 overflow-hidden rounded-md p-0 ring-0 sm:max-w-md">
        <DialogHeader className="border-b-2 border-[#0003] bg-[#58cc02] px-6 py-4">
          <DialogTitle className="text-lg font-bold text-white">
            รีวิวรางวัล
          </DialogTitle>
        </DialogHeader>

        {reward != null && (
          <div className="border-b-2 border-border px-6 py-4">
            <div className="flex items-center gap-4">
              <figure className="size-14 shrink-0 overflow-hidden rounded-xs border-2 border-border">
                <img
                  src={reward.image || placeholder.src}
                  alt={rewardName}
                  className="size-full object-cover"
                />
              </figure>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/rewards/${reward._id}`}
                  className="line-clamp-2 text-base font-bold text-[#4b4b4b] no-underline hover:underline"
                >
                  {rewardName}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  รางวัลที่คุณแลกไปแล้ว
                </p>
              </div>
            </div>
          </div>
        )}

        <form
          className="grid gap-5 px-6 py-5"
          onSubmit={handleSubmit}
          key={redemptionId ?? "closed"}
        >
          <fieldset className="grid gap-3 text-center">
            <legend className="text-sm font-bold text-[#4b4b4b]">
              ให้คะแนนรางวัลนี้
            </legend>
            <StarPicker
              value={stars}
              onChange={setStars}
              disabled={review.isPending}
              className="justify-center gap-1 [&_svg.text-primary]:text-[#ffc800] [&_svg]:size-9"
            />
            <p className="text-xs text-muted-foreground">
              {stars === 0
                ? "แตะดาวเพื่อให้คะแนน"
                : stars >= 4
                  ? "เยี่ยมมาก!"
                  : stars >= 3
                    ? "ดีเลย!"
                    : "ขอบคุณสำหรับความคิดเห็น"}
            </p>
          </fieldset>

          <div className="grid gap-2">
            <label className="text-sm font-bold text-[#4b4b4b]">
              ความคิดเห็น{" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </label>
            <ElementEditable
              value={comment}
              placeholder="เล่าประสบการณ์ของคุณกับรางวัลนี้..."
              onChange={setComment}
              className={{
                container: "rounded-md border-2 p-4",
                placeholder: "top-4 left-4",
                input: "min-h-20 text-sm",
              }}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t-2 border-border pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={review.isPending}
              onClick={onClose}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="secondary"
              className="min-w-28"
              disabled={disableSubmit}
            >
              {review.isPending ? "กำลังส่ง..." : "ส่งรีวิว"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
