import type { Id } from "../functions/_generated/dataModel";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { DataModel } from "../functions/_generated/dataModel";
import { thaiDayRange } from "./program-rules";

/** ปิดชั่วคราวได้ — ตั้ง true เพื่อจำกัดส่งคำชมได้วันละครั้งต่อผู้ให้ */
export const DAILY_SEND_LIMIT_ENABLED = true;

/** ผู้ให้คนหนึ่งส่งได้กี่ครั้งต่อวัน (รวมทุกคนรับ) */
export const DAILY_SEND_CAP = 1;

type DbCtx = Pick<
  GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  "db"
>;

export async function getDailySendUsed(input: {
  ctx: DbCtx;
  senderId: Id<"employee">;
  nowMs?: number;
}): Promise<{
  used: number;
  remaining: number;
  cap: number;
  alreadySentToday: boolean;
  dayStart: number;
  dayEnd: number;
}> {
  const { start, end } = thaiDayRange(input.nowMs);
  const take = DAILY_SEND_CAP;

  const [completed, pending] = await Promise.all([
    input.ctx.db
      .query("transaction")
      .withIndex("by_senderId_status", (q) =>
        q
          .eq("senderId", input.senderId)
          .eq("status", "completed")
          .gte("_creationTime", start)
          .lt("_creationTime", end),
      )
      .take(take),
    input.ctx.db
      .query("transaction")
      .withIndex("by_senderId_status", (q) =>
        q
          .eq("senderId", input.senderId)
          .eq("status", "pending")
          .gte("_creationTime", start)
          .lt("_creationTime", end),
      )
      .take(take),
  ]);

  const used = completed.length + pending.length;
  const cap = DAILY_SEND_CAP;

  return {
    used,
    remaining: Math.max(0, cap - used),
    cap,
    alreadySentToday: used >= cap,
    dayStart: start,
    dayEnd: end,
  };
}
