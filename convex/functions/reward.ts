import z from "zod/v4";

import { CRPCError } from "better-convex/server";

import { authMutation, authQuery } from "../lib/crpc";

import { Id } from "./_generated/dataModel";

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

export const getRecommend = authQuery
  .query(async ({ ctx }) => {
    const employees = await ctx.db
      .query("employee")
      .withIndex("by_department", (q) =>
        q.eq("department", ctx.user.employee.department)
      )
      .collect();

    const employeeIds = new Set(employees.map((e) => e._id));
    const redemptions = (
      await Promise.all(
        Array.from(employeeIds).map((id) =>
          ctx.db
            .query("redemption")
            .withIndex("by_employeeId_status", (q) => q.eq("employeeId", id).eq("status", "fulfilled"))
            .collect()
        )
      )
    ).flat();

    if (redemptions.length === 0) return [];

    const redemptionIds = new Set(redemptions.map((r) => r._id));
    const redemptionItems = (
      await Promise.all(
        Array.from(redemptionIds).map((id) =>
          ctx.db
            .query("redemptionItem")
            .withIndex("by_redemptionId", (q) => q.eq("redemptionId", id))
            .collect()
        )
      )
    ).flat();

    if (redemptionItems.length === 0) return [];

    const rewardStats = new Map<string, { redeemCount: number, totalQuantity: number }>();

    for (const item of redemptionItems) {
      const key = item.rewardId.toString();
      const prev = rewardStats.get(key) ?? { redeemCount: 0, totalQuantity: 0 };

      rewardStats.set(key, {
        redeemCount: prev.redeemCount + 1,
        totalQuantity: prev.totalQuantity + item.quantity,
      });
    }

    if (rewardStats.size === 0) return [];

    const rewards = await Promise.all(
      [...rewardStats.entries()].map(async ([rewardIdStr, stats]) => {
        const reward = await ctx.db.get(rewardIdStr as Id<"reward">);
        if (!reward || !reward.isActive) return null;

        const avgStars =
          reward.totalReviews > 0
            ? reward.totalStars / reward.totalReviews
            : 0;

        // popularity score: weighted sum ของ quantity + bonus จาก rating
        const popularityScore =
          stats.totalQuantity * 1.0 + avgStars * stats.redeemCount * 0.5;

        return {
          ...reward,
          avgStars,
          redeemCount: stats.redeemCount,
          totalQuantity: stats.totalQuantity,
          popularityScore,
        };
      })
    );

    return rewards
      .filter(Boolean)
      .sort((a, b) => b!.popularityScore - a!.popularityScore)
      .slice(0, 8) as NonNullable<(typeof rewards)[number]>[];
  });

