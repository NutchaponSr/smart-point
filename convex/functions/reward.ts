import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import {
  authMutation,
  authQuery,
  publicMutation,
  publicQuery,
} from "../lib/crpc";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./generated/server";
import { REWARD_IMAGE_MAX_BYTES } from "./upload";

type RewardListInput = {
  q?: string | null;
  minCost?: number | null;
  maxCost?: number | null;
  star?: number | null;
  limit: number;
  cursor?: string | null;
};

type RewardFilterState = {
  normalizedQuery: string;
  hasQuery: boolean;
  hasMinCost: boolean;
  hasMaxCost: boolean;
  hasStar: boolean;
};

type ReviewStatsMap = Map<Id<"reward">, { count: number; sumStars: number }>;

const buildRewardListFilterState = (
  input: RewardListInput,
): RewardFilterState => {
  const normalizedQuery = input.q?.trim().toLowerCase() ?? "";
  return {
    normalizedQuery,
    hasQuery: normalizedQuery.length > 0,
    hasMinCost: input.minCost != null && input.minCost > 0,
    hasMaxCost: input.maxCost != null && input.maxCost > 0,
    hasStar: input.star != null && input.star > 0,
  };
};

const buildReviewStatsByRewardId = (
  reviews: Doc<"review">[],
): ReviewStatsMap => {
  const map: ReviewStatsMap = new Map();
  for (const review of reviews) {
    const prev = map.get(review.rewardId) ?? { count: 0, sumStars: 0 };
    map.set(review.rewardId, {
      count: prev.count + 1,
      sumStars: prev.sumStars + review.stars,
    });
  }
  return map;
};

const getAverageStars = (
  statsMap: ReviewStatsMap,
  rewardId: Id<"reward">,
): number => {
  const stats = statsMap.get(rewardId);
  if (!stats || stats.count === 0) return 0;
  return stats.sumStars / stats.count;
};

async function buildReviewStatsForRewardIds(
  ctx: QueryCtx,
  rewardIds: Id<"reward">[],
): Promise<ReviewStatsMap> {
  if (rewardIds.length === 0) return new Map();
  const entries = await Promise.all(
    rewardIds.map(async (rewardId) => {
      const reviews = await ctx.db
        .query("review")
        .withIndex("by_rewardId", (q) => q.eq("rewardId", rewardId))
        .collect();
      let count = 0;
      let sumStars = 0;
      for (const r of reviews) {
        count += 1;
        sumStars += r.stars;
      }
      return [rewardId, { count, sumStars }] as const;
    }),
  );
  return new Map(entries);
}

const sortCatalogRewards = (params: {
  rewards: Doc<"reward">[];
  sort: "curated" | "trending" | "hot_and_new" | null | undefined;
  avgStarsForReward: (rewardId: Id<"reward">) => number;
}): Doc<"reward">[] => {
  const { rewards, sort, avgStarsForReward } = params;
  return [...rewards].sort((a, b) => {
    if (sort === "hot_and_new") {
      return b._creationTime - a._creationTime;
    }
    if (sort === "trending") {
      const scoreA = avgStarsForReward(a._id);
      const scoreB = avgStarsForReward(b._id);
      if (scoreA !== scoreB) return scoreB - scoreA;
    }
    return b._creationTime - a._creationTime;
  });
};

async function assertRewardImageUnderLimit(
  ctx: Pick<MutationCtx, "storage">,
  image: string | null | undefined,
) {
  if (image == null || image === "") return;
  const meta = await ctx.storage.getMetadata(image as Id<"_storage">);
  if (!meta) {
    throw new CRPCError({ code: "BAD_REQUEST", message: "รูปภาพไม่ถูกต้อง" });
  }
  if (meta.size > REWARD_IMAGE_MAX_BYTES) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "รูปต้องมีขนาดไม่เกิน 1 MB",
    });
  }
}

