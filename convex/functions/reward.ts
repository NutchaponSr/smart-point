import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import {
  authMutation,
  authQuery,
  privateMutation,
  publicMutation,
} from "../lib/crpc";
import {
  isLocalizedString,
  localizedSearchText,
  toLocalizedString,
  type LocalizedString,
} from "../lib/localized";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./generated/server";
import { REWARD_IMAGE_MAX_BYTES } from "./upload";

const localizedNameSchema = z.object({
  th: z.string().trim().min(1),
  en: z.string().trim().min(1),
});

const localizedDescriptionValueSchema = z
  .object({
    th: z.string().trim(),
    en: z.string().trim(),
  })
  .transform((value) =>
    value.th === "" && value.en === "" ? null : value,
  );

/** optional = ไม่ส่งมา; null / ว่างทั้งคู่ = ล้างค่า */
const localizedDescriptionSchema = localizedDescriptionValueSchema
  .nullable()
  .optional();

const localizedStringOutputSchema = z.object({
  th: z.string(),
  en: z.string(),
});

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
type RewardPatch = Partial<
  Pick<
    Doc<"reward">,
    | "name"
    | "description"
    | "image"
    | "pointCost"
    | "stock"
    | "onePerOrder"
    | "isActive"
  >
>;
type RewardSort = "curated" | "trending" | "hot_and_new" | null | undefined;

const resolveStorageImageUrl = async (
  storage: QueryCtx["storage"],
  image: string | null | undefined,
) => {
  if (image == null || String(image).trim() === "") return null;
  return await storage.getUrl(image as Id<"_storage">);
};

const parseCursorOffset = (cursor: string | null | undefined): number =>
  Math.max(0, Number.parseInt(cursor ?? "0", 10) || 0);

const toRewardId = (rewardId: string): Id<"reward"> => rewardId as Id<"reward">;

const isNonNullable = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined;

const buildRatingDistribution = (reviews: Doc<"review">[]) => {
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
    if (review.stars >= 1 && review.stars <= 5) {
      ratingDistribution[review.stars] =
        (ratingDistribution[review.stars] ?? 0) + 1;
    }
  }

  return {
    ratingDistribution,
    reviewCount: reviews.length,
    reviewRating: reviews.length > 0 ? sumStars / reviews.length : 0,
  };
};

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
  sort: RewardSort;
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
      return b._creationTime - a._creationTime;
    }
    if (a.pointCost !== b.pointCost) return a.pointCost - b.pointCost;
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
    const nameMatch = localizedSearchText(reward.name)
      .toLowerCase()
      .includes(filter.normalizedQuery);
    const descriptionMatch = localizedSearchText(reward.description)
      .toLowerCase()
      .includes(filter.normalizedQuery);
    if (!nameMatch && !descriptionMatch) return false;
  }

  if (
    filter.hasMinCost &&
    input.minCost != null &&
    reward.pointCost < input.minCost
  ) {
    return false;
  }
  if (
    filter.hasMaxCost &&
    input.maxCost != null &&
    reward.pointCost > input.maxCost
  ) {
    return false;
  }
  if (
    filter.hasStar &&
    input.star != null &&
    avgStarsForReward(reward._id) < input.star
  ) {
    return false;
  }

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

  const startIndex = parseCursorOffset(input.cursor);
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