export const getMany = authQuery
  .input(
    z.object({
      q: z.string().optional().nullable(),
      sort: z.enum(["curated", "trending", "hot_and_new"]).optional().nullable(),
      minCost: z.number().min(0).optional().nullable(),
      maxCost: z.number().min(0).optional().nullable(),
      star: z.number().min(0).max(5).optional().nullable(),
    })
  )
  .paginated({ 
    limit: 10, 
    item: z.object({
      name: z.string(),
      description: z.string().nullish(),
      image: z.string().nullish(),
      pointCost: z.number(),
      stock: z.number(),
      totalReviews: z.number(),
      totalStars: z.number(),
      isActive: z.boolean(),
      _creationTime: z.number(),
      _id: z.custom<Id<"reward">>(),
    }) 
  })
  .query(async ({ ctx, input }) => {
    const rewardQuery = ctx.db
      .query("reward")
      .withIndex("by_isActive", (q) => q.eq("isActive", true));

    const allRewards = await rewardQuery.collect();

    const normalizedQuery = input.q?.trim().toLowerCase() ?? "";
    const hasQuery = normalizedQuery.length > 0;
    const hasMinCost = input.minCost != null && input.minCost > 0;
    const hasMaxCost = input.maxCost != null && input.maxCost > 0;
    const hasStar = input.star != null && input.star > 0;

    const filteredRewards = allRewards.filter((reward) => {
      if (hasQuery) {
        const nameMatch = reward.name.toLowerCase().includes(normalizedQuery);
        const descriptionMatch =
          reward.description?.toLowerCase().includes(normalizedQuery) ?? false;
        if (!nameMatch && !descriptionMatch) return false;
      }

      if (hasMinCost && reward.pointCost < input.minCost!) return false;
      if (hasMaxCost && reward.pointCost > input.maxCost!) return false;

      if (hasStar) {
        const avgStars =
          reward.totalReviews > 0 ? reward.totalStars / reward.totalReviews : 0;
        if (avgStars < input.star!) return false;
      }

      return true;
    });

    const sortedRewards = [...filteredRewards].sort((a, b) => {
      if (input.sort === "hot_and_new") {
        return b._creationTime - a._creationTime;
      }

      if (input.sort === "trending") {
        const scoreA = a.totalReviews;
        const scoreB = b.totalReviews;
        if (scoreA !== scoreB) return scoreB - scoreA;
      }

      return b._creationTime - a._creationTime;
    });

    const startIndex = Math.max(0, Number.parseInt(input.cursor ?? "0", 10) || 0);
    const endIndex = startIndex + input.limit;
    const page = sortedRewards.slice(startIndex, endIndex).map((reward) => ({
      name: reward.name,
      description: reward.description,
      image: reward.image,
      pointCost: reward.pointCost,
      stock: reward.stock,
      totalReviews: reward.totalReviews,
      totalStars: reward.totalStars,
      isActive: reward.isActive,
      _creationTime: reward._creationTime,
      _id: reward._id,
    }));

    const continueCursor =
      endIndex >= sortedRewards.length ? null : String(endIndex);

    return {
      page,
      isDone: continueCursor === null,
      continueCursor,
    };
  })

export const getCart = authQuery
  .query(async ({ ctx }) => {
    const cart = await ctx.db
      .query("cart")
      .withIndex("by_employeeId_status", (q) =>
        q.eq("employeeId", ctx.user.employeeId).eq("status", "active")
      )
      .first();

      if (!cart) return { cart: null, items: [], totalPoints: 0 };

      const cartItems = await ctx.db
        .query("cartItem")
        .withIndex("by_cartId", (q) => q.eq("cartId", cart._id))
        .collect();
  
      const items = await Promise.all(
        cartItems.map(async (item) => {
          const reward = await ctx.db.get(item.rewardId);
          return { ...item, reward };
        })
      );
  
      const totalPoints = items.reduce(
        (sum, item) => sum + (item.reward?.pointCost ?? 0) * item.quantity,
        0
      );
  
      return { cart, items, totalPoints };
  })

export const addToCart = authMutation
  .input(z.object({
    rewardId: z.string(),
    quantity: z.number().int().min(1).default(1),
  }))
  .mutation(async ({ ctx, input }) => {
    const reward = await ctx.db.get(input.rewardId as Id<"reward">);
    if (!reward || !reward.isActive) throw new Error("Reward not available");
    if (
      reward.stock !== -1 &&
      reward.stock < input.quantity
    ) {
      throw new Error("Insufficient stock");
    }

    const cart = await ctx.db
      .query("cart")
      .withIndex("by_employeeId_status", (q) =>
        q.eq("employeeId", ctx.user.employeeId).eq("status", "active")
      )
      .first();

    const cartId =
      cart?._id ??
      (await ctx.db.insert("cart", {
        employeeId: ctx.user.employeeId,
        status: "active",
      }));

    const existing = await ctx.db
      .query("cartItem")
      .withIndex("by_cartId_rewardId", (q) =>
        q.eq("cartId", cartId).eq("rewardId", input.rewardId as Id<"reward">)
      )
      .first();

    if (existing) {
      const nextQty = existing.quantity + input.quantity;
      if (reward.stock !== -1 && nextQty > reward.stock) {
        throw new Error("Insufficient stock");
      }
      await ctx.db.patch(existing._id, {
        quantity: nextQty,
      });
    } else {
      await ctx.db.insert("cartItem", {
        cartId: cartId,
        rewardId: input.rewardId as Id<"reward">,
        quantity: input.quantity,
      });
    }
  });