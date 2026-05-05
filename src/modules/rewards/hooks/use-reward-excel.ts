"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { exportToExcel, importExcelWithValidation } from "@/lib/excel";

import type { ValidationError } from "@/types/excel";

import { rewardExportSchema } from "@/modules/rewards/schema";
import { rewardHeaderMapping, rewardHeaders } from "@/modules/rewards/constants";

export type ExcelOperationState =
  | { status: "idle" }
  | { status: "loading"; operation: "import" | "export" }
  | { status: "error"; errors: ValidationError[] }
  | { status: "success"; operation: "import" | "export" };

interface Props {
  searchQuery: string;
  minCost: number;
  maxCost: number;
  star: number;
}

export function useRewardExcel({
  searchQuery,
  minCost,
  maxCost,
  star,
}: Props) {
  const crpc = useCRPC();
  const [state, setState] = useState<ExcelOperationState>({ status: "idle" });

  const bulkCreate = useMutation(crpc.reward.bulkCreate.mutationOptions());
  const exportMutation = useMutation(crpc.reward.exportAll.mutationOptions());

  const onImport = async (file: File) => {
    setState({ status: "loading", operation: "import" });

    try {
      const result = await importExcelWithValidation(file, {
        schema: rewardExportSchema,
        headerMapping: rewardHeaderMapping,
      });

      if (result.errors.length > 0) {
        setState({ status: "error", errors: result.errors });
        return;
      }

      await bulkCreate.mutateAsync({
        rows: result.data.map((row) => ({
          name: row.name,
          description: row.description,
          pointCost: row.pointCost,
          stock: row.stock,
          onePerOrder: row.onePerOrder,
          isActive: row.isActive,
        })),
      });

      setState({ status: "success", operation: "import" });
    } catch (error) {
      setState({
        status: "error",
        errors: [
          {
            row: 0,
            field: "file",
            message:
              error instanceof Error ? error.message : "Something went wrong",
            value: null,
          },
        ],
      });
    }
  };

  const onExport = async () => {
    setState({ status: "loading", operation: "export" });

    try {
      const data = await exportMutation.mutateAsync({
        q: searchQuery,
        minCost,
        maxCost,
        star,
      });

      exportToExcel(
        data.map((e) => ({
          name: e.name,
          description: e.description,
          pointCost: e.pointCost,
          stock: e.stock,
          onePerOrder: e.onePerOrder,
          isActive: e.isActive,
        })),
        {
          filename: "reward-export",
          sheetName: "Reward Export",
          headers: rewardHeaders as Record<string, string>,
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
    onImport,
    onExport,
    clearErrors,
  };
}