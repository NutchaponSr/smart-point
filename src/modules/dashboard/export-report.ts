import * as XLSX from "xlsx";

import { formatThaiDate } from "@/lib/format-thai-date";

import type { DayRange } from "@/modules/dashboard/date-range";
import { rangeLabel } from "@/modules/dashboard/date-range";

type KpiData = {
  login: { firstLoginCount: number; totalEmployees: number };
  praise: { total: number; praisePoints: number; eventPoints: number };
  events: { participantCount: number };
  rewards: {
    redeemedItemCount: number;
    redeemedPoints: number;
    redemptionCount: number;
  };
};

type CultureData = {
  trend: Array<{ date: number; count: number; points: number }>;
  topDepartments: Array<{
    department: string;
    count: number;
    points: number;
  }>;
};

type OutcomeData = {
  topRewards: Array<{
    rewardId: string;
    name: string;
    quantity: number;
    points: number;
  }>;
  distribution: Array<{ label: string; count: number; color: string }>;
  donation: { points: number; baht: number; count: number };
  recentTransactions: Array<{
    id: string;
    amount: number;
    message: string;
    tags: string;
    createdAt: number;
    sender: { name: string; department: string };
    receiver: { name: string; department: string };
  }>;
};

export type DashboardReportData = {
  range: DayRange;
  kpis: KpiData;
  culture: CultureData;
  outcome: OutcomeData;
};

function reportFilename(range: DayRange, ext: "xlsx" | "pdf") {
  const from = formatThaiDate(range.from).replace(/\s+/g, "-");
  const to = formatThaiDate(range.to).replace(/\s+/g, "-");
  return `smart-point-dashboard_${from}_${to}.${ext}`;
}

function appendSheet(
  workbook: XLSX.WorkBook,
  name: string,
  rows: Record<string, string | number>[],
) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.length > 0 ? rows : [{ หมายเหตุ: "ไม่มีข้อมูล" }],
  );
  XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
}

export function downloadDashboardExcel(data: DashboardReportData) {
  const { range, kpis, culture, outcome } = data;
  const workbook = XLSX.utils.book_new();
  const period = rangeLabel(range.from, range.to);

  appendSheet(workbook, "KPI", [
    { หัวข้อ: "ช่วงวันที่", ค่า: period },
    {
      หัวข้อ: "พนักงานที่เข้าใช้งานแล้ว (first login)",
      ค่า: kpis.login.firstLoginCount,
    },
    { หัวข้อ: "พนักงานทั้งหมด", ค่า: kpis.login.totalEmployees },
    { หัวข้อ: "คะแนนที่ส่งรวม", ค่า: kpis.praise.total },
    { หัวข้อ: "คะแนนคำชม (P2P)", ค่า: kpis.praise.praisePoints },
    { หัวข้อ: "คะแนนกิจกรรม", ค่า: kpis.praise.eventPoints },
    {
      หัวข้อ: "พนักงานเข้าร่วมกิจกรรม",
      ค่า: kpis.events.participantCount,
    },
    {
      หัวข้อ: "จำนวนรางวัลที่แลก (ชิ้น)",
      ค่า: kpis.rewards.redeemedItemCount,
    },
    {
      หัวข้อ: "มูลค่ารางวัลที่แลก (คะแนน)",
      ค่า: kpis.rewards.redeemedPoints,
    },
  ]);

  appendSheet(
    workbook,
    "แนวโน้มคำชม",
    culture.trend.map((row) => ({
      วันที่: formatThaiDate(row.date),
      จำนวนครั้ง: row.count,
      คะแนน: row.points,
    })),
  );

  appendSheet(
    workbook,
    "แผนกผู้ส่ง",
    culture.topDepartments.map((row) => ({
      แผนก: row.department,
      จำนวนครั้ง: row.count,
      คะแนน: row.points,
    })),
  );

  appendSheet(
    workbook,
    "รางวัลยอดนิยม",
    outcome.topRewards.map((row) => ({
      รางวัล: row.name,
      จำนวนชิ้น: row.quantity,
      คะแนน: row.points,
    })),
  );

  appendSheet(
    workbook,
    "กระจายคะแนนปัจจุบัน",
    outcome.distribution.map((row) => ({
      ช่วงคะแนน: row.label,
      จำนวนคน: row.count,
    })),
  );

  appendSheet(workbook, "บริจาค", [
    { หัวข้อ: "คะแนนที่บริจาค", ค่า: outcome.donation.points },
    { หัวข้อ: "มูลค่า (บาท)", ค่า: outcome.donation.baht },
    { หัวข้อ: "จำนวนรายการ", ค่า: outcome.donation.count },
  ]);

  appendSheet(
    workbook,
    "คำชมล่าสุด",
    outcome.recentTransactions.map((row) => ({
      วันที่: formatThaiDate(row.createdAt),
      ผู้ส่ง: row.sender.name,
      แผนกผู้ส่ง: row.sender.department,
      ผู้รับ: row.receiver.name,
      แผนกผู้รับ: row.receiver.department,
      คะแนน: row.amount,
      ข้อความ: row.message,
      แท็ก: row.tags,
    })),
  );

  XLSX.writeFile(workbook, reportFilename(range, "xlsx"));
}

