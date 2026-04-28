"use client";

import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { ApiOutputs } from "@convex/api";
import { useMutation } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { exportToExcel, importExcelWithValidation } from "@/lib/excel";

import type { ValidationError } from "@/types/excel";

import { participantSchema } from "@/modules/events/schema";
import { participantHeaderMapping, participantHeaders } from "@/modules/events/constants";

interface Props {
  activityId: string;
  data: ApiOutputs["activity"]["getOne"]["joinedEmployees"];
}

export type ExcelOperationState =
  | { status: "idle" }
  | { status: "loading"; operation: "import" | "export" }
  | { status: "error"; errors: ValidationError[] }
  | { status: "success"; operation: "import" | "export" };

export function useParticipantExcel({ activityId, data }: Props) {
  const crpc = useCRPC();
  const [state, setState] = useState<ExcelOperationState>({ status: "idle" });

  const bulkCreate = useMutation(crpc.activity.bulkAddParticipants.mutationOptions());

  const onImport = async (file: File) => {
    setState({ status: "loading", operation: "import" });

    try {
      const result = await importExcelWithValidation(file, {
        schema: participantSchema,
        headerMapping: participantHeaderMapping,
      });

      if (result.errors.length > 0) {
        setState({ status: "error", errors: result.errors });
        return;
      }

      await bulkCreate.mutateAsync({
        activityId,
        rows: result.data.map((row) => ({
          employeeIds: [String(row.employeeId)],
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
      exportToExcel(
        data.map((e) => ({
          employeeId: e.employeeCode,
          name: e.name,
          department: e.department,
          position: e.position,
          status: e.status,
        })),
        {
          filename: "participant-export",
          sheetName: "Participant Export",
          headers: participantHeaders as Record<string, string>,
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