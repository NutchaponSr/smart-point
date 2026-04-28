import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { authMutation, authQuery, publicQuery } from "../lib/crpc";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./generated/server";

const activityCategory = z.enum([
  "external",
  "internal",
  "internal_bu",
  "specials_point",
]);

const ACTIVITY_EVIDENCE_IMAGE_MAX_BYTES = 1_048_576;
const ACTIVITY_EVIDENCE_PDF_MAX_BYTES = 5_242_880;
const ALLOWED_ACTIVITY_EVIDENCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

function matchesActivitySearch(
  row: {
    name: string;
    description: string | null;
    category: "external" | "internal" | "internal_bu" | "specials_point";
    point: number;
  },
  normalizedQuery: string,
) {
  if (!normalizedQuery) return true;
  return (
    row.name.toLowerCase().includes(normalizedQuery) ||
    (row.description ?? "").toLowerCase().includes(normalizedQuery) ||
    row.category.toLowerCase().includes(normalizedQuery) ||
    String(row.point).includes(normalizedQuery)
  );
}

/** นับคนที่ยังลงทะเบียน/เข้าร่วม (ไม่นับ cancelled) */
async function countActiveParticipants(
  ctx: QueryCtx,
  activityId: Id<"activity">,
) {
  const rows = await ctx.db
    .query("activityParticipant")
    .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
    .collect();
  return rows.filter((p) => p.status !== "cancelled").length;
}

async function getActiveParticipantsMeta(
  ctx: QueryCtx,
  activityId: Id<"activity">,
  previewLimit: number,
) {
  type ParticipantPreview = {
    participantId: Id<"activityParticipant">;
    employeeId: Id<"employee">;
    name: string;
    image: string | null;
  };

  const rows = await ctx.db
    .query("activityParticipant")
    .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
    .collect();
  const active = rows.filter((p) => p.status !== "cancelled");
  const previewRows = active.slice(0, previewLimit);

  const participantsPreview: ParticipantPreview[] = (
    await Promise.all(
      previewRows.map(async (participant) => {
        const employee = await ctx.db.get(participant.employeeId);
        if (!employee) return null;
        const user = await ctx.db
          .query("user")
          .withIndex("by_employeeId", (q) => q.eq("employeeId", employee._id))
          .first();
        return {
          participantId: participant._id,
          employeeId: employee._id,
          name: employee.name,
          image: user?.image ?? null,
        } satisfies ParticipantPreview;
      }),
    )
  ).filter((x): x is ParticipantPreview => x != null);

  return {
    joinedCount: active.length,
    participantsPreview,
  };
}

function matchesParticipantsRange(
  joinedCount: number,
  minParticipants?: number | null,
  maxParticipants?: number | null,
) {
  if (minParticipants != null && joinedCount < minParticipants) {
    return false;
  }
  if (maxParticipants != null && joinedCount > maxParticipants) {
    return false;
  }
  return true;
}

/** รายชื่อ + งาน/แผนก ของผู้ร่วมกิจกรรม (สำหรับ getOne) */
async function listJoinedEmployeeDetails(
  ctx: QueryCtx,
  activityId: Id<"activity">,
  maxRows: number,
) {
  const rows = await ctx.db
    .query("activityParticipant")
    .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
    .collect();

  const active = rows
    .filter((p) => p.status !== "cancelled")
    .sort((a, b) => a._creationTime - b._creationTime);

  const totalJoined = active.length;
  const slice = active.slice(0, maxRows);

  const details = await Promise.all(
    slice.map(async (p) => {
      const employee = await ctx.db.get(p.employeeId);
      if (!employee) return null;
      return {
        participantId: p._id,
        employeeId: employee._id,
        employeeCode: employee.employeeId,
        name: employee.name,
        department: employee.department,
        position: employee.position,
        status: p.status,
        evidenceStorageId: p.evidenceStorageId ?? null,
        evidenceType: p.evidenceType ?? null,
        evidenceMimeType: p.evidenceMimeType ?? null,
        evidenceFileName: p.evidenceFileName ?? null,
        evidenceSize: p.evidenceSize ?? null,
        evidenceUploadedAt: p.evidenceUploadedAt ?? null,
        createdAt: p._creationTime,
      };
    }),
  );

  return {
    totalJoined,
    employees: details.filter(
      (x): x is NonNullable<(typeof details)[number]> => x != null,
    ),
  };
}

