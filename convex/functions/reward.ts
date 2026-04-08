import z from "zod/v4";

import { authQuery } from "../lib/crpc";

const BATCH_SIZE = 5;

export const getTrending = authQuery
  .input(
    z.object({
      query: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const redemptions = await ctx.db.query("redemption").collect();

    const countMap = new Map<string, number>();
    for (const r of redemptions) {
      countMap.set(r.rewardId, (countMap.get(r.rewardId) ?? 0) + 1);
    }

    const rewards = await ctx.db
      .query("reward")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(10)
      .then((rewards) => {
        return rewards.filter((r) => {
          if (input.query) {
            const q = input.query.toLowerCase();
            const match =
              r.name.toLowerCase().includes(q)
            if (!match) return false;
          }
          return true;
        });
      });

    const filtered = rewards.map((r) => ({
      ...r,
      redemptionCount: countMap.get(r._id) ?? 0,
    }));

    const trending = [...filtered]
      .sort((a, b) => b.redemptionCount - a.redemptionCount)
      .slice(0, 10);

    return trending;
  });

export const getMany = authQuery
  .input(z.object({
    query: z.string().optional(),
    cursor: z.string().nullish(),
    minCost: z.number().min(0).optional(),
    maxCost: z.number().min(0).optional(),
    affordable: z.boolean().optional(),
  }))
  .query(async ({ ctx, input }) => {
    let currentPoints = 0;
    if (input.affordable) {
      const wallet = await ctx.db
        .query("wallet")
        .withIndex("by_employeeId", (q) =>
          q.eq("employeeId", ctx.user.employeeId)
        )
        .first();
      currentPoints = wallet?.receivingBudget ?? 0;
    }

    const pages = await ctx.db
      .query("reward")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .paginate({
        numItems: BATCH_SIZE,
        cursor: input.cursor ?? null,
      });

    const filtered = pages.page.filter((r) => {
      if (input.query) {
        const q = input.query.toLowerCase();
        const match =
          r.name.toLowerCase().includes(q)
        if (!match) return false;
      }

      if (input.minCost !== undefined && r.pointCost < input.minCost)
        return false;
      if (input.maxCost !== undefined && r.pointCost > input.maxCost)
        return false;
      if (input.affordable && r.pointCost > currentPoints)
        return false;

      return true;
    });

    return {
      ...pages,
      page: filtered,
      currentPoints,
    };
  });