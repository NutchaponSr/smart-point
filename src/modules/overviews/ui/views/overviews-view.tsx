"use client";

import Link from "next/link";

import { BsClock } from "react-icons/bs";
import { formatDistanceToNow } from "date-fns";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { PointHero } from "@/modules/wallets/ui/components/point-hero";
import { TransactionContent } from "@/modules/wallets/ui/components/transaction-content";
import { FeedTransactions } from "@/modules/transactions/ui/components/feed-transactions";
import { GivingPointExpiryWarning } from "@/modules/overviews/ui/components/giving-point-expiry-warning";
import { HistoryTransactionScreen } from "@/modules/transactions/ui/screens/history-transaction-screen";

export const OverviewsView = () => {
  const crpc = useCRPC();

  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  return (
    <div className="relative mx-auto container h-full">
      <div className="grid gap-16! px-4 py-16 lg:ps-16 lg:pe-16">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-[3fr_2fr]">
          <div className="grid grid-cols-1 gap-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PointHero 
                variant="pink"
                title="คะแนนคงเหลือสำหรับมอบให้เพื่อน" 
                points={wallet.givingBudget} 
                footer={
                <div className="flex flex-row items-center justify-between w-full">
                  <a
                    href="#history-transactions"
                    className="hover:underline text-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .getElementById("history-transactions")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    ดูประวัติ
                  </a>
                  <div className="flex items-center gap-2">
                    <BsClock className="size-4 stroke-[0.2]" />
                    <span>{formatDistanceToNow(wallet.lastBudgetUpdate)}</span>
                  </div>
                </div>
                }
              />
              <PointHero 
                title="คะแนนที่ได้รับ (สำหรับแลกรางวัล)" 
                points={wallet.receivingBudget} 
                variant="orange" 
                footer={
                  <div className="flex flex-row items-center justify-end w-full">
                    <Link href="/rewards" className="hover:underline">แลกของรางวัล</Link>
                  </div>
                }
              />
            </div>
            
            <div className="col-span-2 py-2">
              <TransactionContent 
                givingBudget={wallet.givingBudget}
                receivingBudget={wallet.receivingBudget}
              />
            </div>
            <div className="grid gap-4 col-span-2 lg:hidden">
              <GivingPointExpiryWarning givingBudget={wallet.givingBudget} />
              <FeedTransactions />
            </div>
          </div>
          <div className="gap-4 hidden lg:grid overflow-y-auto lg:sticky lg:inset-y-4 lg:gap-8 lg:max-h-[calc(100vh-2rem)]">
            <GivingPointExpiryWarning givingBudget={wallet.givingBudget} />
            <FeedTransactions />
          </div>
        </div>
      </div>
      <div className="border-t-2" />
      <div id="history-transactions" className="grid gap-16! px-4 py-16 lg:ps-16 lg:pe-16 scroll-mt-24">
        <HistoryTransactionScreen />
      </div>
    </div>
  );
};