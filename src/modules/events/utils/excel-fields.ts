import { isValid, parse } from "date-fns";
import z from "zod/v4";

const EXCEL_DATE_FORMATS = [
  "LLL dd, y",
  "LLL d, y",
  "dd LLL yyyy",
  "d MMM yyyy",
  "yyyy-MM-dd",
  "M/d/yyyy",
  "M/d/yy",
] as const;

function excelSerialToMs(serial: number): number {
  return Math.round((serial - 25569) * 86400 * 1000);
}

/** แปลงค่าวันที่จาก Excel (สตริง export, serial number, Date) เป็น epoch ms */
export function parseExcelDate(value: unknown): number | null {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    return isValid(value) ? value.getTime() : null;
  }

  if (typeof value === "number") {
    if (value > 1e12) return value;
    if (value > 0 && value < 1_000_000) return excelSerialToMs(value);
    return null;
  }

  const text = String(value).trim();
  if (!text) return null;

  for (const format of EXCEL_DATE_FORMATS) {
    const parsed = parse(text, format, new Date());
    if (isValid(parsed)) return parsed.getTime();
  }

  const fallback = Date.parse(text);
  return Number.isNaN(fallback) ? null : fallback;
}

export const excelDateField = z
  .union([z.number(), z.string(), z.date(), z.null()])
  .transform((value, ctx) => {
    const parsed = parseExcelDate(value);
    if (parsed == null) {
      ctx.addIssue({
        code: "custom",
        message: "รูปแบบวันที่ไม่ถูกต้อง",
      });
      return z.NEVER;
    }
    return parsed;
  });

export const excelOptionalDateField = z
  .union([z.number(), z.string(), z.date(), z.null()])
  .optional()
  .transform((value) => parseExcelDate(value ?? null));
