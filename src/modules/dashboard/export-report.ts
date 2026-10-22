import * as XLSX from "xlsx";

import { formatThaiDate } from "@/lib/format-thai-date";

import type { DayRange } from "@/modules/dashboard/date-range";
import { rangeLabel } from "@/modules/dashboard/date-range";

type KpiData = {
  login: {
    firstLoginCount: number;
    totalEmployees: number;
    byDivision: Array<{ affiliation: string; people: number }>;
  };
  praise: { total: number; praisePoints: number; eventPoints: number };
  events: { participantCount: number };
  rewards: {
    redeemedItemCount: number;
    redeemedPoints: number;
    redemptionCount: number;
  };
};

type CultureData = {
  trend: Array<{
    date: number;
    praisePoints: number;
    praiseCount: number;
    activityPoints: number;
  }>;
  praiseAffiliations: Array<{
    affiliation: string;
    people: number;
    sends: number;
    points: number;
  }>;
  activityAffiliations: Array<{
    affiliation: string;
    people: number;
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
    sender: { name: string; department: string; affiliation: string };
    receiver: { name: string; department: string; affiliation: string };
  }>;
};

export type DashboardReportData = {
  range: DayRange;
  /** slug ของ BU ที่เลือก — null คือทุกสังกัด */
  division: string | null;
  divisionLabel: string;
  kpis: KpiData;
  culture: CultureData;
  outcome: OutcomeData;
};

function reportFilename(range: DayRange, division: string | null) {
  const from = formatThaiDate(range.from).replace(/\s+/g, "-");
  const to = formatThaiDate(range.to).replace(/\s+/g, "-");
  const bu = division?.trim() || "all";
  return `smart-point-dashboard_${bu}_${from}_${to}.xlsx`;
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
  const { range, division, divisionLabel, kpis, culture, outcome } = data;
  const workbook = XLSX.utils.book_new();
  const period = rangeLabel(range.from, range.to);
  const firstLoginByBu = division
    ? kpis.login.byDivision.filter((row) => row.affiliation === division)
    : kpis.login.byDivision;

  appendSheet(workbook, "KPI", [
    { หัวข้อ: "ช่วงวันที่", ค่า: period },
    { หัวข้อ: "สังกัด", ค่า: divisionLabel },
    {
      หัวข้อ: "พนักงานที่เข้าใช้งานครั้งแรกในช่วงวันที่",
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
    "First login ตาม BU",
    firstLoginByBu.map((row) => ({
      BU: row.affiliation,
      จำนวนคน: row.people,
    })),
  );

  appendSheet(
    workbook,
    "แนวโน้มคำชม",
    culture.trend.map((row) => ({
      วันที่: formatThaiDate(row.date),
      จำนวนครั้งคำชม: row.praiseCount,
      คะแนนคำชม: row.praisePoints,
      คะแนนกิจกรรม: row.activityPoints,
    })),
  );

  appendSheet(
    workbook,
    "สังกัดที่ส่งคำชม",
    culture.praiseAffiliations.map((row) => ({
      สังกัด: row.affiliation,
      จำนวนคน: row.people,
      จำนวนครั้ง: row.sends,
      คะแนน: row.points,
    })),
  );

  appendSheet(
    workbook,
    "สังกัดที่ร่วมกิจกรรม",
    culture.activityAffiliations.map((row) => ({
      สังกัด: row.affiliation,
      จำนวนคน: row.people,
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
      สังกัดผู้ส่ง: row.sender.affiliation,
      แผนกผู้ส่ง: row.sender.department,
      ผู้รับ: row.receiver.name,
      สังกัดผู้รับ: row.receiver.affiliation,
      แผนกผู้รับ: row.receiver.department,
      คะแนน: row.amount,
      ข้อความ: row.message,
      แท็ก: row.tags,
    })),
  );

  XLSX.writeFile(workbook, reportFilename(range, division));
}
