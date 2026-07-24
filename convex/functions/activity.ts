import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { ENABLE_BU_RECOMMENDED } from "../lib/activity-features";
import { appendActivityLog } from "../lib/activity-log";
import { authMutation, authQuery, publicQuery } from "../lib/crpc";
import {
  isBuRestrictedCategory,
  VALID_DIVISION_SLUGS,
} from "../lib/divisions";
import { awardSpecialPoints } from "../lib/points";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./generated/server";

const activityCategory = z.enum([
  "external",
  "internal",
  "internal_bu",
  "specials_point",
]);

const slugList = z.array(z.string().min(1)).optional();

function normalizeSlugList(value: (string | null)[] | null | undefined): string[] {
  return (value ?? []).filter((item): item is string => item != null && item !== "");
}

function dedupeSlugList(value: (string | null)[] | null | undefined): string[] {
  return [...new Set(normalizeSlugList(value))];
}

function assertKnownDivisionSlugs(
  slugs: string[],
  context: { rowIndex?: number } = {},
): void {
  const invalid = slugs.filter((slug) => !VALID_DIVISION_SLUGS.has(slug));
  if (invalid.length === 0) return;

  const prefix =
    context.rowIndex != null ? `แถว ${context.rowIndex + 1}: ` : "";
  throw new CRPCError({
    code: "BAD_REQUEST",
    message: `${prefix}BU ไม่ถูกต้อง: ${invalid.join(", ")}`,
  });
}

/** Normalize BU fields ก่อน insert/patch */
function normalizeActivityBuFields(
  row: {
    category: z.infer<typeof activityCategory>;
    allowedDivisions?: (string | null)[] | null;
    allowedDepartments?: (string | null)[] | null;
  },
  context: { rowIndex?: number } = {},
) {
  if (!isBuRestrictedCategory(row.category)) {
    return {
      allowedDivisions: [] as string[],
      allowedDepartments: [] as string[],
    };
  }

  const allowedDivisions = dedupeSlugList(row.allowedDivisions);
  assertKnownDivisionSlugs(allowedDivisions, context);

  return {
    allowedDivisions,
    allowedDepartments: [] as string[],
  };
}

function isEmployeeEligibleForActivity(
  activity: {
    category: z.infer<typeof activityCategory>;
    allowedDivisions?: (string | null)[] | null;
    allowedDepartments?: (string | null)[] | null;
  },
  employee: { division: string; department: string },
): boolean {
  if (
    activity.category !== "internal_bu" &&
    activity.category !== "specials_point"
  ) {
    return true;
  }

  const divisions = normalizeSlugList(activity.allowedDivisions);

  if (divisions.length === 0) {
    return true;
  }

  return divisions.includes(employee.division);
}

/** กิจกรรมที่กำหนด BU เจาะจง (ไม่ใช่เปิดทุก BU) */
function hasSpecificBuRestriction(activity: {
  allowedDivisions?: (string | null)[] | null;
}): boolean {
  return normalizeSlugList(activity.allowedDivisions).length > 0;
}

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

/** กิจกรรมสิ้นสุดแล้วเมื่อเลย endDate ครบทั้งวัน (ไม่มี endDate = ยังไม่สิ้นสุด) */
function hasActivityEnded(
  activity: { endDate?: number | Date | null },
  now: number,
) {
  if (activity.endDate == null) return false;
  const endTimestamp =
    activity.endDate instanceof Date
      ? activity.endDate.getTime()
      : activity.endDate;
  const endOfDay = new Date(endTimestamp);
  endOfDay.setHours(23, 59, 59, 999);
  return now > endOfDay.getTime();
}

/**
 * ถ้ามีพนักงานเข้าร่วมอยู่ (ไม่นับ cancelled) จะลบไม่ได้จนกว่ากิจกรรมจะสิ้นสุด
 * ไม่มีผู้เข้าร่วม → ลบได้เลย
 */