export function downloadDashboardPdf(data: DashboardReportData) {
  const { range, kpis, culture, outcome } = data;
  const period = rangeLabel(range.from, range.to);
  const filename = reportFilename(range, "pdf");

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(filename)}</title>
  <style>
    body { font-family: "Tahoma", "Segoe UI", sans-serif; color: #4b4b4b; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 16px; margin: 24px 0 8px; color: #1cb0f6; }
    p { margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
    th, td { border: 1px solid #e5e5e5; padding: 6px 8px; text-align: left; }
    th { background: #ddf4ff; }
    .meta { color: #777; margin-bottom: 16px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>แดชบอร์ดระบบ SMART POINT Recognition</h1>
  <p class="meta">ช่วงวันที่: ${escapeHtml(period)}</p>

  <h2>1. สรุป KPI</h2>
  <table>
    <tr><th>หัวข้อ</th><th>ค่า</th></tr>
    <tr><td>พนักงานที่เข้าใช้งานแล้ว</td><td>${kpis.login.firstLoginCount} / ${kpis.login.totalEmployees}</td></tr>
    <tr><td>คะแนนที่ส่งรวม</td><td>${kpis.praise.total} (คำชม ${kpis.praise.praisePoints} | กิจกรรม ${kpis.praise.eventPoints})</td></tr>
    <tr><td>พนักงานเข้าร่วมกิจกรรม</td><td>${kpis.events.participantCount}</td></tr>
    <tr><td>รางวัลที่แลก</td><td>${kpis.rewards.redeemedItemCount} ชิ้น / ${kpis.rewards.redeemedPoints} คะแนน</td></tr>
  </table>

  <h2>2. แผนกที่ส่งคำชมมากที่สุด</h2>
  <table>
    <tr><th>แผนก</th><th>จำนวนครั้ง</th><th>คะแนน</th></tr>
    ${
      culture.topDepartments.length === 0
        ? "<tr><td colspan='3'>ไม่มีข้อมูล</td></tr>"
        : culture.topDepartments
            .map(
              (row) =>
                `<tr><td>${escapeHtml(row.department)}</td><td>${row.count}</td><td>${row.points}</td></tr>`,
            )
            .join("")
    }
  </table>

  <h2>3. ของรางวัลที่แลกบ่อยสุด</h2>
  <table>
    <tr><th>รางวัล</th><th>จำนวนชิ้น</th><th>คะแนน</th></tr>
    ${
      outcome.topRewards.length === 0
        ? "<tr><td colspan='3'>ไม่มีข้อมูล</td></tr>"
        : outcome.topRewards
            .map(
              (row) =>
                `<tr><td>${escapeHtml(row.name)}</td><td>${row.quantity}</td><td>${row.points}</td></tr>`,
            )
            .join("")
    }
  </table>

  <h2>การกระจายคะแนนปัจจุบัน (รับ + special)</h2>
  <table>
    <tr><th>ช่วงคะแนน</th><th>จำนวนคน</th></tr>
    ${outcome.distribution
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.label)}</td><td>${row.count}</td></tr>`,
      )
      .join("")}
  </table>

  <h2>บริจาค</h2>
  <table>
    <tr><th>คะแนน</th><th>บาท</th><th>รายการ</th></tr>
    <tr><td>${outcome.donation.points}</td><td>${outcome.donation.baht}</td><td>${outcome.donation.count}</td></tr>
  </table>

  <script>
    window.onload = function () {
      window.print();
    };
  </script>
</body>
</html>`;

  const popup = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=900,height=700",
  );
  if (!popup) {
    throw new Error("เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาตป๊อปอัป");
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}
