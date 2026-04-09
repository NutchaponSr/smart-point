"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"

import { PointHero } from "@/modules/wallets/ui/components/point-hero";
import { RewardContent } from "@/modules/wallets/ui/components/reward-content";
import { TransactionContent } from "@/modules/wallets/ui/components/transaction-content";

export const OverviewsView = () => {
  const crpc = useCRPC();

  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  return (
    <div className="relative mx-auto container max-w-3xl h-full">
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 w-full py-6 px-4 lg:pb-8 lg:pt-16 lg:px-6 overflow-hidden">
        <PointHero title="Monthly Giving Budget" points={wallet.givingBudget} variant="pink" />
        <PointHero title="Your Total Balance" points={wallet.receivingBudget} variant="orange" />
      </div>

      <div className="relative grid grid-cols-1 px-4 lg:px-6">
        <Tabs defaultValue="transactions">
          <TabsList className="gap-0">
            <TabsTrigger value="transactions" className="data-active:bg-pink">ธุรกรรม</TabsTrigger>
            <TabsTrigger value="rewards" className="data-active:bg-orange">รางวัล</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions">
            <TransactionContent givingBudget={wallet.givingBudget} receivingBudget={wallet.receivingBudget} />
          </TabsContent>
          <TabsContent value="rewards">
            <RewardContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};