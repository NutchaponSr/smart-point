import type { GenericMutationCtx } from "convex/server";

import type { DataModel, Id } from "../functions/_generated/dataModel";

export type ActivityLogType =
  | "point_transfer_sent"
  | "point_transfer_approved"
  | "point_transfer_rejected"
  | "daily_login"
  | "event_joined"
  | "event_completed"
  | "event_rejected";

type ActivityLogMutationCtx = Pick<GenericMutationCtx<DataModel>, "db">;

export async function appendActivityLog(
  ctx: ActivityLogMutationCtx,
  input: {
    actorEmployeeId: Id<"employee">;
    subjectEmployeeId?: Id<"employee"> | null;
    type: ActivityLogType;
    sourceId: string;
    summary: string;
    meta?: Record<string, string | number | boolean | null> | null;
  },
): Promise<{ written: boolean }> {
  const existing = await ctx.db
    .query("activityLog")
    .withIndex("by_type_sourceId", (q) =>
      q.eq("type", input.type).eq("sourceId", input.sourceId),
    )
    .first();

  if (existing) {
    return { written: false };
  }

  await ctx.db.insert("activityLog", {
    actorEmployeeId: input.actorEmployeeId,
    subjectEmployeeId: input.subjectEmployeeId ?? null,
    type: input.type,
    sourceId: input.sourceId,
    summary: input.summary,
    meta: input.meta ? JSON.stringify(input.meta) : null,
  });

  return { written: true };
}
