"use client";

import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { defaultCRPCTransformer } from "better-convex/crpc";

import { isLocalizedString } from "@/lib/i18n/localized";
import { useCRPC } from "@/lib/convex/crpc";
import { exportToExcel, importExcelWithValidation } from "@/lib/excel";

import type { ValidationError } from "@/types/excel";

import { eventExcelSchema } from "@/modules/events/schema";
import { eventHeaderMapping, eventHeaders } from "@/modules/events/constants";
import { formatBuExcelColumn } from "@/modules/events/utils/bu-labels";

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

function logImportErrorLines(errors: ValidationError[]) {
  for (const err of errors) {
    const value = err.value == null ? "" : ` | ค่า: ${String(err.value)}`;
    console.error(
      `[event-excel] แถว ${err.row} | ${err.field}: ${err.message}${value}`,
    );
  }
}

export function useEventExcel({
  searchQuery,
  view,
  minParticipants,
  maxParticipants,
}: Props) {
  const crpc = useCRPC();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ExcelOperationState>({ status: "idle" });

  const bulkCreate = useMutation(crpc.activity.bulkCreate.mutationOptions());
  const exportMutation = useMutation(crpc.activity.exportAll.mutationOptions());

  const onImport = async (file: File) => {
    setState({ status: "loading", operation: "import" });

    try {
      const result = await importExcelWithValidation(file, {
        schema: eventExcelSchema,
        headerMapping: eventHeaderMapping,
      });

      if (result.errors.length > 0) {
        logImportErrorLines(result.errors);
        setState({ status: "error", errors: result.errors });
        toast.error(`นำเข้าไม่สำเร็จ ${result.errors.length} แถว`);
        return;
      }

      const created = await bulkCreate.mutateAsync({
        rows: result.data.map((row) => ({
          name: { th: row.nameTh, en: row.nameEn },
          description: {
            th: row.descriptionTh,
            en: row.descriptionEn,
          },
          point: row.point,
          category: row.category,
          startDate: row.startDate,
          endDate: row.endDate ?? null,
          maxParticipants: row.maxParticipants,
          allowedDivisions: row.allowedDivisions,
          allowedDepartments: row.allowedDepartments ?? [],
        })),
      });

      setState({ status: "success", operation: "import" });
      toast.success(`นำเข้ากิจกรรมสำเร็จ ${created.inserted} รายการ`);
      await queryClient.invalidateQueries({
        queryKey: crpc.activity.getMany.queryKey(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      const errors: ValidationError[] = [
        {
          row: 0,
          field: "file",
          message,
          value: null,
        },
      ];
      logImportErrorLines(errors);
      setState({ status: "error", errors });
      toast.error(message);
    }
  };

  const onExport = async () => {
    setState({ status: "loading", operation: "export" });

    try {
      const raw = await exportMutation.mutateAsync({
        q: searchQuery,
        view,
        minParticipants,
        maxParticipants,
      });
      const data = defaultCRPCTransformer.deserialize(raw) as typeof raw;

      exportToExcel(
        data.map((e) => {
          const name = isLocalizedString(e.name)
            ? e.name
            : { th: String(e.name ?? ""), en: String(e.name ?? "") };
          const description = isLocalizedString(e.description)
            ? e.description
            : {
                th: String(e.description ?? ""),
                en: String(e.description ?? ""),
              };

          return {
            nameTh: name.th,
            nameEn: name.en,
            descriptionTh: description.th,
            descriptionEn: description.en,
            point: e.point,
            category: e.category,
            startDate: format(e.startDate, "LLL dd, y"),
            endDate: e.endDate ? format(e.endDate, "LLL dd, y") : "",
            maxParticipants: e.maxParticipants ?? "Unlimited",
            allowedDivisions: formatBuExcelColumn(e.allowedDivisions),
          };
        }),
        {
          filename: "event-export",
          sheetName: "Event Export",
          headers: eventHeaders as Record<string, string>,
        },
      );

      setState({ status: "success", operation: "export" });
    } catch (error) {
      console.error("[event-excel] export failed", error);
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
