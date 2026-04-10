"use client";

import placeholder from "../../../../../public/placeholder.png";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { StarRating } from "@/components/star-rating";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GoStarFill } from "react-icons/go";

interface Props {
  rewardId: string;
}

export const RewardInfoView = ({ rewardId }: Props) => {
  const crpc = useCRPC();

  const [quantity, setQuantity] = useState(0);

  const { data: reward } = useSuspenseQuery(crpc.reward.getOne.queryOptions({ rewardId }));

  return (
    <section className="mx-auto w-full max-w-product-page lg:py-16 p-4 lg:px-32">
      <article className="relative grid rounded-xs border-2 border-border bg-background lg:grid-cols-[2fr_1fr]">
        <figure className="group relative col-span-full overflow-hidden rounded-t-xs border-b-2 border-border bg-cover">
          <img src={reward?.image || placeholder.src} alt={reward.name} loading="lazy" className="w-full" />
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
              <StarRating rating={reward.totalStars} text={String(reward.totalReviews)} />
            </div>
          </section>
          <section className="border-t-2 border-border p-6">
            <p className="text-sm">
              {reward.description}
            </p>
          </section>
        </section>
        
        <section>
          <form className="grid gap-4 p-6 not-first:border-t-2">
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
                <span className="text-base font-normal">{reward.totalStars}</span>
                <span className="text-sm font-normal">({reward.totalReviews})</span>
              </div>
            </header>

            {/* TODO: Add rating distribution */}
          </section>
        </section>
      </article>
    </section>
  );
};