async function assertCanDeleteActivity(
  ctx: MutationCtx,
  activityId: Id<"activity">,
  activity: { name: string; endDate?: number | null },
) {
  const participants = await countActiveParticipants(ctx, activityId);
  if (participants === 0) return;

  if (!hasActivityEnded(activity, Date.now())) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: `ไม่สามารถลบ "${activity.name}" ได้ เนื่องจากมีพนักงานเข้าร่วมอยู่ จนกว่ากิจกรรมจะสิ้นสุด`,
    });
  }
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

  const sourceId = String(participant._id);
  const award = await awardSpecialPoints(input.ctx, {
    employeeId: participant.employeeId,
    delta: activity.point,
    sourceType: "activity",
    sourceId,
    note: `Activity reward: ${activity.name}`,
  });
  const pointAwarded = award.awarded ? activity.point : 0;

  await input.ctx.db.patch(participant._id, {
    status: "rewarded",
    pointAwarded,
    awardedBy: input.reviewerUserId,
    awardedAt: Date.now(),
  });

  await appendActivityLog(input.ctx, {
    actorEmployeeId: participant.employeeId,
    type: "event_completed",
    sourceId: String(participant._id),
    summary: "ขอบคุณสำหรับการร่วมกิจกรรม",
    meta: {
      activityId: String(activity._id),
      participantId: String(participant._id),
      employeeId: String(participant.employeeId),
      activityName: activity.name,
      pointAwarded,
    },
  });

  return {
    approved: true as const,
    skipped: false as const,
    payoutBalanceType: "special" as const,
  };
}

async function awardJoinSpecialPoints(
  ctx: MutationCtx,
  input: {
    employeeId: Id<"employee">;
    participantId: Id<"activityParticipant">;
    activityName: string;
  },
) {
  await awardSpecialPoints(ctx, {
    employeeId: input.employeeId,
    delta: 5,
    sourceType: "activity",
    sourceId: `join:${input.participantId}`,
    note: `เข้าร่วมกิจกรรม: ${input.activityName}`,
  });
}

async function rejectActivityParticipant(input: {
  ctx: MutationCtx;
  activityId: Id<"activity">;
  participantId: Id<"activityParticipant">;
}) {
  const participant = await input.ctx.db.get(input.participantId);
  if (!participant) {
    return { rejected: false, skipped: true as const };
  }
  if (participant.activityId !== input.activityId) {
    return { rejected: false, skipped: true as const };
  }
  if (participant.status !== "attended") {
    return { rejected: false, skipped: true as const };
  }

  await input.ctx.db.patch(participant._id, {
    status: "registered",
    evidenceStorageId: null,
    evidenceType: null,
    evidenceMimeType: null,
    evidenceFileName: null,
    evidenceSize: null,
    evidenceUploadedAt: null,
    evidenceUploadedBy: null,
  });

  await appendActivityLog(input.ctx, {
    actorEmployeeId: participant.employeeId,
    type: "event_rejected",
    sourceId: `reject:${participant._id}:${Date.now()}`,
    summary: "กรุณาแนบหลักฐานตามเงื่อนไขกิจกรรม",
    meta: {
      activityId: String(input.activityId),
      participantId: String(participant._id),
      employeeId: String(participant.employeeId),
    },
  });

  return { rejected: true as const, skipped: false as const };
}

const activityRow = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().optional().nullable(),
    point: z.number().int().min(1),
    category: activityCategory,
    startDate: z.number(),
    endDate: z.number().optional().nullable(),
    maxParticipants: z.number().int().positive().optional().nullable(),
    allowedDivisions: slugList,
    allowedDepartments: slugList,
  })
  .superRefine((row, ctx) => {
    if (row.endDate != null && row.startDate > row.endDate) {
      ctx.addIssue({
        code: "custom",
        message: "วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด",
        path: ["startDate"],
      });
    }
  });

