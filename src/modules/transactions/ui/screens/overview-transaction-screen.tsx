import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { InfoCard } from "@/components/info-card";

import { TransactionContent } from "@/modules/wallets/ui/components/transaction-content";
import { FeedTransactions } from "@/modules/transactions/ui/components/feed-transactions";

export const OverviewTransactionScreen = () => {
  const crpc = useCRPC();
  
  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  return (
    <section className="grid gap-4 p-4 md:p-8 border-border border-b-2">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-[3fr_1.5fr]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InfoCard title="Point Sent" value={wallet.givingBudget} />
            <InfoCard color="orange" title="Point Received" value={wallet.receivingBudget} />
            <div className="col-span-1 md:col-span-2">
              <FeedTransactions />
            </div>
          </div>
          <div className="grid overflow-y-auto lg:sticky lg:inset-y-4 lg:max-h-[calc(100vh-2rem)]">
            <div className="h-px w-full" />
            <TransactionContent 
              className="p-0"
              givingBudget={wallet.givingBudget} 
              receivingBudget={wallet.receivingBudget} 
            />
          </div>
        </div>
      </section>
  );
}