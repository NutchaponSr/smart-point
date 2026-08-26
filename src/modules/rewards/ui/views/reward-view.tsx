"use client";

import Link from "next/link";

import { HiShoppingBag } from "react-icons/hi2";
import { useInfiniteQuery } from "better-convex/react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { SearchInput } from "@/components/search-input";

import { Currencies } from "@/modules/cart/ui/components/currency";
import { DonateButton } from "@/modules/rewards/ui/components/donate-button";
import { RewardScreen } from "@/modules/rewards/ui/screens/reward-screen";
import { RewardFilters } from "@/modules/rewards/ui/components/reward-filters";

import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";

export const RewardView = () => {
  const t = useTranslations("reward");
  const crpc = useCRPC();

  const [filters, setFilters] = useRewardFilters();

  const { data: cart } = useQuery(crpc.cart.getCart.queryOptions());
  const { data: recommends } = useSuspenseQuery(
    crpc.reward.getRecommend.queryOptions(),
  );

  const {
    data: rewards,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    crpc.reward.getMany.infiniteQueryOptions({
      q: filters.q,
      sort: filters.sort,
      minCost: filters.minCost,
      maxCost: filters.maxCost,
      star: filters.star,
    }),
  );

  const cartCount = cart?.items.length ?? 0;
  const cartLabel =
    cartCount > 0
      ? t("go-to-cart-with-count", { count: cartCount })
      : t("go-to-cart");

  return (
    <div className="flex flex-col gap-6 px-6">
      <div className="flex flex-col gap-6 lg:flex-row-reverse lg:gap-12">
        <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:z-1 lg:w-92 lg:shrink-0 lg:self-start">
          <div className="mb-2 flex h-11 flex-row items-center justify-between">
            <Currencies />
          </div>

          <SearchInput
            value={filters.q}
            onChange={(value) => setFilters({ ...filters, q: value })}
          />
          <RewardFilters />
          <Link href="/checkout" className="hidden lg:block">
            <Button variant="secondary" size="lg" className="w-full">
              <HiShoppingBag className="size-7" />
              {cartLabel}
            </Button>
          </Link>
          <DonateButton />
        </aside>

        <div className="z-0 min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="grid gap-6">
            <RewardScreen
              initialRecommends={recommends}
              initialRewards={rewards}
              onLoad={() => fetchNextPage()}
              hasNextPage={hasNextPage}
            />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-[#e5e5e5] bg-background p-4 lg:hidden">
        <Link href="/checkout">
          <Button variant="secondary" size="lg" className="w-full">
            <HiShoppingBag className="size-7" />
            {cartLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
};