export const create = authMutation
  .input(activityRow)
  .mutation(async ({ ctx, input }) => {
    const bu = normalizeActivityBuFields(input);

    return await ctx.db.insert("activity", {
      name: input.name,
      description: input.description ?? null,
      point: input.point,
      category: input.category,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      maxParticipants: input.maxParticipants ?? null,
      allowedDivisions: bu.allowedDivisions,
      allowedDepartments: bu.allowedDepartments,
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
      allowedDivisions: slugList,
      allowedDepartments: slugList,
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
      allowedDivisions?: string[];
      allowedDepartments?: string[];
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

    const buFieldsTouched =
      input.category !== undefined ||
      input.allowedDivisions !== undefined ||
      input.allowedDepartments !== undefined;

    if (buFieldsTouched) {
      const bu = normalizeActivityBuFields({
        category: input.category ?? current.category,
        allowedDivisions: input.allowedDivisions ?? current.allowedDivisions,
        allowedDepartments: input.allowedDepartments ?? current.allowedDepartments,
      });
      patch.allowedDivisions = bu.allowedDivisions;
      patch.allowedDepartments = bu.allowedDepartments;
    }

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
    await assertCanDeleteActivity(ctx, activityId, row);
    await deleteActivityAndDependents(ctx, activityId);
    return activityId;
  });

export const bulkCreate = authMutation
  .input(
    z.object({
      rows: z.array(activityRow).min(1),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const normalizedRows = input.rows.map((row, index) => ({
      row,
      bu: normalizeActivityBuFields(row, { rowIndex: index }),
    }));

    let inserted = 0;
    for (const { row, bu } of normalizedRows) {
      await ctx.db.insert("activity", {
        name: row.name,
        description: row.description ?? null,
        point: row.point,
        category: row.category,
        startDate: row.startDate,
        endDate: row.endDate ?? null,
        maxParticipants: row.maxParticipants ?? null,
        allowedDivisions: bu.allowedDivisions,
        allowedDepartments: bu.allowedDepartments,
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
      await assertCanDeleteActivity(ctx, activityId, row);
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
          await appendActivityLog(ctx, {
            actorEmployeeId: emp._id,
            type: "event_joined",
            sourceId: String(existing._id),
            summary: `เข้าร่วมกิจกรรม: ${activity.name}`,
            meta: {
              activityId: String(activityId),
              participantId: String(existing._id),
              employeeId: String(emp._id),
              activityName: activity.name,
            },
          });
          await awardJoinSpecialPoints(ctx, {
            employeeId: emp._id,
            participantId: existing._id,
            activityName: activity.name,
          });
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

        const participantId = await ctx.db.insert("activityParticipant", {
          activityId,
          employeeId: emp._id,
          status: "registered",
        });
        await appendActivityLog(ctx, {
          actorEmployeeId: emp._id,
          type: "event_joined",
          sourceId: String(participantId),
          summary: `เข้าร่วมกิจกรรม: ${activity.name}`,
          meta: {
            activityId: String(activityId),
            participantId: String(participantId),
            employeeId: String(emp._id),
            activityName: activity.name,
          },
        });
        await awardJoinSpecialPoints(ctx, {
          employeeId: emp._id,
          participantId,
          activityName: activity.name,
        });
        added += 1;
        activeCount += 1;
      }
    }

    return { added, reactivated, skipped };
  });

/** สถานะการเข้าร่วมของผู้ใช้ปัจจุบันในกิจกรรมหนึ่ง (null = ยังไม่เข้าร่วม) */
async function getMyParticipationStatus(
  ctx: QueryCtx,
  activityId: Id<"activity">,
  employeeId: Id<"employee">,
) {
  const me = await ctx.db
    .query("activityParticipant")
    .withIndex("by_activityId_employeeId", (q) =>
      q.eq("activityId", activityId).eq("employeeId", employeeId),
    )
    .first();
  if (!me || me.status === "cancelled") return null;
  return me.status;
}

/**
 * กิจกรรมแนะนำสำหรับ Carousel
 * - ENABLE_BU_RECOMMENDED=true: เฉพาะ internal_bu / specials_point ที่กำหนด BU เจาะจง
 * - ENABLE_BU_RECOMMENDED=false: กิจกรรมทั้งหมดที่พนักงานมีสิทธิ์เข้าร่วม (ชั่วคราว)
 * เรียงตาม startDate ล่าสุด
 */
export const recommended = authQuery
  .input(
    z.object({
      limit: z.number().int().min(1).max(20),
      /** เวลาปัจจุบันจาก client (ปัดเป็นรายวัน) — ไม่ใช้ Date.now() ใน query เพื่อคง reactivity */
      now: z.number().optional().nullable(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const employee = ctx.user.employee;
    const now = input.now ?? null;

    const pageResult = await ctx.orm.query.activity
      .select()
      .withIndex("by_startDate")
      .orderBy({ startDate: "desc" })
      .filter((row) => {
        if (!row.isActive) return false;
        if (ENABLE_BU_RECOMMENDED) {
          if (
            row.category !== "internal_bu" &&
            row.category !== "specials_point"
          ) {
            return false;
          }
          if (!hasSpecificBuRestriction(row)) {
            return false;
          }
        }
        if (!isEmployeeEligibleForActivity(row, employee)) {
          return false;
        }
        // ตัดกิจกรรมที่จบไปแล้ว (ไม่มี endDate = ยังเปิดอยู่)
        if (now != null && hasActivityEnded(row, now)) {
          return false;
        }
        return true;
      })
      .map((row) => row)
      .paginate({ cursor: null, limit: input.limit });

    const items = await Promise.all(
      pageResult.page.map(async (activity) => {
        const activityId = activity.id as Id<"activity">;
        const [{ joinedCount, participantsPreview }, myStatus] =
          await Promise.all([
            getActiveParticipantsMeta(ctx, activityId, 3),
            getMyParticipationStatus(ctx, activityId, ctx.user.employeeId),
          ]);
        return {
          ...activity,
          joinedCount,
          participantsPreview,
          myStatus,
        };
      }),
    );

    return {
      bu: {
        department: employee.department,
        division: employee.division,
      },
      items,
    };
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
      /** หน้าผู้ใช้ (/events) — กรองตาม BU แม้เป็น admin */
      eligibleOnly: z.boolean().optional().nullable(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const normalizedQuery = input.q?.trim().toLowerCase() ?? "";
    const minParticipants = input.minParticipants ?? null;
    const maxParticipants = input.maxParticipants ?? null;
    const isAdmin = ctx.user.role === "admin";
    const employee = ctx.user.employee;
    const applyBuFilter = input.eligibleOnly === true || !isAdmin;

    const baseQuery = ctx.orm.query.activity
      .select()
      .withIndex("by_startDate")
      .orderBy({ startDate: "desc" })
      .filter((row) => {
        if (!row.isActive) return false;
        if (input.view != null && !input.view.includes(row.category)) {
          return false;
        }
        if (
          applyBuFilter &&
          !isEmployeeEligibleForActivity(row, employee)
        ) {
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
        myStatus: "registered" | "attended" | "rewarded" | null;
      }
    > = [];

    while (page.length < input.limit) {
      const enrichedRows = await Promise.all(
        pageResult.page.map(async (activity) => {
          const activityId = activity.id as Id<"activity">;
          const [{ joinedCount, participantsPreview }, myStatus] =
            await Promise.all([
              getActiveParticipantsMeta(ctx, activityId, 3),
              getMyParticipationStatus(ctx, activityId, ctx.user.employeeId),
            ]);
          return {
            ...activity,
            joinedCount,
            participantsPreview,
            myStatus,
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

const MAX_EXPORT_ROWS = 10_000;
const EXPORT_ACTIVITY_PAGE_SIZE = 100;

/** ส่งออกกิจกรรมทั้งหมดที่ตรง filter เดียวกับ getMany */
export const exportAll = authMutation
  .input(
    z.object({
      q: z.string().optional().nullable(),
      view: z.array(activityCategory).optional().nullable(),
      minParticipants: z.number().optional().nullable(),
      maxParticipants: z.number().optional().nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
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

    let pageResult = await baseQuery.paginate({
      cursor: null,
      limit: EXPORT_ACTIVITY_PAGE_SIZE,
    });

    type ActivityPageRow = (typeof pageResult.page)[number];
    type EnrichedActivityExportRow = ActivityPageRow & {
      joinedCount: number;
      participantsPreview: Array<{
        participantId: Id<"activityParticipant">;
        employeeId: Id<"employee">;
        name: string;
        image: string | null;
      }>;
    };

    const enrichedList: EnrichedActivityExportRow[] = [];

    while (true) {
      const enrichedRows = await Promise.all(
        pageResult.page.map(async (activity): Promise<EnrichedActivityExportRow> => {
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

      for (const row of enrichedRows) {
        if (
          !matchesParticipantsRange(
            row.joinedCount,
            minParticipants,
            maxParticipants,
          )
        ) {
          continue;
        }
        enrichedList.push(row);
        if (enrichedList.length > MAX_EXPORT_ROWS) {
          throw new CRPCError({
            code: "BAD_REQUEST",
            message: `พบข้อมูลมากเกิน ${MAX_EXPORT_ROWS} รายการ กรุณาใช้ตัวกรองให้แคบลง`,
          });
        }
      }

      if (pageResult.isDone || pageResult.continueCursor == null) {
        break;
      }
      pageResult = await baseQuery.paginate({
        cursor: pageResult.continueCursor,
        limit: EXPORT_ACTIVITY_PAGE_SIZE,
      });
    }

    return enrichedList;
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
      /** ไม่ระบุ = เข้าร่วมด้วยตนเอง (ใช้ employee ของผู้ใช้ปัจจุบัน) */
      employeeId: z.string().optional().nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const employeeId = (input.employeeId ?? ctx.user.employeeId) as Id<"employee">;

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

    const employee = await ctx.db.get(employeeId);
    if (!employee) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Employee not found",
      });
    }
    if (!isEmployeeEligibleForActivity(activity, employee)) {
      throw new CRPCError({
        code: "FORBIDDEN",
        message: "กิจกรรมนี้ไม่เปิดให้ BU/สังกัดของคุณเข้าร่วม",
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

    let participantId: Id<"activityParticipant">;

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "registered",
      });
      participantId = existing._id;
    } else {
      participantId = await ctx.db.insert("activityParticipant", {
        activityId,
        employeeId,
        status: "registered",
      });
    }

    await appendActivityLog(ctx, {
      actorEmployeeId: employeeId,
      type: "event_joined",
      sourceId: String(participantId),
      summary: `เข้าร่วมกิจกรรม: ${activity.name}`,
      meta: {
        activityId: String(activityId),
        participantId: String(participantId),
        employeeId: String(employeeId),
        activityName: activity.name,
      },
    });

    await awardJoinSpecialPoints(ctx, {
      employeeId,
      participantId,
      activityName: activity.name,
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
    if (participant.evidenceStorageId) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "แนบหลักฐานแล้ว ไม่สามารถเปลี่ยนไฟล์ได้",
      });
    }
    if (participant.status !== "registered") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "ไม่สามารถแนบหลักฐานในระยะนี้ได้",
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
      status: "attended",
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
      payoutBalanceType: z.enum(["giving", "receiving", "special"]).optional(),
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

export const reject = authMutation
  .input(
    z.object({
      activityId: z.string().min(1),
      participantId: z.string().min(1),
    }),
  )
  .output(
    z.object({
      rejected: z.boolean(),
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
    return await rejectActivityParticipant({
      ctx,
      activityId,
      participantId,
    });
  });

export const bulkReject = authMutation
  .input(
    z.object({
      activityId: z.string().min(1),
      participantIds: z.array(z.string().min(1)).min(1).max(100),
    }),
  )
  .output(
    z.object({
      rejected: z.number(),
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
    let rejected = 0;
    let skipped = 0;

    for (const participantId of participantIds) {
      const result = await rejectActivityParticipant({
        ctx,
        activityId,
        participantId,
      });
      if (result.rejected) {
        rejected += 1;
      } else {
        skipped += 1;
      }
    }

    return { rejected, skipped };
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