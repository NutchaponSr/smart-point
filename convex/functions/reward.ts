import z from "zod/v4";

import { CRPCError } from "better-convex/server";

import { authQuery } from "../lib/crpc";

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

    const rewardStats = new Map<
      string,
      { redeemCount: number; totalQuantity: number }
    >();

    for (const redemption of redemptions) {
      const key = redemption.rewardId.toString();
      const prev = rewardStats.get(key) ?? { redeemCount: 0, totalQuantity: 0 };

      rewardStats.set(key, {
        redeemCount: prev.redeemCount + 1,
        totalQuantity: prev.totalQuantity + redemption.quantity,
      });
    }

    if (rewardStats.size === 0) return [];

    const rewards = await Promise.all(
      [...rewardStats.entries()].map(async ([rewardIdStr, stats]) => {
        const reward = await ctx.db.get(rewardIdStr as Id<"reward">);
        const reviews = await ctx.db
          .query("review")
          .withIndex("by_rewardId", (q) =>
            q.eq("rewardId", rewardIdStr as Id<"reward">)
          )
          .collect();

        if (!reward || !reward.isActive) return null;

        const avgStars =
          reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length
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

    const [allRewards, allReviews] = await Promise.all([
      rewardQuery.collect(),
      ctx.db.query("review").collect(),
    ]);

    const reviewStatsByRewardId = new Map<
      Id<"reward">,
      { count: number; sumStars: number }
    >();
    for (const review of allReviews) {
      const prev = reviewStatsByRewardId.get(review.rewardId) ?? {
        count: 0,
        sumStars: 0,
      };
      reviewStatsByRewardId.set(review.rewardId, {
        count: prev.count + 1,
        sumStars: prev.sumStars + review.stars,
      });
    }

    const avgStarsForReward = (rewardId: Id<"reward">) => {
      const stats = reviewStatsByRewardId.get(rewardId);
      if (!stats || stats.count === 0) return 0;
      return stats.sumStars / stats.count;
    };

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

      if (hasStar && avgStarsForReward(reward._id) < input.star!) return false;

      return true;
    });

    const sortedRewards = [...filteredRewards].sort((a, b) => {
      if (input.sort === "hot_and_new") {
        return b._creationTime - a._creationTime;
      }

      if (input.sort === "trending") {
        const scoreA = avgStarsForReward(a._id);
        const scoreB = avgStarsForReward(b._id);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }

      return b._creationTime - a._creationTime;
    });

    const startIndex = Math.max(0, Number.parseInt(input.cursor ?? "0", 10) || 0);
    const endIndex = startIndex + input.limit;
    const page = sortedRewards.slice(startIndex, endIndex).map((reward) => {
      const stats = reviewStatsByRewardId.get(reward._id);
      const totalReviews = stats?.count ?? 0;
      return {
        name: reward.name,
        description: reward.description,
        image: reward.image,
        pointCost: reward.pointCost,
        stock: reward.stock,
        totalReviews,
        totalStars: avgStarsForReward(reward._id),
        isActive: reward.isActive,
        _creationTime: reward._creationTime,
        _id: reward._id,
      };
    });

    const continueCursor =
      endIndex >= sortedRewards.length ? null : String(endIndex);

    return {
      page,
      isDone: continueCursor === null,
      continueCursor,
    };
  })

export const getOne = authQuery
  .input(
    z.object({
      rewardId: z.string(),
    })
  )
  .query(async ({ ctx, input }) => {
    const rewardId = input.rewardId as Id<"reward">;
    const reward = await ctx.db.get(rewardId);

    if (!reward) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Reward not found",
      });
    }

    const reviews = await ctx.db
      .query("review")
      .withIndex("by_rewardId", (q) => q.eq("rewardId", rewardId))
      .order("desc")
      .collect();

    const ratingDistribution: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let sumStars = 0;
    for (const review of reviews) {
      sumStars += review.stars;
      const s = review.stars;
      if (s >= 1 && s <= 5) {
        ratingDistribution[s] = (ratingDistribution[s] ?? 0) + 1;
      }
    }

    const reviewCount = reviews.length;
    const reviewRating =
      reviewCount > 0 ? sumStars / reviewCount : 0;

    const uniqueUserIds = [...new Set(reviews.map((review) => review.userId))];
    const users = await Promise.all(uniqueUserIds.map((userId) => ctx.db.get(userId)));
    const userById = new Map(uniqueUserIds.map((userId, index) => [userId, users[index]]));

    const existingUsers = users.filter((user): user is NonNullable<typeof user> => user !== null);
    const uniqueEmployeeIds = [
      ...new Set(existingUsers.map((user) => user.employeeId)),
    ];
    const employees = await Promise.all(
      uniqueEmployeeIds.map((employeeId) => ctx.db.get(employeeId))
    );
    const employeeById = new Map(
      uniqueEmployeeIds.map((employeeId, index) => [employeeId, employees[index]])
    );

    const reviewers = reviews.map((review) => {
      const user = userById.get(review.userId) ?? null;
      const employee = user ? employeeById.get(user.employeeId) ?? null : null;

      return {
        reviewId: review._id,
        stars: review.stars,
        comment: review.comment ?? null,
        createdAt: review.createdAt,
        reviewer: {
          userId: review.userId,
          employeeId: user?.employeeId ?? null,
          name: employee?.name ?? null,
          image: user?.image ?? null,
        },
      };
    }).slice(0, 5);

    return {
      ...reward,
      ratingDistribution,
      reviewRating,
      reviewCount,
      reviewers,
    };
  });
