import z from "zod/v4";

import { authQuery } from "../lib/crpc";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./generated/server";

type ActivityLogType = Doc<"activityLog">["type"];

type ActivityLogRef = {
  label: string;
  id: string;
};

function metaString(
  meta: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = meta?.[key];
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") return String(value);
  return null;
}

function metaNumber(
  meta: Record<string, unknown> | null,
  key: string,
): number | null {
  const value = meta?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** แสดง id เฉพาะธุรกรรม — ไม่โชว์สำหรับ event / daily login */
function buildRefs(
  type: ActivityLogType,
  sourceId: string,
  meta: Record<string, unknown> | null,
): ActivityLogRef[] {
  switch (type) {
    case "point_transfer_sent":
    case "point_transfer_approved":
    case "point_transfer_rejected":
      return [
        {
          label: "ธุรกรรม",
          id: metaString(meta, "transactionId") ?? sourceId,
        },
      ];
    default:
      return [];
  }
}

async function resolveSummaryForViewer(input: {
  row: Doc<"activityLog">;
  viewerId: Id<"employee">;
  actorName: string | null;
  meta: Record<string, unknown> | null;
}): Promise<string> {
  const { row, viewerId, actorName, meta } = input;
  const amount = metaNumber(meta, "amount");

  if (
    row.type === "point_transfer_sent" &&
    row.subjectEmployeeId === viewerId &&
    row.actorEmployeeId !== viewerId
  ) {
    const points = amount != null ? `${amount} พอยต์` : "พอยต์";
    return actorName
      ? `ได้รับ ${points} จาก ${actorName}`
      : `ได้รับ ${points}`;
  }

  return row.summary;
}

async function enrichActivityLog(
  ctx: QueryCtx,
  row: Doc<"activityLog">,
  viewerId: Id<"employee">,
) {
  const [actor, subject] = await Promise.all([
    ctx.db.get(row.actorEmployeeId),
    row.subjectEmployeeId
      ? ctx.db.get(row.subjectEmployeeId)
      : Promise.resolve(null),
  ]);

  let meta: Record<string, unknown> | null = null;
  if (row.meta) {
    try {
      meta = JSON.parse(row.meta) as Record<string, unknown>;
    } catch {
      meta = null;
    }
  }

  const summary = await resolveSummaryForViewer({
    row,
    viewerId,
    actorName: actor?.name ?? null,
    meta,
  });

  return {
    _id: row._id,
    type: row.type,
    summary,
    sourceId: row.sourceId,
    refs: buildRefs(row.type, row.sourceId, meta),
    meta,
    createdAt: row._creationTime,
    actor: actor
      ? {
          _id: actor._id as Id<"employee">,
          name: actor.name,
          employeeId: actor.employeeId,
        }
      : null,
    subject: subject
      ? {
          _id: subject._id as Id<"employee">,
          name: subject.name,
          employeeId: subject.employeeId,
        }
      : null,
  };
}

/** ผู้รับไม่ต้องเห็น log "โอนให้..." — รอจนอนุมัติแล้วค่อยเห็น "ได้รับจาก..." */
function isRelevantForViewer(
  row: Doc<"activityLog">,
  viewerId: Id<"employee">,
): boolean {
  if (
    row.type === "point_transfer_sent" &&
    row.actorEmployeeId !== viewerId &&
    row.subjectEmployeeId === viewerId
  ) {
    return false;
  }
  return true;
}

export const getLatest = authQuery
  .input(
    z.object({
      limit: z.number().int().min(1).max(20).default(5),
    }),
  )
  .query(async ({ ctx, input }) => {
    const myEmployeeId = ctx.user.employeeId as Id<"employee">;
    const fetchLimit = Math.min(input.limit * 2, 40);

    const [asActor, asSubject] = await Promise.all([
      ctx.db
        .query("activityLog")
        .withIndex("by_actor", (q) => q.eq("actorEmployeeId", myEmployeeId))
        .order("desc")
        .take(fetchLimit),
      ctx.db
        .query("activityLog")
        .withIndex("by_subject", (q) =>
          q.eq("subjectEmployeeId", myEmployeeId),
        )
        .order("desc")
        .take(fetchLimit),
    ]);

    const byId = new Map<string, Doc<"activityLog">>();
    for (const row of [...asActor, ...asSubject]) {
      if (!isRelevantForViewer(row, myEmployeeId)) continue;
      byId.set(row._id, row);
    }

    const rows = Array.from(byId.values())
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, input.limit);

    return await Promise.all(
      rows.map((row) => enrichActivityLog(ctx, row, myEmployeeId)),
    );
  });
