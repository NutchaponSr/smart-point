"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { formatThaiDate } from "@/lib/format-thai-date";
import { isLocalizedString } from "@/lib/i18n/localized";
import { exportToExcel, importExcelWithValidation } from "@/lib/excel";

import type { ValidationError } from "@/types/excel";

import { participantSchema } from "@/modules/events/schema";
import {
  participantHeaderMapping,
  participantHeaders,
  statuses,
} from "@/modules/events/constants";

function toLocalizedPair(value: unknown): { th: string; en: string } {
  if (isLocalizedString(value)) return value;
  const text = value == null ? "" : String(value);
  return { th: text, en: text };
}

function statusLabel(status: string) {
  if (status in statuses) {
    return statuses[status as keyof typeof statuses].th;
  }
  if (status === "cancelled") return "ยกเลิก";
  return status;
}

function formatJoinedAt(value: unknown) {
  if (typeof value === "number") return formatThaiDate(value);
  if (value instanceof Date) return formatThaiDate(value);
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return formatThaiDate(parsed);
  }
  return "";
}

function participantFilename(name: { th: string; en: string }) {
  const raw = name.th || name.en || "participants";
  const safe = raw.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 50);
  return `participants-${safe || "export"}`;
}

interface Props {
  activityId: string;
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
      `[participant-excel] แถว ${err.row} | ${err.field}: ${err.message}${value}`,
    );
  }
}

export function useParticipantExcel({ activityId }: Props) {
  const crpc = useCRPC();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ExcelOperationState>({ status: "idle" });

  const bulkCreate = useMutation(crpc.activity.bulkAddParticipants.mutationOptions());
  const exportMutation = useMutation(
    crpc.activity.exportParticipants.mutationOptions(),
  );

  const onImport = async (file: File) => {
    setState({ status: "loading", operation: "import" });

    try {
      const result = await importExcelWithValidation(file, {
        schema: participantSchema,
        headerMapping: participantHeaderMapping,
      });

      if (result.errors.length > 0) {
        logImportErrorLines(result.errors);
        setState({ status: "error", errors: result.errors });
        toast.error(`นำเข้าไม่สำเร็จ ${result.errors.length} แถว`);
        return;
      }

      if (result.data.length === 0) {
        const errors: ValidationError[] = [
          {
            row: 0,
            field: "file",
            message: "ไม่มีข้อมูลให้นำเข้า",
            value: null,
          },
        ];
        logImportErrorLines(errors);
        setState({ status: "error", errors });
        toast.error("ไม่มีข้อมูลให้นำเข้า");
        return;
      }

      const created = await bulkCreate.mutateAsync({
        activityId,
        rows: result.data.map((row, index) => ({
          rowIndex: index + 1,
          employeeIds: [row.employeeId],
        })),
      });

      const importErrors: ValidationError[] = created.errors.map((err) => ({
        row: err.rowIndex,
        field: "employeeId",
        message: err.message,
        value: err.employeeId,
      }));
      const imported = created.added + created.reactivated;

      await queryClient.invalidateQueries({
        queryKey: crpc.activity.getOne.queryKey({ activityId }),
      });

      if (importErrors.length > 0) {
        logImportErrorLines(importErrors);
        setState({ status: "error", errors: importErrors });
        toast.error(
          imported > 0
            ? `นำเข้าได้ ${imported} รายการ, ไม่สำเร็จ ${importErrors.length} แถว`
            : `นำเข้าไม่สำเร็จ ${importErrors.length} แถว`,
        );
        return;
      }

      setState({ status: "success", operation: "import" });
      toast.success(`นำเข้าผู้เข้าร่วมสำเร็จ ${imported} รายการ`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "นำเข้าผู้เข้าร่วมไม่สำเร็จ";
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
      const data = await exportMutation.mutateAsync({ activityId });

      if (data.employees.length === 0) {
        setState({ status: "idle" });
        toast("ไม่มีผู้เข้าร่วมให้ส่งออก");
        return;
      }

      const activityName = toLocalizedPair(data.name);

      exportToExcel(
        data.employees.map((employee) => {
          const name = toLocalizedPair(employee.name);
          const department = toLocalizedPair(employee.department);
          const position = toLocalizedPair(employee.position);

          return {
            employeeId: employee.employeeCode,
            nameTh: name.th,
            nameEn: name.en,
            email: employee.email ?? "",
            departmentTh: department.th,
            departmentEn: department.en,
            positionTh: position.th,
            positionEn: position.en,
            status: employee.status,
            statusLabel: statusLabel(employee.status),
            evidence: employee.evidenceFileName ?? "",
            joinedAt: formatJoinedAt(employee.createdAt),
          };
        }),
        {
          filename: participantFilename(activityName),
          sheetName: "Participants",
          headers: participantHeaders,
        },
      );

      setState({ status: "success", operation: "export" });
      toast.success("ดาวน์โหลด Excel สำเร็จ");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ส่งออก Excel ไม่สำเร็จ";
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