/** ลบ review → redemption → cartItem → reward (ลำดับ dependency) */
async function deleteRewardAndDependents(
  ctx: { db: MutationCtx["db"] },
  rewardId: Id<"reward">,
) {
  const reviews = await ctx.db
    .query("review")
    .withIndex("by_rewardId", (q) => q.eq("rewardId", rewardId))
    .collect();
  for (const review of reviews) {
    await ctx.db.delete(review._id);
  }

  const redemptions = await ctx.db
    .query("redemption")
    .withIndex("by_rewardId", (q) => q.eq("rewardId", rewardId))
    .collect();
  for (const redemption of redemptions) {
    await ctx.db.delete(redemption._id);
  }

  const cartItems = await ctx.db
    .query("cartItem")
    .withIndex("by_rewardId", (q) => q.eq("rewardId", rewardId))
    .collect();
  for (const item of cartItems) {
    await ctx.db.delete(item._id);
  }

  await ctx.db.delete(rewardId);
}

const matchesRewardFilters = (params: {
  reward: Doc<"reward">;
  input: Pick<RewardListInput, "minCost" | "maxCost" | "star">;
  filter: RewardFilterState;
  avgStarsForReward: (rewardId: Id<"reward">) => number;
}) => {
  const { reward, input, filter, avgStarsForReward } = params;

  if (filter.hasQuery) {
    const nameMatch = reward.name
      .toLowerCase()
      .includes(filter.normalizedQuery);
    const descriptionMatch =
      reward.description?.toLowerCase().includes(filter.normalizedQuery) ??
      false;
    if (!nameMatch && !descriptionMatch) return false;
  }

  if (filter.hasMinCost && reward.pointCost < input.minCost!) return false;
  if (filter.hasMaxCost && reward.pointCost > input.maxCost!) return false;
  if (filter.hasStar && avgStarsForReward(reward._id) < input.star!)
    return false;

  return true;
};

const filterSortAndPaginateRewards = (params: {
  rewards: Doc<"reward">[];
  input: RewardListInput;
  filter: RewardFilterState;
  avgStarsForReward: (rewardId: Id<"reward">) => number;
}) => {
  const { rewards, input, filter, avgStarsForReward } = params;

  const filteredRewards = rewards.filter((reward) =>
    matchesRewardFilters({
      reward,
      input,
      filter,
      avgStarsForReward,
    }),
  );

  const sortedRewards = [...filteredRewards].sort(
    (a, b) => a._creationTime - b._creationTime,
  );

  const startIndex = Math.max(0, Number.parseInt(input.cursor ?? "0", 10) || 0);
  const endIndex = startIndex + input.limit;
  const page = sortedRewards.slice(startIndex, endIndex);
  const continueCursor =
    endIndex >= sortedRewards.length ? null : String(endIndex);

  return {
    page,
    isDone: continueCursor === null,
    continueCursor,
    hasNextPage: continueCursor !== null,
  };
};

export const getTrending = authQuery
  .input(
    z.object({
      query: z.string().optional(),
    }),
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
            const match = r.name.toLowerCase().includes(q);
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

export const getRecommend = authQuery.query(async ({ ctx }) => {
  const employees = await ctx.db
    .query("employee")
    .withIndex("by_department", (q) =>
      q.eq("department", ctx.user.employee.department),
    )
    .collect();

  const employeeIds = new Set(employees.map((e) => e._id));
  const redemptions = (
    await Promise.all(
      Array.from(employeeIds).map((id) =>
        ctx.db
          .query("redemption")
          .withIndex("by_employeeId_status", (q) =>
            q.eq("employeeId", id).eq("status", "fulfilled"),
          )
          .collect(),
      ),
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
          q.eq("rewardId", rewardIdStr as Id<"reward">),
        )
        .collect();

      if (!reward || !reward.isActive) return null;

      const avgStars =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.stars, 0) /
            reviews.length
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
    }),
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
      sort: z
        .enum(["curated", "trending", "hot_and_new"])
        .optional()
        .nullable(),
      minCost: z.number().min(0).optional().nullable(),
      maxCost: z.number().min(0).optional().nullable(),
      star: z.number().min(0).max(5).optional().nullable(),
    }),
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
    }),
  })
  .query(async ({ ctx, input }) => {
    const filter = buildRewardListFilterState(input);
    const allRewards = await ctx.db
      .query("reward")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    if (allRewards.length === 0) {
      return { page: [], isDone: true, continueCursor: null };
    }

    const needsFullReviewStats = filter.hasStar || input.sort === "trending";
    const reviewStatsByRewardId: ReviewStatsMap = needsFullReviewStats
      ? buildReviewStatsByRewardId(await ctx.db.query("review").collect())
      : new Map();

    const avgStarsForReward = (rewardId: Id<"reward">) =>
      getAverageStars(reviewStatsByRewardId, rewardId);

    const filteredRewards = allRewards.filter((reward) =>
      matchesRewardFilters({
        reward,
        input,
        filter,
        avgStarsForReward,
      }),
    );

    const sortedRewards = sortCatalogRewards({
      rewards: filteredRewards,
      sort: input.sort,
      avgStarsForReward,
    });

    const startIndex = Math.max(
      0,
      Number.parseInt(input.cursor ?? "0", 10) || 0,
    );
    const endIndex = startIndex + input.limit;
    const pageRewards = sortedRewards.slice(startIndex, endIndex);

    const statsMap: ReviewStatsMap = needsFullReviewStats
      ? reviewStatsByRewardId
      : await buildReviewStatsForRewardIds(
          ctx,
          pageRewards.map((r) => r._id),
        );

    const page = await Promise.all(
      pageRewards.map(async (reward) => {
        const stats = statsMap.get(reward._id);
        const totalReviews = stats?.count ?? 0;
        return {
          name: reward.name,
          description: reward.description,
          image:
            reward.image != null && String(reward.image).trim() !== ""
              ? await ctx.storage.getUrl(reward.image as Id<"_storage">)
              : null,
          pointCost: reward.pointCost,
          stock: reward.stock,
          totalReviews,
          totalStars: getAverageStars(statsMap, reward._id),
          isActive: reward.isActive,
          _creationTime: reward._creationTime,
          _id: reward._id,
        };
      }),
    );

    const continueCursor =
      endIndex >= sortedRewards.length ? null : String(endIndex);

    return {
      page,
      isDone: continueCursor === null,
      continueCursor,
    };
  });

