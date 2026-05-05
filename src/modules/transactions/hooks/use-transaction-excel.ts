"use client";

import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { exportToExcel } from "@/lib/excel";

import type { ValidationError } from "@/types/excel";

import { statuses, transactionHeaders } from "@/modules/transactions/constants";

interface Props {
  searchQuery: string;
  status: Array<"pending" | "completed" | "rejected"> | null;
  min: number;
  max: number;
  from: number | null;
  to: number | null;
  self: boolean;
}

export type ExcelOperationState =
  | { status: "idle" }
  | { status: "loading"; operation: "import" | "export" }
  | { status: "error"; errors: ValidationError[] }
  | { status: "success"; operation: "import" | "export" };

export function useTransactionExcel({
  searchQuery,
  status,
  min,
  max,
  from,
  to,
  self,
}: Props) {
  const crpc = useCRPC();
  const [state, setState] = useState<ExcelOperationState>({ status: "idle" });
  const exportMutation = useMutation(
    crpc.transaction.exportAll.mutationOptions(),
  );

  const onExport = async () => {
    setState({ status: "loading", operation: "export" });

    try {
      const data = await exportMutation.mutateAsync({
        q: searchQuery,
        status,
        min,
        max,
        from,
        to,
        self,
      });

      exportToExcel(
        data.map((e) => ({
          senderId: e.sender?.id,
          sender: e.sender?.name,
          receiverId: e.receiver?.id,
          receiver: e.receiver?.name,
          amount: e.amount,
          message: e.message,
          tags: e.tags,
          status: statuses[e.status],
          reviewedBy: e.receiver?.id,
          reviewedAt: format(new Date(e.reviewedAt), "LLL dd, y"),
        })),
        {
          filename: "event-export",
          sheetName: "Event Export",
          headers: transactionHeaders as Record<string, string>,
        }
      );

      setState({ status: "success", operation: "export" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      setState({
        status: "error",
        errors: [
          {
            row: 0,
            field: "export",
            message,
            value: null,
          },
        ],
      });
      toast.error(message);
    }
  };

  const clearErrors = () => setState({ status: "idle" });

  return {
    state,
    isLoading: state.status === "loading",
    errors: state.status === "error" ? state.errors : [],
    onExport,
    clearErrors,
  };
}