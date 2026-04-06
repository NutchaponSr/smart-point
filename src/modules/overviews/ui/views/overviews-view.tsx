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

export const OverviewsView = () => {
  const crpc = useCRPC();

  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  return (
    <div className="relative mx-auto container max-w-[1000px]">
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 w-full py-6 px-4 lg:pb-8 lg:pt-16 lg:px-6 overflow-hidden">
        <PointHero title="Monthly Giving Budget" points={wallet.givingBudget} />
        <PointHero title="Your Total Balance" points={wallet.receivingBudget} variant="orange" />
      </div>

      <div className="relative grid grid-cols-1 px-4 lg:px-6">
        <Tabs defaultValue="transactions">
          <TabsList className="lg:gap-8">
            <TabsTrigger value="transactions" className="data-active:bg-pink">Transactions</TabsTrigger>
            <TabsTrigger value="rewards" className="data-active:bg-orange">Rewards</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions">

          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};