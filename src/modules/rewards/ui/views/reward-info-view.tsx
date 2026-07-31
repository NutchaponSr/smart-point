"use client";

import placeholder from "../../../../../public/placeholder.png";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { GoStarFill } from "react-icons/go";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { pickLocalized } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { StarRating } from "@/components/star-rating";

import { CombinedPointsBadge } from "@/modules/cart/ui/components/currency";
import { Review } from "@/modules/rewards/ui/components/review";

interface Props {
  rewardId: string;
  className?: string;
}

export const RewardInfoView = ({ rewardId, className }: Props) => {
  const t = useTranslations("reward");
  const locale = useLocale();
  const crpc = useCRPC();
  const router = useRouter();

  const { data: reward } = useSuspenseQuery(crpc.reward.getOne.queryOptions({ rewardId }));
  const name = pickLocalized(reward.name, locale);
  const description = pickLocalized(reward.description, locale);

  const addCart = useMutation(crpc.cart.addCart.mutationOptions());

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    addCart.mutate({
      rewardId,
      quantity: 1,
    }, {
      onSuccess: () => {
        router.push("/checkout");
      }
    });
  }

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-product-page lg:py-16 p-4 lg:px-32",
        className,
      )}
    >
      <article className="relative grid rounded-xs border-2 border-border bg-background lg:grid-cols-[2fr_1.5fr]">
        <figure className="group relative col-span-full overflow-hidden rounded-t-xs border-b-2 border-border bg-cover">
          <img src={reward.imageUrl || placeholder.src} alt={name} loading="lazy" className="w-full" />
        </figure>

        <section className="lg:border-r-2 border-b-2">
          <header className="grid gap-4 p-6 not-first:border-t-2">
            <h1 className="text-[2rem] font-normal leading-[1.2]">{name}</h1>
          </header>
          <section className="grid grid-cols-1 lg:grid-cols-[auto_1fr] border-t-2 border-border p-0">
            <div className="px-6 py-4 flex w-full border-b-2">
              <CombinedPointsBadge amount={reward.pointCost} size="sm" />
            </div>
            <div className="flex items-center px-6 py-4 max-sm:col-span-full lg:border-b-2 border-b-0 lg:border-l-2">
              <StarRating rating={reward.reviewRating} text={String(reward.reviewCount)} />
            </div>
          </section>
          {description ? (
            <section className="lg:border-t-0 border-t-2 border-border p-6">
              <p className="text-sm">
                {description}
              </p>
            </section>
          ) : null}
        </section>
        
        <section>
          <form onSubmit={onSubmit} className="grid gap-4 p-6 not-first:border-t-2">
            <Button type="submit" disabled={addCart.isPending}>
              {t("add-to-cart")}
            </Button>
          </form>

          <section className="grid gap-4 p-6 not-first:border-t-2">
            <header className="flex items-center justify-between">
              <h3 className="flex items-center justify-between">
                {t("rating")}
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
                  <div className="font-medium">{t("star", { count: star })}</div>
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