async function deleteActivityAndDependents(
  ctx: MutationCtx,
  activityId: Id<"activity">,
) {
  for (const p of await ctx.db
    .query("activityParticipant")
    .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
    .collect()) {
    await ctx.db.delete(p._id);
  }
  const sourceId = String(activityId);
  for (const pl of await ctx.db
    .query("pointLedger")
    .withIndex("by_sourceType_sourceId", (q) =>
      q.eq("sourceType", "activity").eq("sourceId", sourceId),
    )
    .collect()) {
    await ctx.db.delete(pl._id);
  }
  await ctx.db.delete(activityId);
}

async function assertEvidenceMeta(input: {
  ctx: Pick<MutationCtx, "storage">;
  storageId: Id<"_storage">;
}) {
  const meta = await input.ctx.storage.getMetadata(input.storageId);
  if (!meta) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "ไม่พบไฟล์ที่อัปโหลด",
    });
  }
  if (
    !ALLOWED_ACTIVITY_EVIDENCE_MIME_TYPES.includes(
      meta.contentType as (typeof ALLOWED_ACTIVITY_EVIDENCE_MIME_TYPES)[number],
    )
  ) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "รองรับเฉพาะไฟล์รูปภาพหรือ PDF",
    });
  }

  if (meta.contentType === "application/pdf") {
    if (meta.size > ACTIVITY_EVIDENCE_PDF_MAX_BYTES) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "ไฟล์ PDF ต้องมีขนาดไม่เกิน 5 MB",
      });
    }
    return {
      contentType: meta.contentType,
      size: meta.size,
      type: "pdf" as const,
    };
  }

  if (meta.size > ACTIVITY_EVIDENCE_IMAGE_MAX_BYTES) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "รูปภาพต้องมีขนาดไม่เกิน 1 MB",
    });
  }
  return {
    contentType: meta.contentType,
    size: meta.size,
    type: "image" as const,
  };
}

async function approveActivityParticipantReward(input: {
  ctx: MutationCtx;
  activityId: Id<"activity">;
  participantId: Id<"activityParticipant">;
  reviewerUserId: Id<"user"> | undefined;
}) {
  const participant = await input.ctx.db.get(input.participantId);
  if (!participant) {
    return { approved: false, skipped: true as const };
  }
  if (participant.activityId !== input.activityId) {
    return { approved: false, skipped: true as const };
  }
  if (participant.status !== "attended" || !participant.evidenceStorageId) {
    return { approved: false, skipped: true as const };
  }

  const activity = await input.ctx.db.get(input.activityId);
  if (!activity) {
    throw new CRPCError({ code: "NOT_FOUND", message: "Activity not found" });
  }

  const employeeWallet = await input.ctx.db
    .query("wallet")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", participant.employeeId))
    .first();
  if (!employeeWallet) {
    throw new CRPCError({
      code: "NOT_FOUND",
      message: "Wallet not found for participant",
    });
  }

  const sourceId = String(participant._id);
  const existingLedger = await input.ctx.db
    .query("pointLedger")
    .withIndex("by_sourceType_sourceId", (q) =>
      q.eq("sourceType", "activity").eq("sourceId", sourceId),
    )
    .first();

  if (!existingLedger) {
    const newBalance = employeeWallet.receivingBudget + activity.point;
    await input.ctx.db.patch(employeeWallet._id, {
      receivingBudget: newBalance,
    });
    await input.ctx.db.insert("pointLedger", {
      employeeId: participant.employeeId,
      delta: activity.point,
      balanceAfter: newBalance,
      balanceType: "receiving",
      sourceType: "activity",
      sourceId,
      note: `Activity reward: ${activity.name}`,
      createdAt: Date.now(),
    });
  }

  await input.ctx.db.patch(participant._id, {
    status: "rewarded",
    pointAwarded: activity.point,
    awardedBy: input.reviewerUserId,
    awardedAt: Date.now(),
  });

  return { approved: true as const, skipped: false as const };
}

const activityRow = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  point: z.number().int(),
  category: activityCategory,
  startDate: z.number(),
  endDate: z.number().optional().nullable(),
  maxParticipants: z.number().int().positive().optional().nullable(),
});

