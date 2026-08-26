import type { Id } from "../functions/_generated/dataModel";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { DataModel } from "../functions/_generated/dataModel";
import { thaiMonthRange } from "./program-rules";

/** ปิดชั่วคราวได้ — ตั้ง true เพื่อเปิดลิมิตพอยต์/คนรับ/เดือน (ต่อผู้ให้คนเดิม) */
export const MONTHLY_TRANSFER_LIMIT_ENABLED = true;

/** คนรับคนเดิมได้ไม่เกิน N พอยต์ต่อเดือน จากผู้ให้คนเดียวกัน */
export const MONTHLY_TRANSFER_CAP_PER_RECEIVER = 5;

type DbCtx = Pick<
  GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  "db"
>;

export { thaiMonthRange };

export async function getMonthlyTransferUsed(input: {
  ctx: DbCtx;
  senderId: Id<"employee">;
  receiverId: Id<"employee">;
  nowMs?: number;
}): Promise<{
  used: number;
  remaining: number;
  cap: number;
  monthStart: number;
  monthEnd: number;
}> {
  const { start, end } = thaiMonthRange(input.nowMs);
  const rows = await input.ctx.db
    .query("transaction")
    .withIndex("by_senderId_receiverId", (q) =>
      q
        .eq("senderId", input.senderId)
        .eq("receiverId", input.receiverId)
        .gte("_creationTime", start)
        .lt("_creationTime", end),
    )
    .collect();

  const used = rows
    .filter((row) => row.status === "pending" || row.status === "completed")
    .reduce((sum, row) => sum + row.amount, 0);

  const cap = MONTHLY_TRANSFER_CAP_PER_RECEIVER;
  return {
    used,
    remaining: Math.max(0, cap - used),
    cap,
    monthStart: start,
    monthEnd: end,
  };
}
