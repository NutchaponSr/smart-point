import z from "zod/v4";

import { CRPCError } from "better-convex/server";

import { authMutation, authQuery } from "../lib/crpc";

import type { Doc, Id } from "./_generated/dataModel";

export const getMany = authQuery
  .input(
    z.object({
      q: z.string().optional().nullable(),
      sort: z.enum(["recently-updated", "purchase-date"]).optional().nullable(),
    })
  )
  .paginated({
    limit: 20,
    item: z.object({
      redemption: z.object({
        _id: z.custom<Id<"redemption">>(),
        createdAt: z.number(),
        employeeId: z.string(),
        pointSpent: z.number(),
        quantity: z.number(),
        status: z.enum(["pending", "fulfilled", "cancelled"]),
      }),
      reward: z.object({
        _id: z.custom<Id<"reward">>(),
        name: z.string(),
        image: z.string(),
        pointCost: z.number(),
      }),
      review: z
        .object({
          _id: z.string(),
          stars: z.number(),
          comment: z.string().nullable(),
          createdAt: z.number(),
        })
        .nullable(),
    }),
  })
  .query(async ({ ctx, input }) => {
    const redemptions = await ctx.db
      .query("redemption")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", ctx.user.employeeId))
      .order("desc")
      .collect();

    const rewardIds = [...new Set(redemptions.map((r) => r.rewardId))];
    const rewardDocs = await Promise.all(
      rewardIds.map((id) => ctx.db.get(id))
    );
    const rewardById = new Map(
      rewardDocs
        .filter((doc): doc is NonNullable<typeof doc> => doc !== null)
        .map((doc) => [doc._id, doc])
    );

    const reviews = await ctx.db
      .query("review")
      .withIndex("by_userId", (q) =>
        q.eq("userId", ctx.userId as Id<"user">)
      )
      .collect();

    const reviewByRedemptionId = new Map<Id<"redemption">, Doc<"review">>();

    for (const review of reviews) {
      reviewByRedemptionId.set(review.redemptionId, review);
    }

    const normalizedQuery = input.q?.trim().toLowerCase() ?? "";
    const hasQuery = normalizedQuery.length > 0;
    const sortKey = input.sort ?? "purchase-date";

    const purchaseTime = (r: Doc<"redemption">) =>
      r.createdAt ?? r._creationTime;
    const updatedTime = (r: Doc<"redemption">) =>
      r.updatedAt ?? r._creationTime;

    const filtered: { redemption: Doc<"redemption">; reward: Doc<"reward"> }[] =
      [];

    for (const redemption of redemptions) {
      const reward = rewardById.get(redemption.rewardId);
      if (!reward) continue;

      if (hasQuery) {
        const nameMatch = reward.name.toLowerCase().includes(normalizedQuery);
        const descriptionMatch =
          reward.description?.toLowerCase().includes(normalizedQuery) ?? false;
        if (!nameMatch && !descriptionMatch) continue;
      }

      filtered.push({ redemption, reward });
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "recently-updated") {
        return updatedTime(b.redemption) - updatedTime(a.redemption);
      }
      return purchaseTime(b.redemption) - purchaseTime(a.redemption);
    });

    const startIndex = Math.max(
      0,
      Number.parseInt(input.cursor ?? "0", 10) || 0
    );
    const endIndex = startIndex + input.limit;
    const slice = sorted.slice(startIndex, endIndex);

    const page = [];

    for (const { redemption, reward } of slice) {
      const reviewDoc = reviewByRedemptionId.get(redemption._id) ?? null;

      page.push({
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
    }

    const continueCursor =
      endIndex >= sorted.length ? null : String(endIndex);

    return {
      page,
      isDone: continueCursor === null,
      continueCursor,
    };
  });

export const reviewRedemption = authMutation
  .input(
    z.object({
      redemptionId: z.string(),
      stars: z.number().int().min(1).max(5),
      comment: z.string().trim().max(2000).optional(),
    })
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
      .withIndex("by_redemptionId", (q) =>
        q.eq("redemptionId", redemptionId)
      )
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
