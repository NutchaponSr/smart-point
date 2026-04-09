"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";

import { InfoCard } from "@/components/info-card";

import { TransactionContent } from "@/modules/wallets/ui/components/transaction-content";
import { TransactionHistory } from "@/modules/transactions/ui/components/transaction-history";

import { useFilter } from "@/modules/transactions/stores/use-filter";

export const TransactionView = () => {
  const crpc = useCRPC();
  const { debouncedQuery, status, debouncedMin, debouncedMax, from, to, limit, page } = useFilter();

  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  const { data: transactions } = useSuspenseQuery(
    crpc.transaction.getHistory.queryOptions({
      limit,
      query: debouncedQuery,
      status: status ?? undefined,
      min: debouncedMin,
      max: debouncedMax,
      from: from ?? undefined,
      to: to ?? undefined,
      cursor: page * limit,
    })
  );

  return (
    <>
      <header className="flex flex-col gap-4 border-border p-4 md:py-6 md:px-8 border-b-0 sm:border-b-2 h-[82px]">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl hidden! sm:block!">ธุรกรรม</h1>
        </div>
      </header>
      <section className="grid gap-4 p-4 md:p-8 border-border border-b-2">
        <div className="grid w-full grid-cols-1 gap-4 sm:gap-16 xl:grid-cols-4">
          <div className="grid content-start gap-3 lg:col-span-1">
            <div className="grid gap-6 py-4">
              <InfoCard title="Point Sent" value={wallet.givingBudget} />
              <InfoCard color="orange" title="Point Received" value={wallet.receivingBudget} />
            </div>
          </div>
          <div className="col-span-full xl:col-span-3">
            <TransactionContent givingBudget={wallet.givingBudget} receivingBudget={wallet.receivingBudget} showHeader={false} />
          </div>
        </div>
      </section>
      <Tabs>
        <TabsList className="rounded-none border-border border-b-2">
          <TabsTrigger value="sent" className="data-active:bg-pink">ส่ง</TabsTrigger>
          <TabsTrigger value="received" className="data-active:bg-orange">รับ</TabsTrigger>
        </TabsList>
        <TabsContent value="sent">
          <section className="p-4 md:p-8">
            <TransactionHistory transactions={transactions.items.sent} total={transactions.total} />
          </section>
        </TabsContent>
        <TabsContent value="received">
          <section className="p-4 md:p-8">
            <TransactionHistory transactions={transactions.items.received} total={transactions.total} />
          </section>
        </TabsContent>
      </Tabs>
    </>
  );
};