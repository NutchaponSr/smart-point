"use client";

import Link from "next/link";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { useCRPC } from "@/lib/convex/crpc";

import { News } from "@/components/news";
import { Currencies } from "@/modules/cart/ui/components/currency";

import { ENABLE_BU_RECOMMENDED } from "@/modules/events/constants";
import { EventCarousel } from "@/modules/events/ui/components/event-carousel";
import { Feeds } from "@/modules/transactions/ui/components/feeds";
import { MonthlyQuest } from "@/modules/overviews/ui/components/monthly-quest";
import { TransactionContent } from "@/modules/wallets/ui/components/transaction-content";

export const OverviewsView = () => {
  const t = useTranslations("overview");
  const crpc = useCRPC();

  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  return (
    <div className="flex flex-col gap-6 px-6">
      <div className="flex flex-col gap-6 lg:flex-row-reverse lg:gap-12">
        <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:z-1 lg:w-[368px] lg:shrink-0 lg:self-start">
          <div className="mb-2 flex h-11 flex-row items-center justify-between">
            <Currencies />
          </div>
          <News />
          {/* <MonthlyQuest /> */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between">
              <h2 className="text-base font-bold">
                {ENABLE_BU_RECOMMENDED
                  ? t("events-for-bu")
                  : t("events-for-you")}
              </h2>
              <Link
                href="/events"
                className="text-sm font-medium text-[#1cb0f6]"
              >
                {t("view-all")}
              </Link>
            </div>
            <EventCarousel autoLoop />
          </div>
        </aside>

        <div className="z-0 flex min-w-0 flex-1 flex-col gap-6 pb-24">
          <TransactionContent
            givingBudget={wallet.givingBudget}
            receivingBudget={wallet.receivingBudget}
          />
          <Feeds />
        </div>
      </div>
    </div>
  );
};
