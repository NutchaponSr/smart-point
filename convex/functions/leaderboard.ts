import z from "zod/v4";
import type { PaginationResult } from "convex/server";
import { authQuery, privateMutation } from "../lib/crpc";
import { syncLeaderboardEntry } from "../lib/leaderboard-entry";
import { coerceLocalized, type LocalizedString } from "../lib/localized";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./generated/server";

const BACKFILL_BATCH = 50;

function normalizeFilterArray(value: string[] | null | undefined): string[] {
  if (value == null || value.length === 0) return [];
  return [
    ...new Set(
      value.map((item) => item.trim()).filter((item) => item.length > 0),
    ),
  ];
}

function parseOffsetCursor(raw: string | null | undefined): number {
  if (raw == null || raw.trim() === "") return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function paginateLeaderboardIndex(
  ctx: QueryCtx,
  args: { division?: string; startIndex: number; limit: number },
): Promise<{ slice: Doc<"leaderboard">[]; hasNext: boolean }> {
  const need = args.startIndex + args.limit + 1;
  const division = args.division;
  const window =
    division == null
      ? await ctx.db.query("leaderboard").withIndex("by_sortKey").take(need)
      : await ctx.db
          .query("leaderboard")
          .withIndex("by_division_sortKey", (q) => q.eq("division", division))
          .take(need);

  return {
    slice: window.slice(args.startIndex, args.startIndex + args.limit),
    hasNext: window.length > args.startIndex + args.limit,
  };
}

async function paginateMergedDivisions(
  ctx: QueryCtx,
  divisions: string[],
  startIndex: number,
  limit: number,
): Promise<{ slice: Doc<"leaderboard">[]; hasNext: boolean }> {
  const need = startIndex + limit + 1;
  const pages = await Promise.all(
    divisions.map((division) =>
      ctx.db
        .query("leaderboard")
        .withIndex("by_division_sortKey", (q) => q.eq("division", division))
        .take(need),
    ),
  );
  const merged = pages
    .flat()
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return {
    slice: merged.slice(startIndex, startIndex + limit),
    hasNext: merged.length > startIndex + limit,
  };
}

async function collectLeaderboardRange(
  ctx: QueryCtx,
  division?: string,
): Promise<Doc<"leaderboard">[]> {
  const out: Doc<"leaderboard">[] = [];
  let cursor: string | null = null;

  while (true) {
    let pageResult: PaginationResult<Doc<"leaderboard">>;
    if (division == null) {
      pageResult = await ctx.db
        .query("leaderboard")
        .withIndex("by_sortKey")
        .paginate({ cursor, numItems: 100 });
    } else {
      pageResult = await ctx.db
        .query("leaderboard")
        .withIndex("by_division_sortKey", (q) => q.eq("division", division))
        .paginate({ cursor, numItems: 100 });
    }

    out.push(...pageResult.page);

    if (pageResult.isDone || pageResult.continueCursor == null) {
      break;
    }
    cursor = pageResult.continueCursor;
  }

  return out;
}

async function collectSortedEntries(
  ctx: QueryCtx,
  divisions: string[],
): Promise<Doc<"leaderboard">[]> {
  if (divisions.length === 0) {
    return await collectLeaderboardRange(ctx);
  }
  if (divisions.length === 1) {
    return await collectLeaderboardRange(ctx, divisions[0]);
  }

  const groups = await Promise.all(
    divisions.map((division) => collectLeaderboardRange(ctx, division)),
  );
  return groups.flat().sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

function toHydrateRows(slice: Doc<"leaderboard">[], startIndex: number) {
  return slice.map((row, index) => ({
    employeeId: row.employeeId,
    employeeCode: row.employeeCode,
    points: row.points,
    receivingBudget: row.receivingBudget,
    specialBudget: row.specialBudget,
    rank: startIndex + index + 1,
  }));
}

function leaderboardPageResult(
  rows: LeaderboardPageRow[],
  hasNextPage: boolean,
  endIndex: number,
) {
  const continueCursor = hasNextPage ? String(endIndex) : null;
  return {
    page: rows,
    continueCursor,
    hasNextPage,
    isDone: !hasNextPage,
  };
}

function matchesDigestSearch(
  row: Doc<"leaderboard">,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true;
  return row.searchText.includes(normalizedQuery);
}

type LeaderboardPageRow = {
  rank: number;
  employeeId: Id<"employee">;
  employeeCode: string;
  employeeName: LocalizedString;
  avatarImage: string | null;
  department: LocalizedString | null;
  points: number;
  receivingBudget: number;
  specialBudget: number;
};

async function hydratePage(
  ctx: QueryCtx,
  rows: Array<{
    employeeId: Id<"employee">;
    employeeCode: string;
    points: number;
    receivingBudget: number;
    specialBudget: number;
    rank: number;
  }>,
): Promise<LeaderboardPageRow[]> {
  return await Promise.all(
    rows.map(async (row) => {
      const [employee, user] = await Promise.all([
        ctx.db.get(row.employeeId),
        ctx.db
          .query("user")
          .withIndex("by_employeeId", (q) => q.eq("employeeId", row.employeeId))
          .first(),
      ]);

      return {
        rank: row.rank,
        employeeId: row.employeeId,
        employeeCode: row.employeeCode,
        employeeName: coerceLocalized(employee?.name ?? row.employeeCode),
        avatarImage: user?.image ?? null,
        department: employee?.department
          ? coerceLocalized(employee.department)
          : null,
        points: row.points,
        receivingBudget: row.receivingBudget,
        specialBudget: row.specialBudget,
      };
    }),
  );
}

export const backfill = privateMutation
  .input(
    z.object({
      cursor: z.string().nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const employees = await ctx.db.query("employee").paginate({
      cursor: input.cursor ?? null,
      numItems: BACKFILL_BATCH,
    });

    for (const employee of employees.page) {
      await syncLeaderboardEntry(ctx, employee._id);
    }

    if (!employees.isDone) {
      await ctx.scheduler.runAfter(0, internal.leaderboard.backfill, {
        cursor: employees.continueCursor,
      });
    }

    return null;
  });

export const getMany = authQuery
  .input(
    z.object({
      limit: z.number().min(1).max(100),
      cursor: z.string().nullish(),
      q: z.string().optional().nullable(),
      division: z.array(z.string()).optional().nullable(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const startIndex = parseOffsetCursor(input.cursor ?? null);
    const endIndex = startIndex + input.limit;
    const divisions = normalizeFilterArray(input.division);
    const normalizedQuery = input.q?.trim().toLowerCase() ?? "";

    if (!normalizedQuery) {
      const page =
        divisions.length === 0
          ? await paginateLeaderboardIndex(ctx, {
              startIndex,
              limit: input.limit,
            })
          : divisions.length === 1 && divisions[0]
            ? await paginateLeaderboardIndex(ctx, {
                division: divisions[0],
                startIndex,
                limit: input.limit,
              })
            : await paginateMergedDivisions(
                ctx,
                divisions,
                startIndex,
                input.limit,
              );

      const rows = await hydratePage(
        ctx,
        toHydrateRows(page.slice, startIndex),
      );
      return leaderboardPageResult(rows, page.hasNext, endIndex);
    }

    const scoped = await collectSortedEntries(ctx, divisions);
    const filtered = scoped.filter((row) =>
      matchesDigestSearch(row, normalizedQuery),
    );
    const pageSlice = filtered.slice(startIndex, endIndex);
    const rows = await hydratePage(ctx, toHydrateRows(pageSlice, startIndex));
    return leaderboardPageResult(rows, endIndex < filtered.length, endIndex);
  });

export const getMyEntry = authQuery
  .input(z.object({}))
  .query(async ({ ctx }) => {
    const myId = ctx.user.employee.id as Id<"employee">;
    const mine = await ctx.db
      .query("leaderboard")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", myId))
      .unique();

    if (mine == null) {
      return null;
    }

    return {
      employeeId: mine.employeeId,
      employeeCode: mine.employeeCode,
      employeeName: coerceLocalized(ctx.user.employee.name),
      avatarImage: ctx.user.image ?? null,
      department: ctx.user.employee.department
        ? coerceLocalized(ctx.user.employee.department)
        : null,
      points: mine.points,
      receivingBudget: mine.receivingBudget,
      specialBudget: mine.specialBudget,
    };
  });
