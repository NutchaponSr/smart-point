import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { requireAdmin } from "../lib/auth-helper";
import { authMutation, authQuery } from "../lib/crpc";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./generated/server";

const SORT_VALUES = ["recently-updated", "purchase-date"] as const;
type PurchaseSort = (typeof SORT_VALUES)[number];

const SHIPPING_STATUS_VALUES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
] as const;
type ShippingStatus = (typeof SHIPPING_STATUS_VALUES)[number];

const REDEMPTION_STATUS_VALUES = ["pending", "fulfilled", "cancelled"] as const;
type RedemptionStatus = (typeof REDEMPTION_STATUS_VALUES)[number];

type ReviewByRedemptionIdMap = Map<Id<"redemption">, Doc<"review">>;

async function resolveStorageImageUrl(
  storage: QueryCtx["storage"],
  image: string | null | undefined,
): Promise<string | null> {
  if (image == null || String(image).trim() === "") return null;
  return await storage.getUrl(image as Id<"_storage">);
}

function resolveEffectiveShippingStatus(
  redemption: Doc<"redemption">,
): ShippingStatus {
  if (redemption.shippingStatus != null) {
    return redemption.shippingStatus;
  }
  if (redemption.status === "fulfilled") {
    return "delivered";
  }
  return "pending";
}

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
    shippingStatus: ShippingStatus;
    trackingNumber: string | null;
    carrier: string | null;
    shippedAt: number | null;
    deliveredAt: number | null;
    fulfilledAt: number | null;
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
  rewardImagesByIndex: Array<string | null>;
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
        shippingStatus: resolveEffectiveShippingStatus(redemption),
        trackingNumber: redemption.trackingNumber ?? null,
        carrier: redemption.carrier ?? null,
        shippedAt: redemption.shippedAt ?? null,
        deliveredAt: redemption.deliveredAt ?? null,
        fulfilledAt: redemption.fulfilledAt ?? null,
      },
      reward: {
        _id: reward._id,
        name: reward.name,
        image: params.rewardImagesByIndex[i] ?? "",
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

type RedemptionAdminPageRow = {
  redemption: RedemptionListPageRow["redemption"];
  reward: RedemptionListPageRow["reward"];
  employee: {
    _id: Id<"employee">;
    employeeId: string;
    name: string;
    department: string;
    division: string;
  };
};

function redemptionAdminMatchesQuery(
  redemption: Doc<"redemption">,
  reward: Doc<"reward"> | null,
  employee: Doc<"employee"> | null,
  normalizedQuery: string,
): boolean {
  if (reward == null || employee == null) return false;
  if (!normalizedQuery) return true;

  return (
    reward.name.toLowerCase().includes(normalizedQuery) ||
    (reward.description?.toLowerCase().includes(normalizedQuery) ?? false) ||
    employee.name.toLowerCase().includes(normalizedQuery) ||
    employee.employeeId.toLowerCase().includes(normalizedQuery) ||
    (redemption.trackingNumber?.toLowerCase().includes(normalizedQuery) ??
      false)
  );
}

function redemptionMatchesShippingStatusFilter(
  redemption: Doc<"redemption">,
  shippingStatusFilter: ShippingStatus[] | null | undefined,
): boolean {
  if (shippingStatusFilter == null || shippingStatusFilter.length === 0) {
    return true;
  }
  return shippingStatusFilter.includes(
    resolveEffectiveShippingStatus(redemption),
  );
}

function redemptionMatchesStatusFilter(
  redemption: Doc<"redemption">,
  statusFilter: RedemptionStatus[] | null | undefined,
): boolean {
  if (statusFilter == null || statusFilter.length === 0) return true;
  return statusFilter.includes(redemption.status);
}

function redemptionAdminListBaseQuery(
  ctx: QueryCtx,
  sort: PurchaseSort,
  indexShippingStatus: ShippingStatus | null,
  indexStatus: RedemptionStatus | null,
  employeeDocId: Id<"employee"> | null,
) {
  const order =
    sort === "recently-updated"
      ? ({ updatedAt: "desc" } as const)
      : ({ createdAt: "desc" } as const);

  if (employeeDocId != null && indexShippingStatus != null) {
    return ctx.orm.query.redemption
      .select()
      .withIndex("by_employeeId_shippingStatus", (q) =>
        q
          .eq("employeeId", employeeDocId)
          .eq("shippingStatus", indexShippingStatus),
      )
      .orderBy(order)
      .map((row) => row);
  }

  if (employeeDocId != null) {
    return ctx.orm.query.redemption
      .select()
      .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeDocId))
      .orderBy(order)
      .map((row) => row);
  }

  if (indexShippingStatus != null) {
    return ctx.orm.query.redemption
      .select()
      .withIndex("by_shippingStatus", (q) =>
        q.eq("shippingStatus", indexShippingStatus),
      )
      .orderBy(order)
      .map((row) => row);
  }

  if (indexStatus != null) {
    return ctx.orm.query.redemption
      .select()
      .withIndex("by_status", (q) => q.eq("status", indexStatus))
      .orderBy(order)
      .map((row) => row);
  }

  return ctx.orm.query.redemption.select().orderBy(order).map((row) => row);
}