export const create = authMutation
  .input(activityRow)
  .mutation(async ({ ctx, input }) => {
    return await ctx.db.insert("activity", {
      name: input.name,
      description: input.description ?? null,
      point: input.point,
      category: input.category,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      maxParticipants: input.maxParticipants ?? null,
      isActive: true,
    });
  });

export const update = authMutation
  .input(
    z.object({
      activityId: z.string().min(1),
      name: z.string().trim().min(1).optional(),
      description: z.string().optional().nullable(),
      point: z.number().int().optional(),
      category: activityCategory.optional(),
      startDate: z.number().optional(),
      endDate: z.number().optional().nullable(),
      maxParticipants: z.number().int().positive().optional().nullable(),
      isActive: z.boolean().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const current = await ctx.db.get(activityId);
    if (!current) {
      throw new CRPCError({ code: "NOT_FOUND", message: "Activity not found" });
    }
    const patch: {
      name?: string;
      description?: string | null;
      point?: number;
      category?:
        | "external"
        | "internal"
        | "internal_bu"
        | "specials_point";
      startDate?: number;
      endDate?: number | null;
      maxParticipants?: number | null;
      isActive?: boolean;
    } = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.point !== undefined) patch.point = input.point;
    if (input.category !== undefined) patch.category = input.category;
    if (input.startDate !== undefined) patch.startDate = input.startDate;
    if (input.endDate !== undefined) patch.endDate = input.endDate;
    if (input.maxParticipants !== undefined)
      patch.maxParticipants = input.maxParticipants;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(activityId, patch);
    }
    return activityId;
  });

export const remove = authMutation
  .input(z.object({ activityId: z.string().min(1) }))
  .mutation(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const row = await ctx.db.get(activityId);
    if (!row) {
      throw new CRPCError({ code: "NOT_FOUND", message: "Activity not found" });
    }
    await deleteActivityAndDependents(ctx, activityId);
    return activityId;
  });

