"use client";

import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { exportToExcel, importExcelWithValidation } from "@/lib/excel";

import type { ValidationError } from "@/types/excel";

import { eventSchema } from "@/modules/events/schema";
import { eventHeaderMapping, eventHeaders } from "@/modules/events/constants";

type EventCategory = "external" | "internal" | "internal_bu" | "specials_point";

interface Props {
  searchQuery: string;
  view: EventCategory[] | null;
  minParticipants: number | null;
  maxParticipants: number | null;
}

export type ExcelOperationState =
  | { status: "idle" }
  | { status: "loading"; operation: "import" | "export" }
  | { status: "error"; errors: ValidationError[] }
  | { status: "success"; operation: "import" | "export" };

export function useEventExcel({
  searchQuery,
  view,
  minParticipants,
  maxParticipants,
}: Props) {
  const crpc = useCRPC();
  const [state, setState] = useState<ExcelOperationState>({ status: "idle" });

  const bulkCreate = useMutation(crpc.activity.bulkCreate.mutationOptions());
  const exportMutation = useMutation(crpc.activity.exportAll.mutationOptions());

  const onImport = async (file: File) => {
    setState({ status: "loading", operation: "import" });

    try {
      const result = await importExcelWithValidation(file, {
        schema: eventSchema,
        headerMapping: eventHeaderMapping,
      });

      if (result.errors.length > 0) {
        setState({ status: "error", errors: result.errors });
        return;
      }

      await bulkCreate.mutateAsync({
        rows: result.data.map((row) => ({
          name: row.name,
          description: row.description,
          point: row.point,
          category: row.category,
          startDate: row.startDate,
          endDate: row.endDate,
          maxParticipants: row.maxParticipants,
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
        view,
        minParticipants,
        maxParticipants,
      });

      exportToExcel(
        data.map((e) => ({
          name: e.name,
          description: e.description,
          point: e.point,
          category: e.category,
          startDate: format(new Date(e.startDate), "LLL dd, y"),
          endDate: e.endDate ? format(new Date(e.endDate), "LLL dd, y") : "",
          maxParticipants: e.maxParticipants ?? "Unlimited",
        })),
        {
          filename: "event-export",
          sheetName: "Event Export",
          headers: eventHeaders as Record<string, string>,
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