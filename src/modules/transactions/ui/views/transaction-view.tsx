"use client";

import { Main } from "@/components/main";

import { HistoryTransactionScreen } from "@/modules/transactions/ui/screens/history-transaction-screen";
import { OverviewTransactionScreen } from "@/modules/transactions/ui/screens/overview-transaction-screen";

export const TransactionView = () => {
  return (
    <Main title="ธุรกรรม">
      <OverviewTransactionScreen />
      <HistoryTransactionScreen />
    </Main>
  );
};