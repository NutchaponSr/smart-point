"use client";

import { useState } from "react";
import type { ApiOutputs } from "@convex/api";

import { Button } from "@/components/ui/button";
import { TransactionReviewDialog } from "@/modules/transactions/ui/components/transaction-review-dialog";

interface Props {
  transaction: ApiOutputs["transaction"]["getMany"]["page"][0];
}

export const TransactionActions = ({ transaction }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        className="w-full tracking-wide"
        onClick={() => setOpen(true)}
      >
        ตรวจสอบ
      </Button>
      <TransactionReviewDialog
        transaction={transaction}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};