export const bulkCreate = authMutation
  .input(
    z.object({
      rows: z.array(activityRow),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    let inserted = 0;
    for (const row of input.rows) {
      await ctx.db.insert("activity", {
        name: row.name,
        description: row.description ?? null,
        point: row.point,
        category: row.category,
        startDate: row.startDate,
        endDate: row.endDate ?? null,
        maxParticipants: row.maxParticipants ?? null,
        isActive: true,
      });
      inserted += 1;
    }
    return { inserted };
  });

export const bulkDelete = authMutation
  .input(
    z.object({
      activityIds: z.array(z.string().min(1)),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const unique = [
      ...new Set(input.activityIds.map((id) => id as Id<"activity">)),
    ];
    let deleted = 0;
    for (const activityId of unique) {
      const row = await ctx.db.get(activityId);
      if (!row) continue;
      await deleteActivityAndDependents(ctx, activityId);
      deleted += 1;
    }
    return { deleted };
  });

export const bulkAddParticipants = authMutation
  .input(
    z.object({
      activityId: z.string().min(1),
      rows: z.array(
        z.object({
          employeeIds: z.array(z.string().min(1)),
        }),
      ),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    let added = 0;
    let reactivated = 0;
    let skipped = 0;

    for (const row of input.rows) {
      const activityId = input.activityId as Id<"activity">;
      const activity = await ctx.db.get(activityId);
      const unique = [...new Set(row.employeeIds)];

      if (!activity) {
        skipped += unique.length;
        continue;
      }

      const existingRows = await ctx.db
        .query("activityParticipant")
        .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
        .collect();
      let activeCount = existingRows.filter((p) => p.status !== "cancelled")
        .length;

      for (const employeeId of unique) {
        const emp = await ctx.db
          .query("employee")
          .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
          .first();

        if (!emp) {
          skipped += 1;
          continue;
        }
        const existing = await ctx.db
          .query("activityParticipant")
          .withIndex("by_activityId_employeeId", (q) =>
            q.eq("activityId", activityId).eq("employeeId", emp._id),
          )
          .first();

        if (existing && existing.status !== "cancelled") {
          skipped += 1;
          continue;
        }

        if (existing && existing.status === "cancelled") {
          if (
            activity.maxParticipants != null &&
            activeCount >= activity.maxParticipants
          ) {
            skipped += 1;
            continue;
          }
          await ctx.db.patch(existing._id, { status: "registered" });
          reactivated += 1;
          activeCount += 1;
          continue;
        }

        if (
          activity.maxParticipants != null &&
          activeCount >= activity.maxParticipants
        ) {
          skipped += 1;
          continue;
        }

        await ctx.db.insert("activityParticipant", {
          activityId,
          employeeId: emp._id,
          status: "registered",
        });
        added += 1;
        activeCount += 1;
      }
    }

    return { added, reactivated, skipped };
  });

export const getMany = authQuery
  .input(
    z.object({
      q: z.string().optional().nullable(),
      limit: z.number(),
      cursor: z.string().nullish(),
      view: z.array(activityCategory).optional().nullable(),
      minParticipants: z.number().optional().nullable(),
      maxParticipants: z.number().optional().nullable(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const normalizedQuery = input.q?.trim().toLowerCase() ?? "";
    const minParticipants = input.minParticipants ?? null;
    const maxParticipants = input.maxParticipants ?? null;

    const baseQuery = ctx.orm.query.activity
      .select()
      .withIndex("by_startDate")
      .orderBy({ startDate: "desc" })
      .filter((row) => {
        if (!row.isActive) return false;
        if (input.view != null && !input.view.includes(row.category)) {
          return false;
        }
        return matchesActivitySearch(row, normalizedQuery);
      })
      .map((row) => row);

    let cursor = input.cursor ?? null;
    let isDone = false;
    let pageResult = await baseQuery.paginate({
      cursor,
      limit: input.limit,
    });
    const page: Array<
      (typeof pageResult.page)[number] & {
        joinedCount: number;
        participantsPreview: Array<{
          participantId: Id<"activityParticipant">;
          employeeId: Id<"employee">;
          name: string;
          image: string | null;
        }>;
      }
    > = [];

    while (page.length < input.limit) {
      const enrichedRows = await Promise.all(
        pageResult.page.map(async (activity) => {
          const { joinedCount, participantsPreview } =
            await getActiveParticipantsMeta(
              ctx,
              activity.id as Id<"activity">,
              3,
            );
          return {
            ...activity,
            joinedCount,
            participantsPreview,
          };
        }),
      );

      const filteredRows = enrichedRows.filter((activity) =>
        matchesParticipantsRange(
          activity.joinedCount,
          minParticipants,
          maxParticipants,
        ),
      );
      page.push(...filteredRows.slice(0, input.limit - page.length));

      isDone =
        pageResult.isDone ||
        pageResult.continueCursor == null ||
        pageResult.page.length === 0;
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

      const [probeItem] = probeResult.page;
      const joinedCount = await countActiveParticipants(
        ctx,
        probeItem.id as Id<"activity">,
      );
      hasNextPage = matchesParticipantsRange(
        joinedCount,
        minParticipants,
        maxParticipants,
      );
      probeIsDone =
        probeResult.isDone || probeResult.continueCursor == null;
      currentProbeCursor = probeResult.continueCursor;
    }

    return {
      ...pageResult,
      page,
      hasNextPage,
    };
  });

export const getOne = authQuery
  .input(
    z.object({
      activityId: z.string().min(1),
    }),
  )
  .query(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Activity not found",
      });
    }

    const { totalJoined, employees: joinedEmployees } =
      await listJoinedEmployeeDetails(ctx, activityId, 200);

    const me = await ctx.db
      .query("activityParticipant")
      .withIndex("by_activityId_employeeId", (q) =>
        q
          .eq("activityId", activityId)
          .eq("employeeId", ctx.user.employeeId),
      )
      .first();

    return {
      ...activity,
      joinedCount: totalJoined,
      joinedEmployees,
      myParticipation: me
        ? {
            participantId: me._id,
            status: me.status,
            pointAwarded: me.pointAwarded ?? null,
            awardedAt: me.awardedAt ?? null,
            evidenceStorageId: me.evidenceStorageId ?? null,
            evidenceType: me.evidenceType ?? null,
            evidenceMimeType: me.evidenceMimeType ?? null,
            evidenceFileName: me.evidenceFileName ?? null,
            evidenceSize: me.evidenceSize ?? null,
            evidenceUploadedAt: me.evidenceUploadedAt ?? null,
          }
        : null,
    };
  });

export const join = authMutation
  .input(
    z.object({
      activityId: z.string(),
      employeeId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const employeeId = input.employeeId as Id<"employee">;

    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Activity not found",
      });
    }
    if (!activity.isActive) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Activity is not active",
      });
    }

    const existing = await ctx.db
      .query("activityParticipant")
      .withIndex("by_activityId_employeeId", (q) =>
        q.eq("activityId", activityId).eq("employeeId", employeeId),
      )
      .first();

    if (existing && existing.status !== "cancelled") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "You have already joined this activity",
      });
    }

    const activeParticipants = await ctx.db
      .query("activityParticipant")
      .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
      .collect();
    const participantCount = activeParticipants.filter(
      (participant) => participant.status !== "cancelled",
    ).length;

    if (
      activity.maxParticipants != null &&
      participantCount >= activity.maxParticipants
    ) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Activity is full",
      });
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "registered",
      });
      return { joined: true };
    }

    await ctx.db.insert("activityParticipant", {
      activityId,
      employeeId,
      status: "registered",
    });

    return { joined: true };
  });

