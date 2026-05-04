import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { authMutation, authQuery } from "../lib/crpc";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./generated/server";

const SORT_VALUES = ["recently-updated", "purchase-date"] as const;
type PurchaseSort = (typeof SORT_VALUES)[number];

type ReviewByRedemptionIdMap = Map<Id<"redemption">, Doc<"review">>;

async function buildReviewByRedemptionId(
  ctx: QueryCtx,
  userId: Id<"user">,
): Promise<ReviewByRedemptionIdMap> {
  const reviews = await ctx.db
    .query("review")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  const byRedemptionId = new Map<Id<"redemption">, Doc<"review">>();
  for (const review of reviews) {
    byRedemptionId.set(review.redemptionId, review);
  }
  return byRedemptionId;
}

function redemptionPurchaseTimestamp(r: Doc<"redemption">): number {
  return r.createdAt ?? r._creationTime;
}

function redemptionInDateRange(
  redemption: Doc<"redemption">,
  from: number | null,
  to: number | null,
): boolean {
  const ts = redemptionPurchaseTimestamp(redemption);
  if (from != null && ts < from) return false;
  if (to != null && ts > to) return false;
  return true;
}

function assertRedemptionDateRange(
  from: number | null,
  to: number | null,
): void {
  if (from != null && to != null && from > to) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "Start date cannot be greater than end date",
    });
  }
}

function redemptionAndRewardMatchesQuery(
  reward: Doc<"reward"> | null,
  normalizedQuery: string,
): boolean {
  if (!reward) return false;
  if (!normalizedQuery) return true;
  return (
    reward.name.toLowerCase().includes(normalizedQuery) ||
    (reward.description?.toLowerCase().includes(normalizedQuery) ?? false)
  );
}

type RedemptionListPageRow = {
  redemption: {
    _id: Id<"redemption">;
    createdAt: number;
    employeeId: Id<"employee">;
    pointSpent: number;
    quantity: number;
    status: Doc<"redemption">["status"];
  };
  reward: {
    _id: Id<"reward">;
    name: string;
    image: string;
    pointCost: number;
  };
  review: {
    _id: string;
    stars: number;
    comment: string | null;
    createdAt: number;
  } | null;
};

function enqueueRedemptionPageRows(params: {
  normalizedQuery: string;
  dateFrom: number | null;
  dateTo: number | null;
  redemptionRows: Doc<"redemption">[];
  rewardsByIndex: Array<Doc<"reward"> | null>;
  reviewByRedemptionId: Map<Id<"redemption">, Doc<"review">>;
  out: RedemptionListPageRow[];
  slotsRemaining: number;
}): number {
  let used = 0;
  for (let i = 0; i < params.redemptionRows.length; i++) {
    if (used >= params.slotsRemaining) break;
    const redemption = params.redemptionRows[i];
    const reward = params.rewardsByIndex[i];

    if (reward == null) continue;

    if (!redemptionInDateRange(redemption, params.dateFrom, params.dateTo)) {
      continue;
    }

    if (!redemptionAndRewardMatchesQuery(reward, params.normalizedQuery))
      continue;

    const reviewDoc = params.reviewByRedemptionId.get(redemption._id) ?? null;

    params.out.push({
      redemption: {
        _id: redemption._id,
        createdAt: redemption.createdAt ?? redemption._creationTime,
        employeeId: redemption.employeeId,
        pointSpent: redemption.pointSpent,
        quantity: redemption.quantity,
        status: redemption.status,
      },
      reward: {
        _id: reward._id,
        name: reward.name,
        image: reward.image ?? "",
        pointCost: reward.pointCost,
      },
      review: reviewDoc
        ? {
            _id: String(reviewDoc._id),
            stars: reviewDoc.stars,
            comment: reviewDoc.comment ?? null,
            createdAt: reviewDoc.createdAt ?? reviewDoc._creationTime,
          }
        : null,
    });
    used += 1;
  }

  return used;
}

async function hydrateRedemptionDocsFromOrmPage(
  ctx: QueryCtx,
  ormPage: ReadonlyArray<{ id: string }>,
): Promise<Doc<"redemption">[]> {
  const docs = await Promise.all(
    ormPage.map((row) => ctx.db.get(row.id as Id<"redemption">)),
  );
  return docs.filter((doc): doc is Doc<"redemption"> => doc != null);
}

function redemptionListBaseQuery(
  ctx: QueryCtx,
  employeeDocId: Id<"employee">,
  sort: PurchaseSort,
) {
  const order =
    sort === "recently-updated"
      ? ({ updatedAt: "desc" } as const)
      : ({ createdAt: "desc" } as const);

  return ctx.orm.query.redemption
    .select()
    .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeDocId))
    .orderBy(order)
    .map((row) => row);
}

