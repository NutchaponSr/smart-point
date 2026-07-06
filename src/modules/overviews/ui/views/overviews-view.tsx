"use client";

import Link from "next/link";

import { IoMdTrendingUp } from "react-icons/io";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BsFillGiftFill, BsFillSendFill } from "react-icons/bs";

import { useCRPC } from "@/lib/convex/crpc";

import { InfoCard } from "@/components/info-card";

import { TransactionContent } from "@/modules/wallets/ui/components/transaction-content";
import { FeedTransactions } from "@/modules/transactions/ui/components/feed-transactions";
import { GivingPointExpiryWarning } from "@/modules/overviews/ui/components/giving-point-expiry-warning";
import { HistoryTransactionScreen } from "@/modules/transactions/ui/screens/history-transaction-screen";

export const OverviewsView = () => {
  const crpc = useCRPC();

  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  return (
    <div className="relative h-full">
      <div className="grid gap-16! px-4 py-16 lg:ps-16 lg:pe-16">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-[3fr_1.5fr]">
          <div className="grid grid-cols-1 gap-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <InfoCard 
                title="คะแนนที่คุณให้เพื่อน" 
                value={wallet.givingBudget} 
                icon={BsFillSendFill} 
                color="orange"
              />
              <InfoCard 
                title="คะแนนที่คุณได้รับ" 
                value={wallet.receivingBudget} 
                icon={BsFillGiftFill} 
                color="pink"
              />
              <InfoCard 
                title="เปอร์เซ็นต์คะแนนที่คุณได้รับ" 
                value={100} 
                icon={IoMdTrendingUp} 
                color="purple"
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