"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCRPC } from "@/lib/convex/crpc";
import { exportToExcel, importExcelWithValidation } from "@/lib/excel";
import { employeeExportSchema } from "@/modules/employee/schema";
import { employeeHeaderMapping, employeeHeaders } from "@/modules/employee/constants";
import type { ValidationError } from "@/types/excel";

export type ExcelOperationState =
  | { status: "idle" }
  | { status: "loading"; operation: "import" | "export" }
  | { status: "error"; errors: ValidationError[] }
  | { status: "success"; operation: "import" | "export" };

interface Props {
  searchQuery: string;
}

export function useEmployeeExcel({ searchQuery }: Props) {
  const crpc = useCRPC();
  const [state, setState] = useState<ExcelOperationState>({ status: "idle" });

  const bulkImport = useMutation(crpc.employee.bulkImport.mutationOptions());
  const exportMutation = useMutation(crpc.employee.exportAll.mutationOptions());

  const onImport = async (file: File) => {
    setState({ status: "loading", operation: "import" });

    try {
      const result = await importExcelWithValidation(file, {
        schema: employeeExportSchema,
        headerMapping: employeeHeaderMapping,
      });

      if (result.errors.length > 0) {
        setState({ status: "error", errors: result.errors });
        return;
      }

      await bulkImport.mutateAsync({
        rows: result.data.map((row) => ({
          employeeId: String(row.employeeId),
          name: row.name,
          email: row.email ?? undefined,
          department: row.department,
          position: row.position,
          rank: row.rank,
          division: row.division,
          password: String(row.citizenId),
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
      const data = await exportMutation.mutateAsync({ query: searchQuery });

      exportToExcel(
        data.map((e) => ({
          employeeId: e.employeeId,
          name: e.name,
          email: e.email,
          department: e.department,
          position: e.position,
          rank: e.rank,
          division: e.division,
        })),
        {
          filename: "employee-export",
          sheetName: "Employee Export",
          headers: employeeHeaders as Record<string, string>,
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