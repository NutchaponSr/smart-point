"use client";

import Link from "next/link";

import { BsClock } from "react-icons/bs";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";


import { PointHero } from "@/modules/wallets/ui/components/point-hero";
import { TransactionContent } from "@/modules/wallets/ui/components/transaction-content";
import { FeedTransactions } from "@/modules/transactions/ui/components/feed-transactions";
import { EventCard } from "@/modules/events/ui/components/event-card";

export const OverviewsView = () => {
  const crpc = useCRPC();

  const { data: event } = useSuspenseQuery(crpc.activity.count.queryOptions());
  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  return (
    <div className="relative mx-auto container max-w-[1440px] h-full">
      <div className="grid gap-16! px-4 py-16">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-[3fr_2fr]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PointHero 
              variant="pink"
              title="Monthly Giving Budget" 
              points={wallet.givingBudget} 
              footer={
              <div className="flex flex-row items-center justify-between w-full">
                <Link href="/transactions" className="hover:underline text-sm">ดูประวัติ</Link>
                <div className="flex items-center gap-2">
                  <BsClock className="size-4 stroke-[0.2]" />
                  <span>Last updated 12 hours ago</span>
                </div>
              </div>
              }
            />
            <PointHero 
              title="Your Total Balance" 
              points={wallet.receivingBudget} 
              variant="orange" 
              footer={
                <div className="flex flex-row items-center justify-end w-full">
                  <Link href="/rewards" className="hover:underline">แลกของรางวัล</Link>
                </div>
              }
            />
            <div className="col-span-1 md:col-span-2">
              <FeedTransactions />
            </div>
          </div>
          <div className="grid overflow-y-auto lg:sticky lg:inset-y-24 lg:gap-8 lg:max-h-[calc(100vh-2rem)]">
            <EventCard count={event.count} />
            <TransactionContent 
              givingBudget={wallet.givingBudget}
              receivingBudget={wallet.receivingBudget}
            />
          </div>
        </div>
      </div>
    </div>
  );
};