async function resolveEmployeeDocIdFromPublicId(
  ctx: QueryCtx,
  publicEmployeeId: string,
): Promise<Id<"employee"> | null> {
  const trimmed = publicEmployeeId.trim();
  if (trimmed === "") return null;

  const employee = await ctx.db
    .query("employee")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", trimmed))
    .unique();

  return employee?._id ?? null;
}

function enqueueRedemptionAdminPageRows(params: {
  normalizedQuery: string;
  dateFrom: number | null;
  dateTo: number | null;
  shippingStatusFilter: ShippingStatus[] | null | undefined;
  statusFilter: RedemptionStatus[] | null | undefined;
  redemptionRows: Doc<"redemption">[];
  rewardsByIndex: Array<Doc<"reward"> | null>;
  rewardImagesByIndex: Array<string | null>;
  employeesByIndex: Array<Doc<"employee"> | null>;
  out: RedemptionAdminPageRow[];
  slotsRemaining: number;
}): number {
  let used = 0;

  for (let i = 0; i < params.redemptionRows.length; i++) {
    if (used >= params.slotsRemaining) break;

    const redemption = params.redemptionRows[i];
    const reward = params.rewardsByIndex[i];
    const employee = params.employeesByIndex[i];

    if (reward == null || employee == null) continue;

    if (!redemptionInDateRange(redemption, params.dateFrom, params.dateTo)) {
      continue;
    }

    if (
      !redemptionMatchesShippingStatusFilter(
        redemption,
        params.shippingStatusFilter,
      )
    ) {
      continue;
    }

    if (!redemptionMatchesStatusFilter(redemption, params.statusFilter)) {
      continue;
    }

    if (
      !redemptionAdminMatchesQuery(
        redemption,
        reward,
        employee,
        params.normalizedQuery,
      )
    ) {
      continue;
    }

    params.out.push({
      redemption: {
        _id: redemption._id,
        createdAt: redemption.createdAt ?? redemption._creationTime,
        employeeId: redemption.employeeId,
        pointSpent: redemption.pointSpent,
        quantity: redemption.quantity,
        status: redemption.status,
        shippingStatus: resolveEffectiveShippingStatus(redemption),
        trackingNumber: redemption.trackingNumber ?? null,
        carrier: redemption.carrier ?? null,
        shippedAt: redemption.shippedAt ?? null,
        deliveredAt: redemption.deliveredAt ?? null,
        fulfilledAt: redemption.fulfilledAt ?? null,
      },
      reward: {
        _id: reward._id,
        name: reward.name,
        image: params.rewardImagesByIndex[i] ?? "",
        pointCost: reward.pointCost,
      },
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        division: employee.division,
      },
    });
    used += 1;
  }

  return used;
}

