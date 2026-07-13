"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { exportToExcel, importExcelWithValidation } from "@/lib/excel";

import type { ValidationError } from "@/types/excel";

import {
  BULK_IMPORT_CHUNK_SIZE,
  employeeHeaderMapping,
  employeeHeaders,
} from "@/modules/employee/constants";
import { employeeExportSchema } from "@/modules/employee/schema";

export type ExcelOperationState =
  | { status: "idle" }
  | {
      status: "loading";
      operation: "import" | "export";
      progress?: { done: number; total: number };
    }
  | { status: "error"; errors: ValidationError[] }
  | { status: "success"; operation: "import" | "export" };

interface Props {
  searchQuery: string;
  division?: string[];
  department?: string[];
  rank?: string[];
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function useEmployeeExcel({
  searchQuery,
  division = [],
  department = [],
  rank = [],
}: Props) {
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

      const rows = result.data.map((row, index) => ({
        rowIndex: index + 1,
        employeeId: String(row.employeeId),
        name: row.name,
        email: row.email ?? undefined,
        department: row.department,
        position: row.position,
        rank: row.rank,
        division: row.division,
        password: String(row.citizenId),
      }));

      const chunks = chunkArray(rows, BULK_IMPORT_CHUNK_SIZE);
      let inserted = 0;
      let skipped = 0;
      const importErrors: ValidationError[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]!;
        setState({
          status: "loading",
          operation: "import",
          progress: { done: i * BULK_IMPORT_CHUNK_SIZE, total: rows.length },
        });

        const chunkResult = await bulkImport.mutateAsync({ rows: chunk });
        inserted += chunkResult.inserted;
        skipped += chunkResult.skipped;
        importErrors.push(
          ...chunkResult.errors.map((err) => ({
            row: err.rowIndex,
            field: "employeeId",
            message: err.message,
            value: err.employeeId,
          })),
        );
      }

      const summary = `นำเข้า ${inserted} รายการ, ข้าม ${skipped} รายการ${
        importErrors.length > 0 ? `, ล้มเหลว ${importErrors.length} รายการ` : ""
      }`;

      if (importErrors.length > 0) {
        setState({ status: "error", errors: importErrors });
        toast.warning(summary);
      } else {
        setState({ status: "success", operation: "import" });
        toast.success(summary);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      setState({
        status: "error",
        errors: [
          {
            row: 0,
            field: "file",
            message,
            value: null,
          },
        ],
      });
      toast.error(message);
    }
  };

  const onExport = async () => {
    setState({ status: "loading", operation: "export" });

    try {
      const data = await exportMutation.mutateAsync({
        query: searchQuery,
        division: division.length > 0 ? division : null,
        department: department.length > 0 ? department : null,
        rank: rank.length > 0 ? rank : null,
      });

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
        },
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