const buildRewardPatch = async (
  ctx: Pick<MutationCtx, "storage">,
  input: {
    name?: LocalizedString;
    description?: LocalizedString | null;
    image?: string | null;
    pointCost?: number;
    stock?: number;
    onePerOrder?: boolean | null;
    isActive?: boolean;
  },
): Promise<RewardPatch> => {
  const patch: RewardPatch = {};
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
  return patch;
};

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
    Id<"reward">,
    { redeemCount: number; totalQuantity: number }
  >();

  for (const redemption of redemptions) {
    const key = redemption.rewardId;
    const prev = rewardStats.get(key) ?? { redeemCount: 0, totalQuantity: 0 };
    rewardStats.set(key, {
      redeemCount: prev.redeemCount + 1,
      totalQuantity: prev.totalQuantity + redemption.quantity,
    });
  }

  if (rewardStats.size === 0) return [];

  const rewards = await Promise.all(
    [...rewardStats.entries()].map(async ([rewardId, stats]) => {
      const reward = await ctx.db.get(rewardId);
      const reviews = await ctx.db
        .query("review")
        .withIndex("by_rewardId", (q) => q.eq("rewardId", rewardId))
        .collect();

      if (!reward || !reward.isActive) return null;

      const avgStars =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.stars, 0) /
            reviews.length
          : 0;

      return {
        ...reward,
        avgStars,
        redeemCount: stats.redeemCount,
        totalQuantity: stats.totalQuantity,
      };
    }),
  );

  return rewards
    .filter(isNonNullable)
    .sort((a, b) => {
      if (b.redeemCount !== a.redeemCount) return b.redeemCount - a.redeemCount;
      if (b.totalQuantity !== a.totalQuantity) {
        return b.totalQuantity - a.totalQuantity;
      }
      return b.avgStars - a.avgStars;
    })
    .slice(0, 10);
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
      name: localizedStringOutputSchema,
      description: localizedStringOutputSchema.nullish(),
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

    const startIndex = parseCursorOffset(input.cursor);
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
        const name = toLocalizedString(reward.name);
        if (!name) {
          throw new CRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Reward name is missing",
          });
        }
        return {
          name,
          description: toLocalizedString(reward.description),
          image: await resolveStorageImageUrl(ctx.storage, reward.image),
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
    const rewardId = toRewardId(input.rewardId);
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

    const { ratingDistribution, reviewCount, reviewRating } =
      buildRatingDistribution(reviews);

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

    const imageUrl = await resolveStorageImageUrl(ctx.storage, reward.image);

    return {
      ...reward,
      imageUrl,
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
        return {
          ...reward,
          totalReview: stats?.count ?? 0,
          totalStar: stats?.sumStars ?? 0,
          imageUrl: await resolveStorageImageUrl(ctx.storage, reward.image),
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

const MAX_EXPORT_ROWS = 10_000;

/** ส่งออกรายการรางวัลทั้งหมดที่ตรง filter เดียวกับ getList */
export const exportAll = authMutation
  .input(
    z.object({
      q: z.string().optional().nullable(),
      minCost: z.number().min(0).optional().nullable(),
      maxCost: z.number().min(0).optional().nullable(),
      star: z.number().min(0).max(5).optional().nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const listInput: RewardListInput = {
      q: input.q,
      minCost: input.minCost,
      maxCost: input.maxCost,
      star: input.star,
      limit: MAX_EXPORT_ROWS + 1,
      cursor: "0",
    };
    const filter = buildRewardListFilterState(listInput);

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

    const filteredSorted = allRewards
      .filter((reward) =>
        matchesRewardFilters({
          reward,
          input: listInput,
          filter,
          avgStarsForReward,
        }),
      )
      .sort((a, b) => a._creationTime - b._creationTime);

    if (filteredSorted.length > MAX_EXPORT_ROWS) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: `พบข้อมูลมากเกิน ${MAX_EXPORT_ROWS} รายการ กรุณาใช้ตัวกรองให้แคบลง`,
      });
    }

    return await Promise.all(
      filteredSorted.map(async (reward) => {
        const stats = reviewStatsByRewardId.get(reward._id);
        return {
          ...reward,
          totalReview: stats?.count ?? 0,
          totalStar: stats?.sumStars ?? 0,
          imageUrl: await resolveStorageImageUrl(ctx.storage, reward.image),
        };
      }),
    );
  });

export const create = authMutation
  .input(
    z.object({
      name: localizedNameSchema,
      description: localizedDescriptionSchema,
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
      description: input.description ?? null,
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
      name: localizedNameSchema.optional(),
      description: localizedDescriptionSchema,
      image: z.string().optional().nullable(),
      pointCost: z.number().int().min(0).optional(),
      stock: z
        .number()
        .int()
        .refine((n) => n === -1 || n >= 0, {
          message: "stock must be -1 (unlimited) or >= 0",
        })
        .optional(),
      onePerOrder: z.boolean().optional().nullable(),
      isActive: z.boolean().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const rewardId = toRewardId(input.rewardId);
    const reward = await ctx.db.get(rewardId);
    if (!reward) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Reward not found",
      });
    }
    const patch = await buildRewardPatch(ctx, {
      name: input.name,
      description: input.description,
      image: input.image,
      pointCost: input.pointCost,
      stock: input.stock,
      onePerOrder: input.onePerOrder,
      isActive: input.isActive,
    });
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(rewardId, patch);
    }
    return rewardId;
  });

export const remove = authMutation
  .input(z.object({ rewardId: z.string().min(1) }))
  .mutation(async ({ ctx, input }) => {
    const rewardId = toRewardId(input.rewardId);
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

export const bulkCreate = publicMutation
  .input(
    z.object({
      rows: z.array(
        z.object({
          name: localizedNameSchema,
          description: localizedDescriptionSchema,
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

/** Backfill name/description จาก string / "" → { th, en } | null */
export const migrateLocalizedStrings = privateMutation.mutation(
  async ({ ctx }) => {
    const rewards = await ctx.db.query("reward").collect();
    let updated = 0;

    for (const reward of rewards) {
      const name = toLocalizedString(reward.name);
      if (!name) continue;

      const nameNeedsUpdate = !isLocalizedString(reward.name);
      // "" and plain strings → null / { th, en }; already-null stays null
      const descriptionNeedsUpdate =
        reward.description !== undefined &&
        reward.description !== null &&
        !isLocalizedString(reward.description);

      if (!nameNeedsUpdate && !descriptionNeedsUpdate) continue;

      await ctx.db.patch(reward._id, {
        ...(nameNeedsUpdate ? { name } : {}),
        ...(descriptionNeedsUpdate
          ? { description: toLocalizedString(reward.description) }
          : {}),
      });
      updated += 1;
    }

    return { scanned: rewards.length, updated };
  },
);

export const bulkDelete = authMutation
  .input(
    z.object({
      ids: z.array(z.string()),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const unique = [...new Set(input.ids.map(toRewardId))];
    let deleted = 0;
    for (const rewardId of unique) {
      const reward = await ctx.db.get(rewardId);
      if (!reward) continue;
      await deleteRewardAndDependents(ctx, rewardId);
      deleted += 1;
    }
    return { deleted };
  });
