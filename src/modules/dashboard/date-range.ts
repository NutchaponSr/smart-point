import { formatLocalizedDate } from "@/lib/format-thai-date";

export const DAY_MS = 24 * 60 * 60 * 1000;
/** ตรงกับ MAX_RANGE_MS ฝั่ง query — จำกัดช่วง 31 วัน */
export const MAX_RANGE_MS = 31 * DAY_MS;

export type DayRange = { from: number; to: number };

export function startOfDayMs(value: Date | number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function todayRange(): DayRange {
  const from = startOfDayMs(new Date());
  return { from, to: from + DAY_MS - 1 };
}

/** ค่าเริ่มต้น: ต้นเดือนปัจจุบันถึงสิ้นวันนี้ */
export function defaultRange(): DayRange {
  const now = new Date();
  const from = startOfDayMs(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = startOfDayMs(now);
  return { from, to: today + DAY_MS - 1 };
}

export function rangeLabel(from: number, to: number, locale = "th") {
  const sameDay = startOfDayMs(from) === startOfDayMs(to);
  if (sameDay) return formatLocalizedDate(from, locale);
  return `${formatLocalizedDate(from, locale)} - ${formatLocalizedDate(to, locale)}`;
}