function redemptionAdminRowMatchesFilters(
  redemption: Doc<"redemption">,
  reward: Doc<"reward"> | null,
  employee: Doc<"employee"> | null,
  params: {
    normalizedQuery: string;
    dateFrom: number | null;
    dateTo: number | null;
    shippingStatusFilter: ShippingStatus[] | null | undefined;
    statusFilter: RedemptionStatus[] | null | undefined;
  },
): boolean {
  if (reward == null || employee == null) return false;
  if (!redemptionInDateRange(redemption, params.dateFrom, params.dateTo)) {
    return false;
  }
  if (
    !redemptionMatchesShippingStatusFilter(
      redemption,
      params.shippingStatusFilter,
    )
  ) {
    return false;
  }
  if (!redemptionMatchesStatusFilter(redemption, params.statusFilter)) {
    return false;
  }
  return redemptionAdminMatchesQuery(
    redemption,
    reward,
    employee,
    params.normalizedQuery,
  );
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
      const rewardImagesByIndex = await Promise.all(
        rewardsByIndex.map((reward) =>
          reward != null
            ? resolveStorageImageUrl(ctx.storage, reward.image)
            : Promise.resolve(null),
        ),
      );

      enqueueRedemptionPageRows({
        normalizedQuery,
        dateFrom,
        dateTo,
        redemptionRows: redemptionBatch,
        rewardsByIndex,
        rewardImagesByIndex,
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

export const getManyAdmin = authQuery
  .input(
    z.object({
      q: z.string().optional().nullable(),
      shippingStatus: z
        .array(z.enum(SHIPPING_STATUS_VALUES))
        .optional()
        .nullable(),
      status: z
        .array(z.enum(REDEMPTION_STATUS_VALUES))
        .optional()
        .nullable(),
      sort: z.enum(SORT_VALUES).optional().nullable(),
      limit: z.number().min(1).max(100),
      cursor: z.string().nullish(),
      from: z.number().nullish(),
      to: z.number().nullish(),
      by: z.string().optional().nullable(),
    }),
  )
  .query(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const normalizedQuery = input.q?.trim().toLowerCase() ?? "";
    const sortKey: PurchaseSort = input.sort ?? "purchase-date";
    const dateFrom = input.from ?? null;
    const dateTo = input.to ?? null;
    const shippingStatusFilter = input.shippingStatus ?? null;
    const statusFilter = input.status ?? null;

    assertRedemptionDateRange(dateFrom, dateTo);

    const employeeDocId =
      input.by != null
        ? await resolveEmployeeDocIdFromPublicId(ctx, input.by)
        : null;

    if (input.by != null && input.by.trim() !== "" && employeeDocId == null) {
      return {
        page: [] as RedemptionAdminPageRow[],
        continueCursor: null,
        hasNextPage: false,
        isDone: true,
      };
    }

    const indexShippingStatus =
      shippingStatusFilter?.length === 1 ? shippingStatusFilter[0] : null;
    const indexStatus = statusFilter?.length === 1 ? statusFilter[0] : null;

    const page: RedemptionAdminPageRow[] = [];
    const filterParams = {
      normalizedQuery,
      dateFrom,
      dateTo,
      shippingStatusFilter,
      statusFilter,
    };

    const baseQuery = redemptionAdminListBaseQuery(
      ctx,
      sortKey,
      indexShippingStatus,
      indexStatus,
      employeeDocId,
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
      const employeesByIndex = await Promise.all(
        redemptionBatch.map((row) => ctx.db.get(row.employeeId)),
      );
      const rewardImagesByIndex = await Promise.all(
        rewardsByIndex.map((reward) =>
          reward != null
            ? resolveStorageImageUrl(ctx.storage, reward.image)
            : Promise.resolve(null),
        ),
      );

      enqueueRedemptionAdminPageRows({
        ...filterParams,
        redemptionRows: redemptionBatch,
        rewardsByIndex,
        rewardImagesByIndex,
        employeesByIndex,
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
      const probeEmployee =
        probeRedemption != null
          ? await ctx.db.get(probeRedemption.employeeId)
          : null;

      hasNextPage =
        probeRedemption != null &&
        redemptionAdminRowMatchesFilters(
          probeRedemption,
          probeReward,
          probeEmployee,
          filterParams,
        );

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

    if (redemption.status === "cancelled") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Cannot review a cancelled redemption",
      });
    }

    if (resolveEffectiveShippingStatus(redemption) !== "delivered") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Only delivered redemptions can be reviewed",
      });
    }

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

/** User ยืนยันรับของเมื่อสถานะจัดส่งเป็น shipped */
export const confirmDelivery = authMutation
  .input(
    z.object({
      redemptionId: z.string(),
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

    if (redemption.status === "cancelled") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Cannot confirm delivery for a cancelled redemption",
      });
    }

    if (resolveEffectiveShippingStatus(redemption) !== "shipped") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Only shipped redemptions can be confirmed as delivered",
      });
    }

    const now = Date.now();
    await ctx.db.patch(redemptionId, {
      shippingStatus: "delivered",
      deliveredAt: redemption.deliveredAt ?? now,
      status: "fulfilled",
      fulfilledAt: redemption.fulfilledAt ?? now,
      fulfilledBy: redemption.fulfilledBy ?? ctx.user.employeeId,
    });
  });

export const updateShippingStatus = authMutation
  .input(
    z.object({
      redemptionId: z.string(),
      shippingStatus: z.enum(SHIPPING_STATUS_VALUES),
      trackingNumber: z.string().trim().max(100).optional(),
      carrier: z.string().trim().max(100).optional(),
      note: z.string().trim().max(2000).optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const redemptionId = input.redemptionId as Id<"redemption">;
    const redemption = await ctx.db.get(redemptionId);

    if (!redemption) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Redemption not found",
      });
    }

    if (redemption.status === "cancelled") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Cannot update shipping for a cancelled redemption",
      });
    }

    const now = Date.now();
    const patch: Partial<Doc<"redemption">> = {
      shippingStatus: input.shippingStatus,
    };

    if (input.trackingNumber !== undefined) {
      patch.trackingNumber = input.trackingNumber || undefined;
    }
    if (input.carrier !== undefined) {
      patch.carrier = input.carrier || undefined;
    }
    if (input.note !== undefined) {
      patch.note = input.note || undefined;
    }

    if (input.shippingStatus === "shipped" && redemption.shippedAt == null) {
      patch.shippedAt = now;
    }

    if (input.shippingStatus === "delivered") {
      if (redemption.deliveredAt == null) {
        patch.deliveredAt = now;
      }
      patch.status = "fulfilled";
      patch.fulfilledAt = redemption.fulfilledAt ?? now;
      patch.fulfilledBy = redemption.fulfilledBy ?? ctx.user.employeeId;
    }

    await ctx.db.patch(redemptionId, patch);
  });