export const getOne = authQuery
  .input(
    z.object({
      rewardId: z.string().min(1),
    }),
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
    const reviewRating = reviewCount > 0 ? sumStars / reviewCount : 0;

    const recentReviews = reviews.slice(0, 5);
    const uniqueUserIds = [
      ...new Set(recentReviews.map((review) => review.userId)),
    ];
    const users = await Promise.all(
      uniqueUserIds.map((userId) => ctx.db.get(userId)),
    );
    const userById = new Map(
      uniqueUserIds.map((userId, index) => [userId, users[index]]),
    );

    const existingUsers = users.filter(
      (user): user is NonNullable<typeof user> => user !== null,
    );
    const uniqueEmployeeIds = [
      ...new Set(existingUsers.map((user) => user.employeeId)),
    ];
    const employees = await Promise.all(
      uniqueEmployeeIds.map((employeeId) => ctx.db.get(employeeId)),
    );
    const employeeById = new Map(
      uniqueEmployeeIds.map((employeeId, index) => [
        employeeId,
        employees[index],
      ]),
    );

    const reviewers = recentReviews.map((review) => {
      const user = userById.get(review.userId) ?? null;
      const employee = user
        ? (employeeById.get(user.employeeId) ?? null)
        : null;

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
    });

    const rawImage = reward.image;
    const image =
      rawImage != null && String(rawImage).trim() !== ""
        ? await ctx.storage.getUrl(rawImage as Id<"_storage">)
        : null;

    return {
      ...reward,
      image,
      ratingDistribution,
      reviewRating,
      reviewCount,
      reviewers,
    };
  });

