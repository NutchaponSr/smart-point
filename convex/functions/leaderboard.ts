import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import type { QueryCtx } from "./generated/server";
import { authQuery } from "../lib/crpc";

const DAY_MS = 24 * 60 * 60 * 1000;
const ALLOWED_PAGE_SIZES = [1, 25, 50, 100] as const;

const periodSchema = z.enum(["24hr", "7d", "30d", "fullTime"]);

type Period = z.infer<typeof periodSchema>;

function resolvePageSize(
  limit: number | undefined,
): (typeof ALLOWED_PAGE_SIZES)[number] {
  if (limit === undefined) return 1;
  if (
    ALLOWED_PAGE_SIZES.includes(limit as (typeof ALLOWED_PAGE_SIZES)[number])
  ) {
    return limit as (typeof ALLOWED_PAGE_SIZES)[number];
  }
  throw new CRPCError({
    code: "BAD_REQUEST",
    message: "Invalid limit. Allowed values are 1, 25, 50, 100.",
  });
}

function getPeriodStartMs(period: Period, nowMs: number): number | null {
  if (period === "24hr") return nowMs - DAY_MS;
  if (period === "7d") return nowMs - 7 * DAY_MS;
  if (period === "30d") return nowMs - 30 * DAY_MS;
  return null;
}

type RankedRow = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string | null;
  points: number;
  transactionCount: number;
  lastReceivedAt: number | null;
};

async function buildRankedRows(
  ctx: QueryCtx,
  period: Period,
  nowMs: number,
): Promise<RankedRow[]> {
  const startMs = getPeriodStartMs(period, nowMs);

  const [employees, completedTransactions] = await Promise.all([
    ctx.db.query("employee").collect(),
    ctx.db
      .query("transaction")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect(),
  ]);

  const aggregate = new Map<
    string,
    {
      points: number;
      transactionCount: number;
      lastReceivedAt: number | null;
    }
  >();

  for (const transaction of completedTransactions) {
    const occurredAt = transaction.createdAt ?? transaction._creationTime;
    if (startMs !== null && occurredAt < startMs) continue;
    if (occurredAt > nowMs) continue;

    const key = String(transaction.receiverId);
    const existing = aggregate.get(key) ?? {
      points: 0,
      transactionCount: 0,
      lastReceivedAt: null,
    };

    existing.points += transaction.amount;
    existing.transactionCount += 1;
    existing.lastReceivedAt = Math.max(
      existing.lastReceivedAt ?? 0,
      occurredAt,
    );

    aggregate.set(key, existing);
  }

  return employees
    .map((employee) => {
      const stats = aggregate.get(String(employee._id));
      return {
        employeeId: employee._id,
        employeeCode: employee.employeeId,
        employeeName: employee.name,
        department: employee.department ?? null,
        points: stats?.points ?? 0,
        transactionCount: stats?.transactionCount ?? 0,
        lastReceivedAt: stats?.lastReceivedAt ?? null,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        (b.lastReceivedAt ?? 0) - (a.lastReceivedAt ?? 0) ||
        a.employeeCode.localeCompare(b.employeeCode) ||
        String(a.employeeId).localeCompare(String(b.employeeId)),
    );
}

export const getMany = authQuery
  .input(
    z.object({
      period: periodSchema,
      limit: z.number().min(1).max(100),
      cursor: z.number().nullish(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const nowMs = Date.now();
    const pageSize = resolvePageSize(input.limit);
    const ranked = await buildRankedRows(ctx, input.period, nowMs);

    const startIndex = Math.max(0, input.cursor ?? 0);
    const endIndex = startIndex + pageSize;
    const pageSlice = ranked.slice(startIndex, endIndex);

    const rows = pageSlice.map((row, index) => ({
      rank: startIndex + index + 1,
      employeeId: row.employeeId,
      employeeCode: row.employeeCode,
      employeeName: row.employeeName,
      department: row.department,
      points: row.points,
      transactionCount: row.transactionCount,
      lastReceivedAt: row.lastReceivedAt,
    }));

    const continueCursor = endIndex >= ranked.length ? null : endIndex;

    return {
      page: rows,
      isDone: continueCursor === null,
      continueCursor,
    };
  });

export const getMyEntry = authQuery
  .input(
    z.object({
      period: periodSchema,
    }),
  )
  .query(async ({ ctx, input }) => {
    const nowMs = Date.now();
    const ranked = await buildRankedRows(ctx, input.period, nowMs);
    const myId = String(ctx.user.employee.id);

    const index = ranked.findIndex((row) => String(row.employeeId) === myId);
    if (index === -1) {
      return null;
    }

    const row = ranked[index]!;
    return {
      rank: index + 1,
      employeeId: row.employeeId,
      employeeCode: row.employeeCode,
      employeeName: row.employeeName,
      department: row.department,
      points: row.points,
      transactionCount: row.transactionCount,
      lastReceivedAt: row.lastReceivedAt,
    };
  });