export const getMany = authQuery
  .input(
    z.object({
      q: z.string().optional().nullable(),
      sort: z.enum(SORT_VALUES).optional().nullable(),
      limit: z.number(),
      cursor: z.string().nullish(),
      from: z.number().nullish(),
      to: z.number().nullish(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const normalizedQuery = input.q?.trim().toLowerCase() ?? "";
    const sortKey: PurchaseSort = input.sort ?? "purchase-date";
    const dateFrom = input.from ?? null;
    const dateTo = input.to ?? null;

    assertRedemptionDateRange(dateFrom, dateTo);

    const reviewByRedemptionId = await buildReviewByRedemptionId(
      ctx,
      ctx.userId as Id<"user">,
    );

    const page: RedemptionListPageRow[] = [];

    const baseQuery = redemptionListBaseQuery(
      ctx,
      ctx.user.employeeId,
      sortKey,
    );

    let cursor = input.cursor ?? null;
    let pageResult = await baseQuery.paginate({
      cursor,
      limit: input.limit,
    });

    let isDone = false;

    while (page.length < input.limit) {
      const redemptionBatch = await hydrateRedemptionDocsFromOrmPage(
        ctx,
        pageResult.page,
      );
      const rewardsByIndex = await Promise.all(
        redemptionBatch.map((row) => ctx.db.get(row.rewardId)),
      );

      enqueueRedemptionPageRows({
        normalizedQuery,
        dateFrom,
        dateTo,
        redemptionRows: redemptionBatch,
        rewardsByIndex,
        reviewByRedemptionId,
        out: page,
        slotsRemaining: input.limit - page.length,
      });

      isDone =
        pageResult.isDone ||
        pageResult.continueCursor == null ||
        redemptionBatch.length === 0;

      if (isDone || page.length >= input.limit) {
        break;
      }

      cursor = pageResult.continueCursor;
      pageResult = await baseQuery.paginate({
        cursor,
        limit: input.limit,
      });
    }

    if (isDone) {
      return {
        ...pageResult,
        page,
        continueCursor: null,
        hasNextPage: false,
        isDone: true,
      };
    }

    const probeCursor = pageResult.continueCursor;
    let hasNextPage = false;
    let probeIsDone = probeCursor == null;
    let currentProbeCursor = probeCursor;

    while (!probeIsDone && !hasNextPage) {
      const probeResult = await baseQuery.paginate({
        cursor: currentProbeCursor,
        limit: 1,
      });
      if (probeResult.page.length === 0) {
        probeIsDone = true;
        break;
      }

      const [probeOrmRow] = probeResult.page;
      const probeRedemption =
        probeOrmRow != null
          ? await ctx.db.get(probeOrmRow.id as Id<"redemption">)
          : null;

      const probeReward =
        probeRedemption != null
          ? await ctx.db.get(probeRedemption.rewardId)
          : null;
      hasNextPage =
        probeRedemption != null &&
        redemptionInDateRange(probeRedemption, dateFrom, dateTo) &&
        redemptionAndRewardMatchesQuery(probeReward, normalizedQuery);

      probeIsDone = probeResult.isDone || probeResult.continueCursor == null;
      currentProbeCursor = probeResult.continueCursor;
    }

    return {
      ...pageResult,
      page,
      hasNextPage,
    };
  });

export const reviewRedemption = authMutation
  .input(
    z.object({
      redemptionId: z.string(),
      stars: z.number().int().min(1).max(5),
      comment: z.string().trim().max(2000).optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const redemptionId = input.redemptionId as Id<"redemption">;
    const redemption = await ctx.db.get(redemptionId);

    if (!redemption) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Redemption not found",
      });
    }

    if (redemption.employeeId !== ctx.user.employeeId) {
      throw new CRPCError({
        code: "FORBIDDEN",
        message: "Not your redemption",
      });
    }

    // if (redemption.status === "cancelled") {
    //   throw new CRPCError({
    //     code: "BAD_REQUEST",
    //     message: "Cannot review a cancelled redemption",
    //   });
    // }

    // if (redemption.status !== "fulfilled") {
    //   throw new CRPCError({
    //     code: "BAD_REQUEST",
    //     message: "Only fulfilled redemptions can be reviewed",
    //   });
    // }

    const existing = await ctx.db
      .query("review")
      .withIndex("by_redemptionId", (q) => q.eq("redemptionId", redemptionId))
      .first();

    if (existing) {
      throw new CRPCError({
        code: "CONFLICT",
        message: "This redemption has already been reviewed",
      });
    }

    const reward = await ctx.db.get(redemption.rewardId);
    if (!reward) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Reward not found",
      });
    }

    const trimmed = input.comment?.trim();
    await ctx.db.insert("review", {
      redemptionId,
      rewardId: redemption.rewardId,
      userId: ctx.userId as Id<"user">,
      stars: input.stars,
      ...(trimmed && trimmed.length > 0 ? { comment: trimmed } : {}),
    });
  });