export const bulkLeave = authMutation
  .input(
    z.object({
      activityId: z.string().min(1),
      participantIds: z.array(z.string().min(1)),
    }),
  )
  .output(
    z.object({
      left: z.number(),
      skipped: z.number(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Activity not found",
      });
    }

    const participantIds = [
      ...new Set(
        input.participantIds.map((id) => id as Id<"activityParticipant">),
      ),
    ];

    let left = 0;
    let skipped = 0;

    for (const participantId of participantIds) {
      const participant = await ctx.db.get(participantId);
      if (!participant) {
        skipped += 1;
        continue;
      }
      if (participant.activityId !== activityId) {
        skipped += 1;
        continue;
      }
      if (participant.status !== "registered") {
        skipped += 1;
        continue;
      }

      await ctx.db.delete(participantId);
      left += 1;
    }

    return { left, skipped };
  });

export const leave = authMutation
  .input(
    z.object({
      activityId: z.string(),
    }),
  )
  .output(
    z.object({
      left: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Activity not found",
      });
    }

    const participant = await ctx.db
      .query("activityParticipant")
      .withIndex("by_activityId_employeeId", (q) =>
        q.eq("activityId", activityId).eq("employeeId", ctx.user.employeeId),
      )
      .first();

    if (!participant || participant.status === "cancelled") {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "You have not joined this activity",
      });
    }
    if (participant.status !== "registered") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Cannot leave activity in current status",
      });
    }

    await ctx.db.delete(participant._id);

    return { left: true };
  });

export const attachEvidence = authMutation
  .input(
    z.object({
      activityId: z.string().min(1),
      storageId: z.string().min(1),
      fileName: z.string().trim().min(1).max(255),
    }),
  )
  .output(
    z.object({
      uploaded: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const storageId = input.storageId as Id<"_storage">;
    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Activity not found",
      });
    }

    const participant = await ctx.db
      .query("activityParticipant")
      .withIndex("by_activityId_employeeId", (q) =>
        q.eq("activityId", activityId).eq("employeeId", ctx.user.employeeId),
      )
      .first();
    if (!participant || participant.status === "cancelled") {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "You have not joined this activity",
      });
    }

    const uploader = await ctx.db
      .query("user")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", ctx.user.employeeId))
      .first();
    const meta = await assertEvidenceMeta({ ctx, storageId });
    await ctx.db.patch(participant._id, {
      evidenceStorageId: storageId,
      evidenceType: meta.type,
      evidenceMimeType: meta.contentType,
      evidenceFileName: input.fileName,
      evidenceSize: meta.size,
      evidenceUploadedAt: Date.now(),
      evidenceUploadedBy: uploader?._id,
      status: participant.status === "registered" ? "attended" : participant.status,
    });

    return { uploaded: true };
  });

export const approve = authMutation
  .input(
    z.object({
      activityId: z.string().min(1),
      participantId: z.string().min(1),
    }),
  )
  .output(
    z.object({
      approved: z.boolean(),
      skipped: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const participantId = input.participantId as Id<"activityParticipant">;
    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Activity not found",
      });
    }
    const reviewer = await ctx.db
      .query("user")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", ctx.user.employeeId))
      .first();
    return await approveActivityParticipantReward({
      ctx,
      activityId,
      participantId,
      reviewerUserId: reviewer?._id,
    });
  });

