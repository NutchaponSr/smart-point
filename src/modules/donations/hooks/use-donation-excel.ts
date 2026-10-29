"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { exportToExcel } from "@/lib/excel";
import { pickLocalized } from "@/lib/i18n/localized";

type DonationFilter = {
  q: string;
  min: number;
  max: number;
  from: number | null;
  to: number | null;
};

const donationHeaders: Record<string, string> = {
  employeeId: "รหัสพนักงาน",
  donorName: "ผู้บริจาค",
  department: "แผนก",
  division: "สังกัด",
  points: "พอยต์",
  createdAt: "วันที่",
};

function formatExportDate(value: number | null): string {
  if (value == null) return "";
  return format(new Date(value), "d MMM yyyy", { locale: th });
}

export function useDonationExcel(filters: DonationFilter) {
  const crpc = useCRPC();
  const locale = useLocale();
  const exportDonation = useMutation(crpc.donation.exportAll.mutationOptions());

  const onExport = async () => {
    try {
      const data = await exportDonation.mutateAsync({
        q: filters.q,
        min: filters.min,
        max: filters.max,
        from: filters.from,
        to: filters.to,
      });

      exportToExcel(
        data.map((row) => ({
          employeeId: row.employeeId,
          donorName: pickLocalized(row.donorName, locale),
          department: pickLocalized(row.department, locale),
          division: row.division,
          points: row.points,
          createdAt: formatExportDate(row.createdAt),
        })),
        {
          filename: "donation-export",
          sheetName: "บริจาค",
          headers: donationHeaders,
        },
      );
      toast.success("ดาวน์โหลดรายการบริจาคแล้ว");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ส่งออกรายการบริจาคไม่สำเร็จ",
      );
    }
  };

  return { onExport };
}
