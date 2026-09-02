import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

import type { DataModel, Id } from "../functions/_generated/dataModel";
import { type LocalizedString, localizedSearchText } from "./localized";

type LeaderboardDbCtx = Pick<
  GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  "db"
>;

type LeaderboardMutationCtx = Pick<GenericMutationCtx<DataModel>, "db">;

const SORT_POINTS_SPAN = 1_000_000_000_000;

function rankText(rank: LocalizedString | string): string {
  return typeof rank === "string" ? rank : rank.th.trim() || rank.en.trim();
}

export function isExcludedFromLeaderboard(rank: LocalizedString | string) {
  return rankText(rank) === "Admin";
}

export function leaderboardSortKey(
  points: number,
  employeeCode: string,
  employeeId: string,
): string {
  const clamped = Math.max(0, Math.min(Math.trunc(points), SORT_POINTS_SPAN));
  const padded = String(SORT_POINTS_SPAN - clamped).padStart(13, "0");
  return `${padded}\u001f${employeeCode}\u001f${employeeId}`;
}

export function leaderboardSearchText(input: {
  employeeCode: string;
  name: LocalizedString | string;
  email: string | null | undefined;
  department: LocalizedString | string;
  position: LocalizedString | string;
  rank: LocalizedString | string;
  division: string;
}): string {
  return [
    input.employeeCode,
    localizedSearchText(input.name),
    localizedSearchText(input.department),
    localizedSearchText(input.position),
    rankText(input.rank),
    input.division,
    input.email ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

async function findLeaderboardEntry(
  ctx: LeaderboardDbCtx,
  employeeId: Id<"employee">,
) {
  return await ctx.db
    .query("leaderboard")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
    .unique();
}

export async function deleteLeaderboardEntry(
  ctx: LeaderboardMutationCtx,
  employeeId: Id<"employee">,
) {
  const existing = await findLeaderboardEntry(ctx, employeeId);
  if (existing) {
    await ctx.db.delete(existing._id);
  }
}

/** Upsert slim ranking row. No-op delete when employee is Admin / missing. */
export async function syncLeaderboardEntry(
  ctx: LeaderboardMutationCtx,
  employeeId: Id<"employee">,
) {
  const [employee, wallet] = await Promise.all([
    ctx.db.get(employeeId),
    ctx.db
      .query("wallet")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
      .first(),
  ]);

  if (!employee || isExcludedFromLeaderboard(employee.rank)) {
    await deleteLeaderboardEntry(ctx, employeeId);
    return;
  }

  const receivingBudget = wallet?.receivingBudget ?? 0;
  const specialBudget = wallet?.specialBudget ?? 0;
  const points = receivingBudget + specialBudget;
  const employeeCode = employee.employeeId;
  const payload = {
    employeeId,
    employeeCode,
    division: employee.division,
    points,
    receivingBudget,
    specialBudget,
    sortKey: leaderboardSortKey(points, employeeCode, String(employeeId)),
    searchText: leaderboardSearchText({
      employeeCode,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      position: employee.position,
      rank: employee.rank,
      division: employee.division,
    }),
  };

  const existing = await findLeaderboardEntry(ctx, employeeId);
  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return;
  }
  await ctx.db.insert("leaderboard", payload);
}
