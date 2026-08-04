import z from "zod/v4";
import { authQuery } from "../lib/crpc";
import {
  coerceLocalized,
  localizedSearchText,
  type LocalizedString,
} from "../lib/localized";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./generated/server";

/** Kept for API compatibility — wallet balances have no time window. */
const periodSchema = z.enum(["30d", "fullTime"]);

type EmployeeListRow = {
  employeeId: string;
  name: LocalizedString | string;
  email: string | null;
  department: LocalizedString | string;
  position: LocalizedString | string;
  rank: LocalizedString | string;
  division: string;
};

function rankText(rank: LocalizedString | string): string {
  return typeof rank === "string" ? rank : rank.th.trim() || rank.en.trim();
}

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
    localizedSearchText(row.name).toLowerCase().includes(normalizedQuery) ||
    localizedSearchText(row.department)
      .toLowerCase()
      .includes(normalizedQuery) ||
    localizedSearchText(row.position).toLowerCase().includes(normalizedQuery) ||
    rankText(row.rank).toLowerCase().includes(normalizedQuery) ||
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
    rankText(row.rank) !== "Admin" &&
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
    employeeName: LocalizedString | string;
    department: LocalizedString | string | null;
  }>
> {
  const baseQuery = leaderboardEmployeeBaseQuery(ctx, filters);
  const out: Array<{
    _id: Id<"employee">;
    employeeCode: string;
    employeeName: LocalizedString | string;
    department: LocalizedString | string | null;
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
        employeeName: coerceLocalized(row.name),
        department: row.department
          ? coerceLocalized(row.department)
          : null,
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
  employeeName: LocalizedString | string;
  department: LocalizedString | string | null;
  points: number;
  receivingBudget: number;
  specialBudget: number;
};

function parseOffsetCursor(raw: string | null | undefined): number {
  if (raw == null || raw.trim() === "") return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Rank by current wallet: receivingBudget + specialBudget (highest first). */
async function buildRankedRows(
  ctx: QueryCtx,
  filters: LeaderboardEmployeeFilters,
): Promise<RankedRow[]> {
  const [employees, wallets] = await Promise.all([
    collectFilteredEmployees(ctx, filters),
    // eslint-disable-next-line @convex-dev/no-query-collect -- join all wallets once into a Map (avoid N+1)
    ctx.db.query("wallet").collect(),
  ]);

  const walletByEmployeeId = new Map(
    wallets.map((wallet) => [String(wallet.employeeId), wallet]),
  );

  return employees
    .map((employee) => {
      const wallet = walletByEmployeeId.get(String(employee._id));
      const receivingBudget = wallet?.receivingBudget ?? 0;
      const specialBudget = wallet?.specialBudget ?? 0;

      return {
        employeeId: employee._id,
        employeeCode: employee.employeeCode,
        employeeName: employee.employeeName,
        department: employee.department,
        points: receivingBudget + specialBudget,
        receivingBudget,
        specialBudget,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        a.employeeCode.localeCompare(b.employeeCode) ||
        String(a.employeeId).localeCompare(String(b.employeeId)),
    );
}

export const getMany = authQuery
  .input(
    z.object({
      /** Ignored — ranking uses current wallet balances. */
      period: periodSchema,
      limit: z.number().min(1).max(100),
      cursor: z.string().nullish(),
      q: z.string().optional().nullable(),
      division: z.array(z.string()).optional().nullable(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const [globalRanked, filteredRanked] = await Promise.all([
      buildRankedRows(ctx, {
        query: null,
        division: null,
      }),
      buildRankedRows(ctx, {
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
          receivingBudget: row.receivingBudget,
          specialBudget: row.specialBudget,
        },
      ];
    });

    const continueCursor =
      endIndex >= filteredRanked.length ? null : String(endIndex);
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
      /** Ignored — ranking uses current wallet balances. */
      period: periodSchema,
    }),
  )
  .query(async ({ ctx }) => {
    const ranked = await buildRankedRows(ctx, {
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
      receivingBudget: row.receivingBudget,
      specialBudget: row.specialBudget,
    };
  });
