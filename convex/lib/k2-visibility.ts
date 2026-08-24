import type { GenericQueryCtx } from "convex/server";

import type { DataModel, Id } from "../functions/_generated/dataModel";
import { normalizeText } from "./employee-id";

type DbCtx = GenericQueryCtx<DataModel>;

/** จำนวน subject สูงสุดต่อ viewer ต่อคำขอ (กันอ่านเกิน) */
export const K2_VISIBLE_SUBJECT_LIMIT = 64;

/** สแกน k2Workflow ได้สูงสุดเท่านี้ (ตารางเล็ก ~200 แถว) */
const K2_SCAN_LIMIT = 500;

/**
 * รหัสพนักงาน (business code) ที่ viewer มีสิทธิ์ดูธุรกรรม
 * จาก k2Workflow.employees รวม viewerCode → คืน employeeId ของแถวนั้น
 *
 * หมายเหตุ: Convex ไม่รองรับ array-contains บน index
 * (index บน array ใช้ได้แค่ equality ของทั้งอาเรย์) จึงสแกนแล้ว `.includes`
 */
export async function listVisibleSubjectBusinessCodes(
  ctx: DbCtx,
  viewerBusinessCode: string,
): Promise<string[]> {
  const viewerCode = normalizeText(viewerBusinessCode, 5);
  const rows = await ctx.db.query("k2Workflow").take(K2_SCAN_LIMIT);

  const subjects: string[] = [];
  for (const row of rows) {
    const managers = row.employees ?? [];
    const hasViewer = managers.some(
      (code) => normalizeText(String(code ?? ""), 5) === viewerCode,
    );
    if (!hasViewer) continue;
    subjects.push(normalizeText(row.employeeId, 5));
    if (subjects.length >= K2_VISIBLE_SUBJECT_LIMIT) break;
  }

  return [...new Set(subjects)];
}

/**
 * แปลงรหัสธุรกิจ → Convex employee document Id (ข้ามคนที่ยังไม่มีในตาราง employee)
 */
export async function listVisibleSubjectEmployeeDocIds(
  ctx: DbCtx,
  viewerBusinessCode: string,
): Promise<Id<"employee">[]> {
  const codes = await listVisibleSubjectBusinessCodes(ctx, viewerBusinessCode);
  const ids: Id<"employee">[] = [];

  for (const code of codes) {
    const employee = await ctx.db
      .query("employee")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", code))
      .first();
    if (employee) {
      ids.push(employee._id);
    }
  }

  return ids;
}
