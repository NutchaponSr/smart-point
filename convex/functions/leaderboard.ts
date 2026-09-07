import z from "zod/v4";
import { authQuery, privateMutation } from "../lib/crpc";
import { syncLeaderboardEntry } from "../lib/leaderboard-entry";
import { coerceLocalized, type LocalizedString } from "../lib/localized";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./generated/server";

/** Convex search returns at most 1024 hits; keep one bounded take per query. */
const SEARCH_TAKE = 1024;

const BACKFILL_BATCH = 50;

/** Cap for walking the global sort index when resolving true ranks after a filter. */
const RANK_SCAN_CAP = 4096;

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

async function searchLeaderboardEntries(
  ctx: QueryCtx,
  query: string,
  divisions: string[],
): Promise<Doc<"leaderboard">[]> {
  const runSearch = async (division?: string) =>
    await ctx.db
      .query("leaderboard")
      .withSearchIndex("search_text", (q) => {
        const searched = q.search("searchText", query);
        return division == null ? searched : searched.eq("division", division);
      })
      .take(SEARCH_TAKE);

  if (divisions.length === 0) {
    const hits = await runSearch();
    return hits.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  const groups = await Promise.all(
    divisions.map((division) => runSearch(division)),
  );
  const seen = new Set<string>();
  const merged: Doc<"leaderboard">[] = [];
  for (const row of groups.flat()) {
    if (seen.has(row._id)) continue;
    seen.add(row._id);
    merged.push(row);
  }
  return merged.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

function sequentialRanks(
  slice: Doc<"leaderboard">[],
  startIndex: number,
): Map<string, number> {
  return new Map(slice.map((row, index) => [row._id, startIndex + index + 1]));
}

/**
 * Global board rank (1 = first by sortKey), independent of search/division
 * filters. Reads from the start of `by_sortKey` through the worst row on this
 * page so filtered results keep their real position instead of 1..N.
 */
async function globalRanksForSlice(
  ctx: QueryCtx,
  slice: Doc<"leaderboard">[],
): Promise<Map<string, number>> {
  const ranks = new Map<string, number>();
  const first = slice[0];
  if (first == null) {
    return ranks;
  }

  const needed = new Set(slice.map((row) => row._id));
  const worstSortKey = slice.reduce(
    (worst, row) => (row.sortKey > worst ? row.sortKey : worst),
    first.sortKey,
  );

  const window = await ctx.db
    .query("leaderboard")
    .withIndex("by_sortKey", (q) => q.lte("sortKey", worstSortKey))
    .take(RANK_SCAN_CAP);

  window.forEach((row, index) => {
    if (needed.has(row._id)) {
      ranks.set(row._id, index + 1);
    }
  });

  for (const row of slice) {
    if (!ranks.has(row._id)) {
      ranks.set(row._id, RANK_SCAN_CAP);
    }
  }

  return ranks;
}

function toHydrateRows(
  slice: Doc<"leaderboard">[],
  ranks: ReadonlyMap<string, number>,
) {
  return slice.map((row) => ({
    employeeId: row.employeeId,
    employeeCode: row.employeeCode,
    points: row.points,
    receivingBudget: row.receivingBudget,
    specialBudget: row.specialBudget,
    rank: ranks.get(row._id) ?? 0,
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

      const ranks =
        divisions.length === 0
          ? sequentialRanks(page.slice, startIndex)
          : await globalRanksForSlice(ctx, page.slice);
      const rows = await hydratePage(ctx, toHydrateRows(page.slice, ranks));
      return leaderboardPageResult(rows, page.hasNext, endIndex);
    }

    const scoped = await searchLeaderboardEntries(
      ctx,
      normalizedQuery,
      divisions,
    );
    const pageSlice = scoped.slice(startIndex, endIndex);
    const ranks = await globalRanksForSlice(ctx, pageSlice);
    const rows = await hydratePage(ctx, toHydrateRows(pageSlice, ranks));
    return leaderboardPageResult(rows, endIndex < scoped.length, endIndex);
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
