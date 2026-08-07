import z from "zod/v4";

import { appendActivityLog } from "../lib/activity-log";
import { authMutation, authQuery, privateMutation } from "../lib/crpc";
import {
  thaiDateParts,
  thaiMonthKey,
} from "../lib/program-rules";

import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { CRPCError } from "better-convex/server";

const BATCH_SIZE = 100;

/**
 * รันทุกวันเวลา 00:00 ICT (cron hourUTC: 17 ของวันก่อน)
 * - วันที่ 1: รีเซ็ดงบมอบ (หรือรีเซ็ตทั้งปีถ้าเป็น ม.ค.)
 * - วันที่ 1 และ 16: สรุปการแลกรางวัลปักษ์ก่อนหน้า
 */
export const dailyProgramMaintenance = privateMutation.mutation(
  async ({ ctx }) => {
    const now = Date.now();
    const { month, day } = thaiDateParts(now);

    if (day === 1) {
      if (month === 0) {
        await ctx.scheduler.runAfter(0, internal.wallet.resetAll, {
          cursor: null,
        });
      } else {
        await ctx.scheduler.runAfter(0, internal.wallet.resetGivingBudget, {
          cursor: null,
        });
      }
    }

    if (day === 1 || day === 16) {
      await ctx.scheduler.runAfter(
        0,
        internal.redemption.summarizeFortnight,
        { cursor: null, periodKey: null, periodStart: null, periodEnd: null },
      );
    }
  },
);

/** @deprecated ใช้ dailyProgramMaintenance — คงไว้ให้เรียกมือได้ */
export const monthlyReset = privateMutation.mutation(async ({ ctx }) => {
  await ctx.scheduler.runAfter(0, internal.wallet.resetGivingBudget, {
    cursor: null,
  });
});

