import type { Id } from "../functions/_generated/dataModel";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { DataModel } from "../functions/_generated/dataModel";

/** ปิดชั่วคราวได้ — ตั้ง true เพื่อเปิดลิมิต 20 พอยต์/คน/เดือนอีกครั้ง */
export const MONTHLY_TRANSFER_LIMIT_ENABLED = false;

export const MONTHLY_TRANSFER_CAP_PER_RECEIVER = 20;

const THAI_OFFSET_MS = 7 * 60 * 60 * 1000;

type DbCtx = Pick<
  GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  "db"
>;

/** ขอบเดือนตามปฏิทิน Asia/Bangkok — end เป็น exclusive */
export function thaiMonthRange(nowMs = Date.now()): {
  start: number;
  end: number;
} {
  const thai = new Date(nowMs + THAI_OFFSET_MS);
  const y = thai.getUTCFullYear();
  const m = thai.getUTCMonth();
  const start = Date.UTC(y, m, 1) - THAI_OFFSET_MS;
  const end = Date.UTC(y, m + 1, 1) - THAI_OFFSET_MS;
  return { start, end };
}

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
