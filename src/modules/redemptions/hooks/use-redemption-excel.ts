"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { exportToExcel } from "@/lib/excel";
import { pickLocalized } from "@/lib/i18n/localized";

import {
  shippingStatuses,
  statuses,
  type ShippingStatus,
} from "@/modules/rewards/constants";

type RedemptionStatus = "pending" | "fulfilled" | "cancelled";

type ShippingFilter = {
  q: string;
  shippingStatus: ShippingStatus[] | null;
  status: RedemptionStatus[] | null;
  sort: "recently-updated" | "purchase-date";
  from: number | null;
  to: number | null;
  by: string | null;
};

const shippingHeaders: Record<string, string> = {
  employeeId: "รหัสพนักงาน",
  employeeName: "พนักงาน",
  department: "แผนก",
  division: "สังกัด",
  rewardName: "รางวัล",
  quantity: "จำนวน",
  pointSpent: "พอยต์",
  shippingStatus: "สถานะจัดส่ง",
  status: "สถานะการแลก",
  trackingNumber: "เลขพัสดุ",
  carrier: "ขนส่ง",
  note: "หมายเหตุ",
  createdAt: "วันที่แลก",
  shippedAt: "วันที่จัดส่ง",
  deliveredAt: "วันที่ได้รับ",
};

function formatExportDate(value: number | null): string {
  if (value == null) return "";
  return format(new Date(value), "d MMM yyyy", { locale: th });
}

export function useRedemptionExcel(filters: ShippingFilter) {
  const crpc = useCRPC();
  const locale = useLocale();

  const exportShipping = useMutation(
    crpc.redemption.exportAll.mutationOptions(),
  );

  const onExport = async () => {
    try {
      const data = await exportShipping.mutateAsync({
        q: filters.q,
        shippingStatus: filters.shippingStatus,
        status: filters.status,
        sort: filters.sort,
        from: filters.from,
        to: filters.to,
        by: filters.by,
      });

      exportToExcel(
        data.map((row) => ({
          employeeId: row.employeeId,
          employeeName: pickLocalized(row.employeeName, locale),
          department: pickLocalized(row.department, locale),
          division: row.division,
          rewardName: pickLocalized(row.rewardName, locale),
          quantity: row.quantity,
          pointSpent: row.pointSpent,
          shippingStatus: shippingStatuses[row.shippingStatus].label,
          status: statuses[row.status as keyof typeof statuses],
          trackingNumber: row.trackingNumber ?? "",
          carrier: row.carrier ?? "",
          note: row.note ?? "",
          createdAt: formatExportDate(row.createdAt),
          shippedAt: formatExportDate(row.shippedAt),
          deliveredAt: formatExportDate(row.deliveredAt),
        })),
        {
          filename: "redemption-shipping-export",
          sheetName: "จัดส่งรางวัล",
          headers: shippingHeaders,
        },
      );
      toast.success("ดาวน์โหลดรายการจัดส่งแล้ว");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ส่งออกรายการจัดส่งไม่สำเร็จ",
      );
    }
  };

  return { onExport };
}