export const getList = authQuery
  .input(
    z.object({
      q: z.string().optional().nullable(),
      minCost: z.number().min(0).optional().nullable(),
      maxCost: z.number().min(0).optional().nullable(),
      star: z.number().min(0).max(5).optional().nullable(),
      limit: z.number().min(1).max(100),
      cursor: z.string().nullish(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const filter = buildRewardListFilterState(input);

    const [allRewards, allReviews] = await Promise.all([
      ctx.db
        .query("reward")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .collect(),
      ctx.db.query("review").collect(),
    ]);

    const reviewStatsByRewardId = buildReviewStatsByRewardId(allReviews);
    const avgStarsForReward = (rewardId: Id<"reward">) =>
      getAverageStars(reviewStatsByRewardId, rewardId);

    const { page, isDone, continueCursor, hasNextPage } =
      filterSortAndPaginateRewards({
        rewards: allRewards,
        input,
        filter,
        avgStarsForReward,
      });

    const pageWithStats = await Promise.all(
      page.map(async (reward) => {
        const stats = reviewStatsByRewardId.get(reward._id);
        const raw = reward.image;
        const imageUrl =
          raw != null && String(raw).trim() !== ""
            ? await ctx.storage.getUrl(raw as Id<"_storage">)
            : null;
        return {
          ...reward,
          totalReview: stats?.count ?? 0,
          totalStar: stats?.sumStars ?? 0,
          imageUrl,
        };
      }),
    );

    return {
      page: pageWithStats,
      isDone,
      continueCursor,
      hasNextPage,
    };
  });

export const create = authMutation
  .input(
    z.object({
      name: z.string().trim().min(1),
      description: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      pointCost: z.number().int().min(0),
      stock: z
        .number()
        .int()
        .refine((n) => n === -1 || n >= 1, {
          message: "stock must be -1 (unlimited) or >= 1",
        }),
      onePerOrder: z.boolean().optional(),
      isActive: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    await assertRewardImageUnderLimit(ctx, input.image);
    return await ctx.db.insert("reward", {
      name: input.name,
      description: input.description,
      image: input.image,
      pointCost: input.pointCost,
      stock: input.stock,
      onePerOrder: input.onePerOrder,
      isActive: input.isActive,
    });
  });

export const update = authMutation
  .input(
    z.object({
      rewardId: z.string().min(1),
      name: z.string().trim().min(1).optional(),
      description: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      pointCost: z.number().int().min(0).optional(),
      stock: z
        .number()
        .int()
        .refine((n) => n === -1 || n >= 1, {
          message: "stock must be -1 (unlimited) or >= 1",
        })
        .optional(),
      onePerOrder: z.boolean().optional().nullable(),
      isActive: z.boolean().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const rewardId = input.rewardId as Id<"reward">;
    const reward = await ctx.db.get(rewardId);
    if (!reward) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Reward not found",
      });
    }
    const patch: {
      name?: string;
      description?: string | null;
      image?: string | null;
      pointCost?: number;
      stock?: number;
      onePerOrder?: boolean | null;
      isActive?: boolean;
    } = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.image !== undefined) {
      await assertRewardImageUnderLimit(ctx, input.image);
      patch.image = input.image;
    }
    if (input.pointCost !== undefined) patch.pointCost = input.pointCost;
    if (input.stock !== undefined) patch.stock = input.stock;
    if (input.onePerOrder !== undefined) patch.onePerOrder = input.onePerOrder;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(rewardId, patch);
    }
    return rewardId;
  });

export const remove = authMutation
  .input(z.object({ rewardId: z.string().min(1) }))
  .mutation(async ({ ctx, input }) => {
    const rewardId = input.rewardId as Id<"reward">;
    const reward = await ctx.db.get(rewardId);
    if (!reward) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Reward not found",
      });
    }
    await deleteRewardAndDependents(ctx, rewardId);
    return rewardId;
  });

export const exportExcel = publicQuery
  .input(z.object({}))
  .query(async ({ ctx }) => {
    return await ctx.db
      .query("reward")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
  });

export const bulkCreate = publicMutation
  .input(
    z.object({
      rows: z.array(
        z.object({
          name: z.string().trim(),
          description: z.string().trim().nullable(),
          pointCost: z.coerce.number(),
          stock: z.coerce.number(),
          onePerOrder: z.coerce.boolean().optional(),
          isActive: z.coerce.boolean().default(true),
        }),
      ),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    let inserted = 0;

    for (const row of input.rows) {
      await ctx.db.insert("reward", {
        name: row.name,
        description: row.description,
        pointCost: row.pointCost,
        stock: row.stock,
        onePerOrder: row.onePerOrder,
        isActive: row.isActive,
      });

      inserted += 1;
    }

    return { inserted };
  });

export const bulkDelete = authMutation
  .input(
    z.object({
      ids: z.array(z.string()),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const unique = [...new Set(input.ids.map((id) => id as Id<"reward">))];
    let deleted = 0;
    for (const rewardId of unique) {
      const reward = await ctx.db.get(rewardId);
      if (!reward) continue;
      await deleteRewardAndDependents(ctx, rewardId);
      deleted += 1;
    }
    return { deleted };
  });
