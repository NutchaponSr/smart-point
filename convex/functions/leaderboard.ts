import z from "zod/v4";
import { authQuery } from "../lib/crpc";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

const periodSchema = z.enum(["30d", "fullTime"]);

type Period = z.infer<typeof periodSchema>;

function getPeriodStartMs(period: Period, nowMs: number): number | null {
  if (period === "30d") return nowMs - 30 * DAY_MS;
  return null;
}

type EmployeeListRow = {
  employeeId: string;
  name: string;
  email: string | null;
  department: string;
  position: string;
  rank: string;
  division: string;
};

type LeaderboardEmployeeFilters = {
  query?: string | null;
  division?: string[] | null;
};

function normalizeFilterArray(
  value: string[] | null | undefined,
): string[] {
  if (value == null || value.length === 0) return [];
  return [
    ...new Set(
      value
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  ];
}

/** Same rules as `employee.getMany` — filter leaderboard rows by searchable fields. */
function matchesEmployeeSearch(
  row: EmployeeListRow,
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

function matchesLeaderboardEmployeeFilters(
  row: EmployeeListRow,
  filters: {
    divisions: string[];
    normalizedQuery: string;
  },
): boolean {
  if (
    filters.divisions.length > 0 &&
    !filters.divisions.includes(row.division)
  ) {
    return false;
  }
  return (
    row.rank !== "Admin" &&
    matchesEmployeeSearch(row, filters.normalizedQuery)
  );
}

function leaderboardEmployeeBaseQuery(
  ctx: QueryCtx,
  input: LeaderboardEmployeeFilters,
) {
  const divisions = normalizeFilterArray(input.division);
  const normalizedQuery = input.query?.trim().toLowerCase() ?? "";
  const matches = (row: EmployeeListRow) =>
    matchesLeaderboardEmployeeFilters(row, {
      divisions,
      normalizedQuery,
    });

  if (divisions.length === 1) {
    return ctx.orm.query.employee
      .select()
      .withIndex("by_division_employeeId", (q) =>
        q.eq("division", divisions[0]!),
      )
      .orderBy({ employeeId: "asc" })
      .filter(matches)
      .map((row) => row);
  }

  return ctx.orm.query.employee
    .select()
    .withIndex("by_employeeId")
    .orderBy({ employeeId: "asc" })
    .filter(matches)
    .map((row) => row);
}

async function collectFilteredEmployees(
  ctx: QueryCtx,
  filters: LeaderboardEmployeeFilters,
): Promise<
  Array<{
    _id: Id<"employee">;
    employeeCode: string;
    employeeName: string;
    department: string | null;
  }>
> {
  const baseQuery = leaderboardEmployeeBaseQuery(ctx, filters);
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
  filters: LeaderboardEmployeeFilters,
): Promise<RankedRow[]> {
  const startMs = getPeriodStartMs(period, nowMs);

  const [employees, completedTransactions] = await Promise.all([
    collectFilteredEmployees(ctx, filters),
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
      division: z.array(z.string()).optional().nullable(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const nowMs = Date.now();

    const [globalRanked, filteredRanked] = await Promise.all([
      buildRankedRows(ctx, input.period, nowMs, {
        query: null,
        division: null,
      }),
      buildRankedRows(ctx, input.period, nowMs, {
        query: input.q,
        division: input.division,
      }),
    ]);

    const globalRankByEmployeeId = new Map(
      globalRanked.map((row, index) => [String(row.employeeId), index + 1]),
    );

    const startIndex = parseOffsetCursor(input.cursor ?? null);
    const endIndex = startIndex + input.limit;
    const pageSlice = filteredRanked.slice(startIndex, endIndex);

    const avatarEntries = await Promise.all(
      pageSlice.map(async (row) => {
        const user = await ctx.db
          .query("user")
          .withIndex("by_employeeId", (q) =>
            q.eq("employeeId", row.employeeId),
          )
          .first();
        return [String(row.employeeId), user?.image ?? null] as const;
      }),
    );
    const avatarByEmployeeId = new Map(avatarEntries);

    const rows = pageSlice.flatMap((row) => {
      const rank = globalRankByEmployeeId.get(String(row.employeeId));
      if (rank == null) return [];

      return [
        {
          rank,
          employeeId: row.employeeId,
          employeeCode: row.employeeCode,
          employeeName: row.employeeName,
          avatarImage: avatarByEmployeeId.get(String(row.employeeId)) ?? null,
          department: row.department,
          points: row.points,
          transactionCount: row.transactionCount,
          lastReceivedAt: row.lastReceivedAt,
        },
      ];
    });

    const continueCursor = endIndex >= filteredRanked.length ? null : String(endIndex);
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
    const ranked = await buildRankedRows(ctx, input.period, nowMs, {
      query: null,
    });
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
      avatarImage: ctx.user.image ?? null,
      department: row.department,
      points: row.points,
      transactionCount: row.transactionCount,
      lastReceivedAt: row.lastReceivedAt,
    };
  });
