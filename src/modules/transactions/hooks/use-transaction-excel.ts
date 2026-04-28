"use client";

import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { ApiOutputs } from "@convex/api";

import { exportToExcel } from "@/lib/excel";

import type { ValidationError } from "@/types/excel";

import { statuses, transactionHeaders } from "@/modules/transactions/constants";

interface Props {
  data: ApiOutputs["transaction"]["getMany"]["page"];
}

export type ExcelOperationState =
  | { status: "idle" }
  | { status: "loading"; operation: "import" | "export" }
  | { status: "error"; errors: ValidationError[] }
  | { status: "success"; operation: "import" | "export" };

export function useTransactionExcel({ data }: Props) {
  const [state, setState] = useState<ExcelOperationState>({ status: "idle" });

  const onExport = async () => {
    setState({ status: "loading", operation: "export" });

    try {
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
      setState({
        status: "error",
        errors: [
          {
            row: 0,
            field: "export",
            message:
              error instanceof Error ? error.message : "Something went wrong",
            value: null,
          },
        ],
      });
      toast.error("Something went wrong");
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