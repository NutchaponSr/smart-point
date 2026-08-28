"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { BsFillXCircleFill } from "react-icons/bs";

import { pickLocalized } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { Selection } from "@/components/selection";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

export type K2ViewerEntry = {
  businessCode: string;
  name: string | null;
  department: string | null;
};

interface Props {
  /** รหัสพนักงานธุรกิจ (5 หลัก) */
  businessEmployeeId: string;
  mode: "create" | "edit";
  value?: K2ViewerEntry[];
  onChange?: (viewers: K2ViewerEntry[]) => void;
}

export const K2WorkflowViewers = ({
  businessEmployeeId,
  mode,
  value,
  onChange,
}: Props) => {
  const crpc = useCRPC();
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewers, setViewers] = useState<K2ViewerEntry[]>(value ?? []);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const normalizedSubjectId = businessEmployeeId.trim();

  const { data: detail } = useQuery({
    ...crpc.k2Workflow.getViewersDetail.queryOptions({
      employeeId: normalizedSubjectId || "_",
    }),
    enabled: mode === "edit" && normalizedSubjectId.length > 0,
  });

  const { data: searchResults } = useQuery({
    enabled: debouncedQuery.trim().length > 0,
    ...crpc.employee.search.queryOptions({
      query: debouncedQuery.trim() || "_",
    }),
  });

  const upsert = useMutation(crpc.k2Workflow.upsertViewers.mutationOptions());

  useEffect(() => {
    if (mode === "edit" && detail) {
      setViewers(detail.viewers);
    }
  }, [detail, mode]);

  useEffect(() => {
    if (mode === "create") {
      onChange?.(viewers);
    }
  }, [viewers, mode, onChange]);

  const updateViewers = (next: K2ViewerEntry[]) => {
    setViewers(next);
    if (mode === "create") {
      onChange?.(next);
    }
  };

  const addViewer = (option: {
    value: string;
    label: string;
    department?: string;
  }) => {
    if (viewers.some((v) => v.businessCode === option.value)) {
      toast.error("พนักงานคนนี้อยู่ในรายการแล้ว");
      return;
    }
    if (option.value === normalizedSubjectId) {
      toast.error("ไม่สามารถเพิ่มตัวพนักงานเองเป็นผู้ดูได้");
      return;
    }

    updateViewers([
      ...viewers,
      {
        businessCode: option.value,
        name: option.label,
        department: option.department ?? null,
      },
    ]);
    setSearchQuery("");
  };

  const removeViewer = (businessCode: string) => {
    updateViewers(viewers.filter((v) => v.businessCode !== businessCode));
  };

  const handleSave = () => {
    if (!normalizedSubjectId) {
      toast.error("กรุณาระบุรหัสพนักงานก่อน");
      return;
    }

    upsert.mutate(
      {
        employeeId: normalizedSubjectId,
        viewers: viewers.map((v) => v.businessCode),
      },
      {
        onSuccess: (result) => {
          toast.success(
            result.updated
              ? `อัปเดตสิทธิ์ดูธุรกรรมแล้ว (${result.count} คน)`
              : `ตั้งค่าสิทธิ์ดูธุรกรรมแล้ว (${result.count} คน)`,
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "บันทึกไม่สำเร็จ",
          );
        },
      },
    );
  };

  const searchOptions =
    searchResults
      ?.filter(
        (employee) =>
          employee.employeeId !== normalizedSubjectId &&
          !viewers.some((v) => v.businessCode === employee.employeeId),
      )
      .map((employee) => ({
        label: pickLocalized(employee.name, locale),
        value: employee.employeeId,
        department: pickLocalized(employee.department, locale),
      })) ?? [];

  const disabled = normalizedSubjectId.length === 0;

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-muted-foreground">
        ผู้มีสิทธิ์ดูธุรกรรมของพนักงานคนนี้ เช่น Manager, GM-AGM, VP หรือ
        President — ค้นหาและเพิ่มจากรายชื่อพนักงาน
      </p>

      <div
        className={cn(
          disabled && "pointer-events-none opacity-50",
          "[&_[class*='rounded-xs']]:rounded-xl",
          "[&_[class*='border-border']]:border-[#e5e5e5]",
        )}
      >
        <Selection
          placeholder="ค้นหาพนักงาน..."
          options={searchOptions}
          onSearch={async (q) => {
            setSearchQuery(q);
            return [];
          }}
          onSelect={(option) => {
            addViewer({
              value: option.value,
              label: option.label,
              department:
                searchResults?.find((e) => e.employeeId === option.value)
                  ?.department != null
                  ? pickLocalized(
                      searchResults.find((e) => e.employeeId === option.value)!
                        .department,
                      locale,
                    )
                  : undefined,
            });
          }}
        />
      </div>

      {disabled ? (
        <p className="text-xs text-muted-foreground">
          กรอกรหัสพนักงานก่อนจึงจะตั้งค่าสิทธิ์ได้
        </p>
      ) : null}

      {viewers.length > 0 ? (
        <ul className="grid gap-2">
          {viewers.map((viewer) => (
            <li
              key={viewer.businessCode}
              className="flex items-center gap-2 rounded-md border-2 border-border bg-background p-2"
            >
              <UserAvatar
                name={viewer.name ?? viewer.businessCode}
                className={{
                  container: "size-8 shrink-0",
                  fallback: "text-xs",
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {viewer.name ?? viewer.businessCode}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {viewer.businessCode}
                  {viewer.department ? ` · ${viewer.department}` : ""}
                </p>
              </div>
              <button
                type="button"
                aria-label={`ลบ ${viewer.businessCode}`}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                onClick={() => removeViewer(viewer.businessCode)}
              >
                <BsFillXCircleFill className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          ยังไม่มีผู้มีสิทธิ์ดู — เพิ่มจากช่องค้นหาด้านบน
        </p>
      )}

      {mode === "edit" ? (
        <Button
          type="button"
          size="lg"
          disabled={disabled || upsert.isPending}
          onClick={handleSave}
        >
          {upsert.isPending ? "กำลังบันทึก..." : "บันทึกสิทธิ์ K2"}
        </Button>
      ) : null}
    </div>
  );
};
