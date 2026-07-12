"use client";

import { RowSelectionState } from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Transaction,
  TransactionAnalyticCard,
} from "@/modules/transactions/ui/components/transaction-analytic-columns";

interface Props {
  transactions: Transaction[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (selection: RowSelectionState) => void;
}

export function TransactionAnalyticList({
  transactions,
  rowSelection,
  onRowSelectionChange,
}: Props) {
  const allSelected =
    transactions.length > 0 &&
    transactions.every((transaction) => rowSelection[transaction._id]);
  const someSelected =
    transactions.some((transaction) => rowSelection[transaction._id]) &&
    !allSelected;

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      onRowSelectionChange({});
      return;
    }

    onRowSelectionChange(
      Object.fromEntries(transactions.map((transaction) => [transaction._id, true])),
    );
  };

  const toggleOne = (transactionId: string, checked: boolean) => {
    onRowSelectionChange({
      ...rowSelection,
      [transactionId]: checked,
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="grid place-items-center gap-2 rounded-md border-2 border-dashed border-border bg-background p-10 text-center">
        <p className="text-lg font-bold text-[#4b4b4b]">ไม่พบธุรกรรม</p>
        <p className="text-sm text-[#777]">
          ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border-2 border-border bg-background">
      <div className="flex items-center gap-3 border-b-2 border-border bg-[#f7f7f7] px-4 py-3">
        <Checkbox
          checked={allSelected || (someSelected && "indeterminate")}
          onCheckedChange={(value) => toggleAll(!!value)}
          aria-label="เลือกทั้งหมด"
          className="size-5"
        />
        <span className="text-sm font-bold text-[#4b4b4b]">เลือกทั้งหมด</span>
      </div>

      <ul>
        {transactions.map((transaction) => (
          <TransactionAnalyticCard
            key={transaction._id}
            transaction={transaction}
            selected={!!rowSelection[transaction._id]}
            onSelectedChange={(checked) => toggleOne(transaction._id, checked)}
          />
        ))}
      </ul>
    </div>
  );
}
