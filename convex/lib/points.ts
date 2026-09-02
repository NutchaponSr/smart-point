import { CRPCError } from "better-convex/server";
import type { GenericMutationCtx } from "convex/server";

import type { DataModel, Id } from "../functions/_generated/dataModel";
import { syncLeaderboardEntry } from "./leaderboard-entry";

export type SpecialPointSourceType =
  | "daily_login"
  | "activity"
  | "monthly_quest"
  | "first_login"
  | "login_streak"
  | "monthly_active"
  | "praise_streak";

type PointsMutationCtx = Pick<GenericMutationCtx<DataModel>, "db">;

/** หัก receivingBudget ก่อน แล้วค่อย specialBudget */
export function splitRedeemCost(
  receivingBudget: number,
  specialBudget: number,
  totalPoints: number,
) {
  const receiving = Math.max(0, receivingBudget);
  const special = Math.max(0, specialBudget);
  const available = receiving + special;

  if (available < totalPoints) {
    return { ok: false as const, shortfall: totalPoints - available };
  }

  const fromReceiving = Math.min(receiving, totalPoints);
  const fromSpecial = totalPoints - fromReceiving;

  return {
    ok: true as const,
    fromReceiving,
    fromSpecial,
    newReceiving: receiving - fromReceiving,
    newSpecial: special - fromSpecial,
  };
}

export async function getWalletOrThrow(
  ctx: PointsMutationCtx,
  employeeId: Id<"employee">,
) {
  const wallet = await ctx.db
    .query("wallet")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
    .first();

  if (!wallet) {
    throw new CRPCError({
      code: "NOT_FOUND",
      message: "Wallet not found",
    });
  }

  return wallet;
}

export async function awardSpecialPoints(
  ctx: PointsMutationCtx,
  input: {
    employeeId: Id<"employee">;
    delta: number;
    sourceType: SpecialPointSourceType;
    sourceId: string;
    note: string;
  },
): Promise<{ awarded: boolean; newBalance: number }> {
  const existing = await ctx.db
    .query("pointLedger")
    .withIndex("by_sourceType_sourceId", (q) =>
      q.eq("sourceType", input.sourceType).eq("sourceId", input.sourceId),
    )
    .first();

  const wallet = await getWalletOrThrow(ctx, input.employeeId);

  if (existing) {
    return { awarded: false, newBalance: wallet.specialBudget ?? 0 };
  }

  const newBalance = (wallet.specialBudget ?? 0) + input.delta;
  const now = Date.now();

  await ctx.db.patch(wallet._id, { specialBudget: newBalance });
  await syncLeaderboardEntry(ctx, input.employeeId);
  await ctx.db.insert("pointLedger", {
    employeeId: input.employeeId,
    delta: input.delta,
    balanceAfter: newBalance,
    balanceType: "special",
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    note: input.note,
    createdAt: now,
  });

  return { awarded: true, newBalance };
}
