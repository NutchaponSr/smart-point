import { CRPCError } from "better-convex/server";

import type { Id } from "../functions/_generated/dataModel";
import type { MutationCtx } from "../functions/generated/server";

type SpecialPointSourceType =
  | "daily_login"
  | "activity"
  | "monthly_quest";

export async function getWalletOrThrow(
  ctx: MutationCtx,
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
  ctx: MutationCtx,
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