export const bulkApprove = authMutation
  .input(
    z.object({
      activityId: z.string().min(1),
      participantIds: z.array(z.string().min(1)).min(1).max(100),
    }),
  )
  .output(
    z.object({
      approved: z.number(),
      skipped: z.number(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const reviewer = await ctx.db
      .query("user")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", ctx.user.employeeId))
      .first();
    const activityId = input.activityId as Id<"activity">;
    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Activity not found",
      });
    }

    const participantIds = [
      ...new Set(
        input.participantIds.map((id) => id as Id<"activityParticipant">),
      ),
    ];
    let approved = 0;
    let skipped = 0;

    for (const participantId of participantIds) {
      const result = await approveActivityParticipantReward({
        ctx,
        activityId,
        participantId,
        reviewerUserId: reviewer?._id,
      });
      if (result.approved) {
        approved += 1;
      } else {
        skipped += 1;
      }
    }

    return { approved, skipped };
  });

/** จำนวนกิจกรรมที่เข้าร่วมอยู่ แต่ยังไม่ได้รับรางวัล (ยังไม่ `rewarded`; ไม่รวมที่ยกเลิก) */
export const count = authQuery.query(async ({ ctx }) => {
  const participations = await ctx.db
    .query("activityParticipant")
    .withIndex("by_employeeId", (q) =>
      q.eq("employeeId", ctx.user.employeeId),
    )
    .collect();

  const pendingReward = participations.filter(
    (p) => p.status !== "cancelled" && p.status !== "rewarded",
  );

  return { count: pendingReward.length };
});

function parseListOffsetCursor(cursor: string | null | undefined): number {
  if (cursor == null || cursor === "") return 0;
  if (!cursor.startsWith("o:")) return 0;
  const n = Number.parseInt(cursor.slice(2), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** กิจกรรมที่เข้าร่วม (ผู้ใช้ปัจจุบัน) พร้อมรูปแบบผลลัพธ์แบบ paginate เหมือน getMany */
export const list = authQuery
  .input(
    z.object({
      q: z.string().optional().nullable(),
      limit: z.number(),
      cursor: z.string().nullish(),
      view: z.array(activityCategory).optional().nullable(),
      status: z.array(z.enum(["registered", "rewarded"])).optional().nullable(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const employeeId = ctx.user.employeeId;
    const normalizedQuery = input.q?.trim().toLowerCase() ?? "";

    const participations = await ctx.db
      .query("activityParticipant")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
      .collect();

    const active = participations.filter((p) => p.status !== "cancelled");

    const rows = await Promise.all(
      active.map(async (p) => {
        const activity = await ctx.db.get(p.activityId);
        if (!activity) return null;
        return {
          ...activity,
          myParticipation: {
            participantId: p._id,
            status: p.status,
            pointAwarded: p.pointAwarded ?? null,
            awardedAt: p.awardedAt ?? null,
            evidenceStorageId: p.evidenceStorageId ?? null,
            evidenceType: p.evidenceType ?? null,
            evidenceMimeType: p.evidenceMimeType ?? null,
            evidenceFileName: p.evidenceFileName ?? null,
            evidenceSize: p.evidenceSize ?? null,
            evidenceUploadedAt: p.evidenceUploadedAt ?? null,
          },
        };
      }),
    );

    let items = rows.filter(
      (row): row is NonNullable<(typeof rows)[number]> => row != null,
    );

    if (input.view != null && input.view.length > 0) {
      items = items.filter((row) => input.view?.includes(row.category));
    }

    if (input.status != null && input.status.length > 0) {
      items = items.filter((row) =>
        input.status!.some((st) => st === row.myParticipation.status),
      );
    }

    items = items.filter((row) =>
      matchesActivitySearch(
        {
          name: row.name,
          description: row.description ?? null,
          category: row.category,
          point: row.point,
        },
        normalizedQuery,
      ),
    );

    items.sort((a, b) => {
      const d = b.startDate - a.startDate;
      if (d !== 0) return d;
      return String(b.myParticipation.participantId).localeCompare(
        String(a.myParticipation.participantId),
      );
    });

    const offset = parseListOffsetCursor(input.cursor);
    const page = items.slice(offset, offset + input.limit);
    const nextOffset = offset + page.length;
    const hasNextPage = nextOffset < items.length;
    const isDone = !hasNextPage;

    return {
      page,
      continueCursor: hasNextPage ? `o:${nextOffset}` : null,
      hasNextPage,
      isDone,
    };
  });