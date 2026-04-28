"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

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

export function useRewardExcel() {
  const crpc = useCRPC();
  const [state, setState] = useState<ExcelOperationState>({ status: "idle" });

  const bulkCreate = useMutation(crpc.reward.bulkCreate.mutationOptions());

  // Only fetch export data when the export operation is triggered
  const exportQuery = useQuery({
    enabled: state.status === "loading" && (state as any).operation === "export",
    ...crpc.reward.exportExcel.queryOptions(),
  });

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
      // Wait for query to resolve if not yet available
      const data =
        exportQuery.data ??
        (await exportQuery.refetch().then((r) => r.data));

      if (!data) throw new Error("Cannot fetch reward data");

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
    onImport,
    onExport,
    clearErrors,
  };
}