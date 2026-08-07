import { CRPCError } from "better-convex/server";

/** Asia/Bangkok = UTC+7 */
export const THAI_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * หมดเขตแลกรางวัล: สิ้นวันที่ 16 ธ.ค. 2026 (2569) ตามเวลาไทย
 * ค่านี้เป็น exclusive — หลัง 17 ธ.ค. 2026 00:00 ICT แลกไม่ได้
 */
export const REDEMPTION_DEADLINE_EXCLUSIVE_MS =
  Date.UTC(2026, 11, 17) - THAI_OFFSET_MS;

export function isRedemptionOpen(nowMs = Date.now()): boolean {
  return nowMs < REDEMPTION_DEADLINE_EXCLUSIVE_MS;
}

export function assertRedemptionOpen(nowMs = Date.now()): void {
  if (!isRedemptionOpen(nowMs)) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "หมดเขตรับแลกรางวัลแล้ว",
    });
  }
}

export function thaiDateParts(nowMs = Date.now()): {
  year: number;
  month: number;
  day: number;
} {
  const thai = new Date(nowMs + THAI_OFFSET_MS);
  return {
    year: thai.getUTCFullYear(),
    month: thai.getUTCMonth(),
    day: thai.getUTCDate(),
  };
}

export function thaiDateKey(nowMs = Date.now()): string {
  const { year, month, day } = thaiDateParts(nowMs);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** ขอบเดือนตามปฏิทิน Asia/Bangkok — end เป็น exclusive */
export function thaiMonthRange(nowMs = Date.now()): {
  start: number;
  end: number;
} {
  const { year, month } = thaiDateParts(nowMs);
  const start = Date.UTC(year, month, 1) - THAI_OFFSET_MS;
  const end = Date.UTC(year, month + 1, 1) - THAI_OFFSET_MS;
  return { start, end };
}

export function thaiMonthKey(nowMs = Date.now()): string {
  const { year, month } = thaiDateParts(nowMs);
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * ช่วงสรุปปักษ์ก่อนหน้า เมื่อรันตอนต้นวันที่ 1 หรือ 16 (ICT)
 * - วันที่ 1 → สรุป 16 ของเดือนก่อน ถึงสิ้นเดือนก่อน
 * - วันที่ 16 → สรุป 1–15 ของเดือนนี้
 */
export function previousFortnightRange(nowMs = Date.now()): {
  start: number;
  end: number;
  periodKey: string;
} {
  const { year, month, day } = thaiDateParts(nowMs);

  if (day === 1) {
    const start = Date.UTC(year, month - 1, 16) - THAI_OFFSET_MS;
    const end = Date.UTC(year, month, 1) - THAI_OFFSET_MS;
    const prev = new Date(Date.UTC(year, month - 1, 16));
    const periodKey = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}-16`;
    return { start, end, periodKey };
  }

  if (day === 16) {
    const start = Date.UTC(year, month, 1) - THAI_OFFSET_MS;
    const end = Date.UTC(year, month, 16) - THAI_OFFSET_MS;
    const periodKey = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    return { start, end, periodKey };
  }

  throw new Error("previousFortnightRange is only valid on Thai day 1 or 16");
}