export const resetGivingBudget = privateMutation
  .input(
    z.object({
      cursor: z.string().nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const periodKey = thaiMonthKey();
    const now = Date.now();
    const wallets = await ctx.db.query("wallet").paginate({
      cursor: input.cursor ?? null,
      numItems: BATCH_SIZE,
    });

    for (const wallet of wallets.page) {
      const previousGiving = wallet.givingBudget;
      await ctx.db.patch(wallet._id, {
        givingBudget: 100,
        lastBudgetUpdate: now,
      });

      await ctx.db.insert("pointLedger", {
        employeeId: wallet.employeeId,
        delta: 100 - previousGiving,
        balanceAfter: 100,
        balanceType: "giving",
        sourceType: "monthly_reset",
        sourceId: `${wallet.employeeId}:${periodKey}`,
        note: `รีเซ็ดงบมอบคะแนนประจำเดือน ${periodKey}`,
        createdAt: now,
      });
    }

    if (!wallets.isDone) {
      await ctx.scheduler.runAfter(0, internal.wallet.resetGivingBudget, {
        cursor: wallets.continueCursor,
      });
    }
  });

export const resetAll = privateMutation
  .input(
    z.object({
      cursor: z.string().nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { year } = thaiDateParts();
    const periodKey = `year-${year}`;
    const now = Date.now();
    const wallets = await ctx.db.query("wallet").paginate({
      cursor: input.cursor ?? null,
      numItems: BATCH_SIZE,
    });

    for (const wallet of wallets.page) {
      const previousReceiving = wallet.receivingBudget;
      const previousSpecial = wallet.specialBudget ?? 0;
      const previousGiving = wallet.givingBudget;

      await ctx.db.patch(wallet._id, {
        givingBudget: 100,
        receivingBudget: 0,
        specialBudget: 0,
        lastBudgetUpdate: now,
      });

      await ctx.db.insert("pointLedger", {
        employeeId: wallet.employeeId,
        delta: 100 - previousGiving,
        balanceAfter: 100,
        balanceType: "giving",
        sourceType: "monthly_reset",
        sourceId: `${wallet.employeeId}:${periodKey}:giving`,
        note: `รีเซ็ดงบมอบคะแนนต้นปี ${year}`,
        createdAt: now,
      });

      if (previousReceiving !== 0) {
        await ctx.db.insert("pointLedger", {
          employeeId: wallet.employeeId,
          delta: -previousReceiving,
          balanceAfter: 0,
          balanceType: "receiving",
          sourceType: "monthly_reset",
          sourceId: `${wallet.employeeId}:${periodKey}:receiving`,
          note: `เคลียร์คะแนนสะสมต้นปี ${year}`,
          createdAt: now,
        });
      }

      if (previousSpecial !== 0) {
        await ctx.db.insert("pointLedger", {
          employeeId: wallet.employeeId,
          delta: -previousSpecial,
          balanceAfter: 0,
          balanceType: "special",
          sourceType: "monthly_reset",
          sourceId: `${wallet.employeeId}:${periodKey}:special`,
          note: `เคลียร์คะแนนพิเศษต้นปี ${year}`,
          createdAt: now,
        });
      }
    }

    if (!wallets.isDone) {
      await ctx.scheduler.runAfter(0, internal.wallet.resetAll, {
        cursor: wallets.continueCursor,
      });
    }
  });

export const initial = privateMutation
  .input(
    z.object({
      employeeId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .query("wallet")
      .withIndex("by_employeeId", (q) =>
        q.eq("employeeId", input.employeeId as Id<"employee">),
      )
      .first();

    if (existing) return;

    await ctx.db.insert("wallet", {
      employeeId: input.employeeId as Id<"employee">,
      givingBudget: 100,
      receivingBudget: 0,
      specialBudget: 0,
      lastBudgetUpdate: Date.now(),
    });
  });

export const getOne = authQuery.query(async ({ ctx }) => {
  const wallet = await ctx.db
    .query("wallet")
    .withIndex("by_employeeId", (q) =>
      q.eq("employeeId", ctx.user.employeeId as Id<"employee">),
    )
    .first();

  if (!wallet) {
    throw new CRPCError({
      code: "NOT_FOUND",
      message: "Wallet not found",
    });
  }

  return {
    ...wallet,
    specialBudget: wallet.specialBudget ?? 0,
  };
});

const THAI_OFFSET_MS = 7 * 60 * 60 * 1000;

const toThaiDateString = (ms: number) =>
  new Date(ms + THAI_OFFSET_MS).toISOString().slice(0, 10);

export const dailyLogin = authMutation.mutation(async ({ ctx }) => {
  const today = toThaiDateString(Date.now());

  const wallet = await ctx.db
    .query("wallet")
    .withIndex("by_employeeId", (q) =>
      q.eq("employeeId", ctx.user.employeeId as Id<"employee">),
    )
    .first();

  if (!wallet) {
    throw new CRPCError({
      code: "NOT_FOUND",
      message: "Wallet not found",
    });
  }

  if (wallet.lastDailyBonus && toThaiDateString(wallet.lastDailyBonus) === today) {
    return { claimed: false, specialBudget: wallet.specialBudget ?? 0 };
  }

  const newBalance = (wallet.specialBudget ?? 0) + 1;

  await ctx.db.patch(wallet._id, {
    specialBudget: newBalance,
    lastDailyBonus: Date.now(),
  });

  await ctx.db.insert("pointLedger", {
    employeeId: wallet.employeeId,
    delta: 1,
    balanceAfter: newBalance,
    balanceType: "special",
    sourceType: "daily_login",
    sourceId: today,
    note: "โบนัสเข้าสู่ระบบประจำวัน",
    createdAt: Date.now(),
  });

  await appendActivityLog(ctx, {
    actorEmployeeId: wallet.employeeId,
    type: "daily_login",
    sourceId: `${wallet.employeeId}:${today}`,
    summary: "รับโบนัสเข้าสู่ระบบประจำวัน",
    meta: {
      employeeId: String(wallet.employeeId),
      date: today,
      delta: 1,
    },
  });

  return { claimed: true, specialBudget: newBalance };
});

export const dailyBonusHistory = authQuery.query(async ({ ctx }) => {
  const entries = await ctx.db
    .query("pointLedger")
    .withIndex("by_employeeId_sourceType", (q) =>
      q
        .eq("employeeId", ctx.user.employeeId as Id<"employee">)
        .eq("sourceType", "daily_login"),
    )
    .order("desc")
    .take(10);

  return entries.map((entry) => ({
    id: entry._id,
    delta: entry.delta,
    note: entry.note,
    createdAt: entry.createdAt ?? entry._creationTime,
  }));
});
