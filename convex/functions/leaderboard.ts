import z from "zod/v4";
import { authQuery } from "../lib/crpc";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

const periodSchema = z.enum(["24hr", "7d", "30d", "fullTime"]);

type Period = z.infer<typeof periodSchema>;

function getPeriodStartMs(period: Period, nowMs: number): number | null {
  if (period === "24hr") return nowMs - DAY_MS;
  if (period === "7d") return nowMs - 7 * DAY_MS;
  if (period === "30d") return nowMs - 30 * DAY_MS;
  return null;
}

/** Same rules as `employee.getMany` — filter leaderboard rows by searchable fields. */
function matchesEmployeeSearch(
  row: {
    employeeId: string;
    name: string;
    email: string | null;
    department: string;
    position: string;
    rank: string;
    division: string;
  },
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true;
  return (
    row.employeeId.toLowerCase().includes(normalizedQuery) ||
    row.name.toLowerCase().includes(normalizedQuery) ||
    row.department.toLowerCase().includes(normalizedQuery) ||
    row.position.toLowerCase().includes(normalizedQuery) ||
    row.rank.toLowerCase().includes(normalizedQuery) ||
    row.division.toLowerCase().includes(normalizedQuery) ||
    (row.email ?? "").toLowerCase().includes(normalizedQuery)
  );
}

function leaderboardEmployeeBaseQuery(ctx: QueryCtx, normalizedQuery: string | null | undefined) {
  return ctx.orm.query.employee
    .select()
    .withIndex("by_employeeId")
    .orderBy({ employeeId: "asc" })
    .filter(
      (row) =>
        row.rank !== "Admin" &&
        (normalizedQuery == null || matchesEmployeeSearch(row, normalizedQuery)),
    )
    .map((row) => row);
}

async function collectFilteredEmployees(
  ctx: QueryCtx,
  normalizedQuery: string | null | undefined,
): Promise<
  Array<{
    _id: Id<"employee">;
    employeeCode: string;
    employeeName: string;
    department: string | null;
  }>
> {
  const baseQuery = leaderboardEmployeeBaseQuery(ctx, normalizedQuery);
  const out: Array<{
    _id: Id<"employee">;
    employeeCode: string;
    employeeName: string;
    department: string | null;
  }> = [];

  let cursor: string | null = null;

  while (true) {
    const pageResult = await baseQuery.paginate({
      cursor,
      limit: 100,
    });

    for (const row of pageResult.page) {
      out.push({
        _id: row.id as Id<"employee">,
        employeeCode: row.employeeId,
        employeeName: row.name,
        department: row.department ?? null,
      });
    }

    if (pageResult.isDone || pageResult.continueCursor == null) {
      break;
    }
    cursor = pageResult.continueCursor;
  }

  return out;
}

type RankedRow = {
  employeeId: Id<"employee">;
  employeeCode: string;
  employeeName: string;
  department: string | null;
  points: number;
  transactionCount: number;
  lastReceivedAt: number | null;
};

function parseOffsetCursor(raw: string | null | undefined): number {
  if (raw == null || raw.trim() === "") return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function buildRankedRows(
  ctx: QueryCtx,
  period: Period,
  nowMs: number,
  normalizedQuery: string | null | undefined,
): Promise<RankedRow[]> {
  const startMs = getPeriodStartMs(period, nowMs);

  const [employees, completedTransactions] = await Promise.all([
    collectFilteredEmployees(ctx, normalizedQuery),
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
        employeeCode: employee.employeeCode,
        employeeName: employee.employeeName,
        department: employee.department,
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
      cursor: z.string().nullish(),
      q: z.string().optional().nullable(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const nowMs = Date.now();
    const normalizedQuery = input.q?.trim().toLowerCase() ?? "";
    const ranked = await buildRankedRows(
      ctx,
      input.period,
      nowMs,
      normalizedQuery,
    );

    const startIndex = parseOffsetCursor(input.cursor ?? null);
    const endIndex = startIndex + input.limit;
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

    const continueCursor = endIndex >= ranked.length ? null : String(endIndex);
    const hasNextPage = continueCursor !== null;

    return {
      page: rows,
      continueCursor,
      hasNextPage,
      isDone: !hasNextPage,
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
    const ranked = await buildRankedRows(
      ctx,
      input.period,
      nowMs,
      null,
    );
    const myId = String(ctx.user.employee.id);

    const index = ranked.findIndex((row) => String(row.employeeId) === myId);
    if (index === -1) {
      return null;
    }

    const row = ranked.at(index);
    if (row == null) {
      return null;
    }
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
