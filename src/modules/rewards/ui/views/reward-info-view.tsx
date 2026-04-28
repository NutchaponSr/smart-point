"use client";

import placeholder from "../../../../../public/placeholder.png";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { GoStarFill } from "react-icons/go";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { StarRating } from "@/components/star-rating";

import { Review } from "@/modules/rewards/ui/components/review";

interface Props {
  rewardId: string;
}

export const RewardInfoView = ({ rewardId }: Props) => {
  const crpc = useCRPC();
  const router = useRouter();

  const [quantity, setQuantity] = useState(0);

  const { data: reward } = useSuspenseQuery(crpc.reward.getOne.queryOptions({ rewardId }));

  const addCart = useMutation(crpc.cart.addCart.mutationOptions());

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    addCart.mutate({
      rewardId,
      quantity,
    }, {
      onSuccess: () => {
        router.push("/checkout");
      }
    });
  }

  return (
    <section className="mx-auto w-full max-w-product-page lg:py-16 p-4 lg:px-32">
      <article className="relative grid rounded-xs border-2 border-border bg-background lg:grid-cols-[2fr_1fr]">
        <figure className="group relative col-span-full overflow-hidden rounded-t-xs border-b-2 border-border bg-cover">
          <img src={reward.image || placeholder.src} alt={reward.name} loading="lazy" className="w-full" />
        </figure>

        <section className="lg:border-r-2">
          <header className="grid gap-4 p-6 not-first:border-t-2">
            <h1 className="text-[2rem] font-normal leading-[1.2]">{reward.name}</h1>
          </header>
          <section className="grid grid-cols-[auto_1fr] gap-px border-t-2 border-border p-0 sm:grid-cols-[auto_auto_minmax(max-content,1fr)]">
            <div className="px-6 py-4 outline-2 outline-offset-0 outline-border">
              <div className="relative grid w-fit border-[1.5px] border-border">
                <div
                  className="bg-pink px-2 py-1"
                  itemProp="point"
                  content={String(reward.pointCost)}
                >
                  {reward.pointCost}
                </div>
              </div>
            </div>
            <div className="flex items-center px-6 py-4 max-sm:col-span-full">
              <StarRating rating={reward.reviewRating} text={String(reward.reviewCount)} />
            </div>
          </section>
          <section className="border-t-2 border-border p-6">
            <p className="text-sm">
              {reward.description}
            </p>
          </section>
        </section>
        
        <section>
          <form onSubmit={onSubmit} className="grid gap-4 p-6 not-first:border-t-2">
            <fieldset className="flex flex-col border-none gap-2">
              <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
                <label className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30">
                  จำนวน
                </label>
              </legend>
              <Input 
                required
                placeholder="0"
                type="number"
                min={1}
                max={reward.pointCost}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                onBlur={() => {
                  if (quantity < 0) {
                    setQuantity(0);
                  }
                  if (quantity > reward.pointCost) {
                    setQuantity(reward.pointCost);
                  }
                }}
              />
            </fieldset>
            <Button type="submit">
              เพิ่มลงรถเข็น
            </Button>
          </form>

          <section className="grid gap-4 p-6 not-first:border-t-2">
            <header className="flex items-center justify-between">
              <h3 className="flex items-center justify-between">
                เร็ตติ่ง
              </h3>
              <div className="flex shrink-0 items-center gap-1">
                <GoStarFill className="size-4.5" />
                <span className="text-base font-normal">{reward.reviewRating}</span>
                <span className="text-sm font-normal">({reward.reviewCount})</span>
              </div>
            </header>

            <section className="grid grid-cols-[auto_1fr_auto] gap-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reward.ratingDistribution[star];
                const pct =
                  reward.reviewCount > 0
                    ? Math.round((count / reward.reviewCount) * 100)
                    : 0;
                return (
                <Fragment key={star}>
                  <div className="font-medium">{star} {star === 1 ? "ดาว" : "ดาว"}</div>
                  <Progress 
                    value={pct}
                    className="h-lh"
                  />
                  <div className="font-medium">
                    {pct}%
                  </div>
                </Fragment>
                );
              })}
            </section>

            <section className="flex flex-col gap-4 my-1">
              {reward.reviewers.map((reviewer) => (
                <Review key={reviewer.reviewId} reviewer={reviewer} />
              ))}
            </section>
          </section>
        </section>
      </article>
    </section>
  );
};