import z from "zod/v4";

import { requireAdmin } from "../lib/auth-helper";
import { authMutation, authQuery, privateMutation } from "../lib/crpc";
import { normalizeText } from "../lib/employee-id";
import { listVisibleSubjectBusinessCodes } from "../lib/k2-visibility";
import { localizedLabel } from "../lib/localized";
import type { Id } from "./_generated/dataModel";

const rowSchema = z.object({
  employeeId: z.string().trim().min(1),
  employees: z.array(z.string().trim().min(1)),
});

/**
 * Bulk upsert K2 visibility rows by business employee code.
 * Does not require matching rows in the `employee` table.
 */
export const bulkUpsert = privateMutation
  .input(
    z.object({
      rows: z.array(rowSchema).min(1).max(500),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    let inserted = 0;
    let updated = 0;

    for (const row of input.rows) {
      const employeeId = normalizeText(row.employeeId, 5);
      const employees = [
        ...new Set(row.employees.map((code) => normalizeText(code, 5))),
      ];

      const existing = await ctx.db
        .query("k2Workflow")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { employees });
        updated += 1;
      } else {
        await ctx.db.insert("k2Workflow", { employeeId, employees });
        inserted += 1;
      }
    }

    return { inserted, updated };
  });

export const getByEmployeeId = authQuery
  .input(
    z.object({
      employeeId: z.string().trim().min(1),
    }),
  )
  .query(async ({ ctx, input }) => {
    const employeeId = normalizeText(input.employeeId, 5);

    return await ctx.db
      .query("k2Workflow")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
      .unique();
  });

/** รายชื่อผู้มีสิทธิ์ดูธุรกรรมของพนักงานคนนี้ (admin) */
export const getViewersDetail = authQuery
  .input(
    z.object({
      employeeId: z.string().trim().min(1),
    }),
  )
  .query(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const employeeId = normalizeText(input.employeeId, 5);
    const row = await ctx.db
      .query("k2Workflow")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
      .unique();

    const viewers: Array<{
      businessCode: string;
      name: string | null;
      department: string | null;
    }> = [];

    for (const rawCode of row?.employees ?? []) {
      const businessCode = normalizeText(String(rawCode ?? ""), 5);
      if (!businessCode) continue;

      const employee = await ctx.db
        .query("employee")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", businessCode))
        .first();

      viewers.push({
        businessCode,
        name: employee ? localizedLabel(employee.name) : null,
        department: employee ? localizedLabel(employee.department) : null,
      });
    }

    return { employeeId, viewers };
  });

/** ตั้งรายชื่อผู้มีสิทธิ์ดูธุรกรรมของพนักงาน (admin) */
export const upsertViewers = authMutation
  .input(
    z.object({
      employeeId: z.string().trim().min(1),
      viewers: z.array(z.string().trim().min(1)).max(20),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const employeeId = normalizeText(input.employeeId, 5);
    const employees = [
      ...new Set(
        input.viewers
          .map((code) => normalizeText(code, 5))
          .filter((code) => code.length > 0 && code !== employeeId),
      ),
    ];

    const existing = await ctx.db
      .query("k2Workflow")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { employees });
      return { updated: true as const, employeeId, count: employees.length };
    }

    await ctx.db.insert("k2Workflow", { employeeId, employees });
    return { updated: false as const, employeeId, count: employees.length };
  });

/** รายการรหัสพนักงานที่ผู้ใช้ปัจจุบันมีสิทธิ์ดูธุรกรรม (k2) */
export const listVisibleSubjects = authQuery.query(async ({ ctx }) => {
  const viewerCode = normalizeText(ctx.user.employee.employeeId, 5);
  const businessCodes = await listVisibleSubjectBusinessCodes(ctx, viewerCode);
  const employeeDocIds: Id<"employee">[] = [];

  for (const code of businessCodes) {
    const employee = await ctx.db
      .query("employee")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", code))
      .first();
    if (employee) {
      employeeDocIds.push(employee._id);
    }
  }

  return {
    businessCodes,
    employeeDocIds,
    count: businessCodes.length,
  };
});
