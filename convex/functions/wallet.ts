import { CRPCError } from "better-convex/server";
import z from "zod/v4";
import { appendActivityLog } from "../lib/activity-log";
import {
  FIRST_LOGIN_POINTS,
  LOGIN_STREAK_DAYS,
  LOGIN_STREAK_POINTS,
  MONTHLY_ACTIVE_POINTS,
  nextLoginStreak,
  nextPraiseStreakMonths,
  PRAISE_STREAK_POINTS,
  shouldAwardLoginStreak,
  shouldAwardPraiseStreak,
} from "../lib/bonuses";
import { authMutation, authQuery, privateMutation } from "../lib/crpc";
import { canSendUnlimitedPoints } from "../lib/point-send-privileges";
import { awardSpecialPoints } from "../lib/points";
import {
  GIVING_BUDGET,
  previousThaiMonthKey,
  thaiDateParts,
  thaiMonthKey,
} from "../lib/program-rules";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const BATCH_SIZE = 100;

/**
 * รันทุกวันเวลา 00:00 ICT (cron hourUTC: 17 ของวันก่อน)
 * - วันที่ 1: รีเซ็ดงบมอบ (หรือรีเซ็ตทั้งปีถ้าเป็น ม.ค.) + โบนัสโควต้าหมด
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
      await ctx.scheduler.runAfter(0, internal.redemption.summarizeFortnight, {
        cursor: null,
        periodKey: null,
        periodStart: null,
        periodEnd: null,
      });
    }
  },
);

/** @deprecated ใช้ dailyProgramMaintenance — คงไว้ให้เรียกมือได้ */
export const monthlyReset = privateMutation.mutation(async ({ ctx }) => {
  await ctx.scheduler.runAfter(0, internal.wallet.resetGivingBudget, {
    cursor: null,
  });
});

async function rolloverWallet(
  ctx: MutationCtx,
  wallet: Doc<"wallet">,
  input: {
    yearReset: boolean;
    closedMonthKey: string;
    resetPeriodKey: string;
    now: number;
    year: number;
  },
) {
  const employee = await ctx.db.get(wallet.employeeId);
  const unlimited = employee
    ? canSendUnlimitedPoints(employee.employeeId)
    : false;
  const filled = !unlimited && wallet.givingBudget === 0;
  const praiseStreakMonths = nextPraiseStreakMonths(
    filled,
    wallet.praiseStreakMonths,
  );

  const previousGiving = wallet.givingBudget;
  const previousReceiving = wallet.receivingBudget;
  const previousSpecial = wallet.specialBudget ?? 0;

  if (input.yearReset) {
    await ctx.db.patch(wallet._id, {
      givingBudget: GIVING_BUDGET,
      receivingBudget: 0,
      specialBudget: 0,
      lastBudgetUpdate: input.now,
      praiseStreakMonths,
      loginStreak: 0,
      // keep lastDailyBonus — first_login is gated by pointLedger, not null check
    });

    await ctx.db.insert("pointLedger", {
      employeeId: wallet.employeeId,
      delta: GIVING_BUDGET - previousGiving,
      balanceAfter: GIVING_BUDGET,
      balanceType: "giving",
      sourceType: "monthly_reset",
      sourceId: `${wallet.employeeId}:${input.resetPeriodKey}:giving`,
      note: `รีเซ็ดงบมอบคะแนนต้นปี ${input.year}`,
      createdAt: input.now,
    });

    if (previousReceiving !== 0) {
      await ctx.db.insert("pointLedger", {
        employeeId: wallet.employeeId,
        delta: -previousReceiving,
        balanceAfter: 0,
        balanceType: "receiving",
        sourceType: "monthly_reset",
        sourceId: `${wallet.employeeId}:${input.resetPeriodKey}:receiving`,
        note: `เคลียร์คะแนนสะสมต้นปี ${input.year}`,
        createdAt: input.now,
      });
    }

    if (previousSpecial !== 0) {
      await ctx.db.insert("pointLedger", {
        employeeId: wallet.employeeId,
        delta: -previousSpecial,
        balanceAfter: 0,
        balanceType: "special",
        sourceType: "monthly_reset",
        sourceId: `${wallet.employeeId}:${input.resetPeriodKey}:special`,
        note: `เคลียร์คะแนนพิเศษต้นปี ${input.year}`,
        createdAt: input.now,
      });
    }
  } else {
    await ctx.db.patch(wallet._id, {
      givingBudget: GIVING_BUDGET,
      lastBudgetUpdate: input.now,
      praiseStreakMonths,
      loginStreak: 0,
      // keep lastDailyBonus — clearing it falsely re-triggers isFirstLogin
    });

    await ctx.db.insert("pointLedger", {
      employeeId: wallet.employeeId,
      delta: GIVING_BUDGET - previousGiving,
      balanceAfter: GIVING_BUDGET,
      balanceType: "giving",
      sourceType: "monthly_reset",
      sourceId: `${wallet.employeeId}:${input.resetPeriodKey}`,
      note: `รีเซ็ดงบมอบคะแนนประจำเดือน ${input.resetPeriodKey}`,
      createdAt: input.now,
    });
  }

  if (!filled) return;

  const monthlyAward = await awardSpecialPoints(ctx, {
    employeeId: wallet.employeeId,
    delta: MONTHLY_ACTIVE_POINTS,
    sourceType: "monthly_active",
    sourceId: `${wallet.employeeId}:${input.closedMonthKey}:monthly_active`,
    note: `โบนัสใช้โควต้าส่งคำชมครบเดือน ${input.closedMonthKey}`,
  });

  if (monthlyAward.awarded) {
    await appendActivityLog(ctx, {
      actorEmployeeId: wallet.employeeId,
      type: "monthly_active",
      sourceId: `${wallet.employeeId}:${input.closedMonthKey}:monthly_active`,
      summary: `ได้รับโบนัสใช้โควต้าส่งคำชมครบ ${MONTHLY_ACTIVE_POINTS} Special Points`,
      meta: {
        employeeId: String(wallet.employeeId),
        month: input.closedMonthKey,
        amount: MONTHLY_ACTIVE_POINTS,
      },
    });
  }

  if (!shouldAwardPraiseStreak(praiseStreakMonths)) return;

  const streakAward = await awardSpecialPoints(ctx, {
    employeeId: wallet.employeeId,
    delta: PRAISE_STREAK_POINTS,
    sourceType: "praise_streak",
    sourceId: `${wallet.employeeId}:${input.closedMonthKey}:praise_streak`,
    note: `โบนัสส่งคำชมครบโควต้าติดกัน ${praiseStreakMonths} เดือน`,
  });

  if (streakAward.awarded) {
    await appendActivityLog(ctx, {
      actorEmployeeId: wallet.employeeId,
      type: "praise_streak",
      sourceId: `${wallet.employeeId}:${input.closedMonthKey}:praise_streak`,
      summary: `ได้รับโบนัสส่งคำชมต่อเนื่อง ${PRAISE_STREAK_POINTS} Special Points`,
      meta: {
        employeeId: String(wallet.employeeId),
        month: input.closedMonthKey,
        months: praiseStreakMonths,
        amount: PRAISE_STREAK_POINTS,
      },
    });
  }
}

export const resetGivingBudget = privateMutation
  .input(
    z.object({
      cursor: z.string().nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const now = Date.now();
    const { year } = thaiDateParts(now);
    const wallets = await ctx.db.query("wallet").paginate({
      cursor: input.cursor ?? null,
      numItems: BATCH_SIZE,
    });

    for (const wallet of wallets.page) {
      await rolloverWallet(ctx, wallet, {
        yearReset: false,
        closedMonthKey: previousThaiMonthKey(now),
        resetPeriodKey: thaiMonthKey(now),
        now,
        year,
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
    const now = Date.now();
    const { year } = thaiDateParts(now);
    const wallets = await ctx.db.query("wallet").paginate({
      cursor: input.cursor ?? null,
      numItems: BATCH_SIZE,
    });

    for (const wallet of wallets.page) {
      await rolloverWallet(ctx, wallet, {
        yearReset: true,
        closedMonthKey: previousThaiMonthKey(now),
        resetPeriodKey: `year-${year}`,
        now,
        year,
      });
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
      givingBudget: GIVING_BUDGET,
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
    loginStreak: wallet.loginStreak ?? 0,
    praiseStreakMonths: wallet.praiseStreakMonths ?? 0,
  };
});

export const dailyLogin = authMutation.mutation(async ({ ctx }) => {
  const now = Date.now();
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

  const checkin = nextLoginStreak({
    lastDailyBonus: wallet.lastDailyBonus,
    currentStreak: wallet.loginStreak,
    nowMs: now,
  });

  if (checkin.alreadyCheckedIn) {
    return {
      checkedIn: false,
      firstLoginAwarded: false,
      loginStreakAwarded: false,
      loginStreak: checkin.loginStreak,
      specialBudget: wallet.specialBudget ?? 0,
    };
  }

  await ctx.db.patch(wallet._id, {
    lastDailyBonus: now,
    loginStreak: checkin.loginStreak,
  });

  let firstLoginAwarded = false;
  let loginStreakAwarded = false;
  let specialBudget = wallet.specialBudget ?? 0;

  // Idempotent via pointLedger sourceId — do not gate on lastDailyBonus
  // (monthly reset used to clear it and look like a false "first login").
  {
    const award = await awardSpecialPoints(ctx, {
      employeeId: wallet.employeeId,
      delta: FIRST_LOGIN_POINTS,
      sourceType: "first_login",
      sourceId: `${wallet.employeeId}:first_login`,
      note: "ขวัญถุงแรกเข้า",
    });
    firstLoginAwarded = award.awarded;
    specialBudget = award.newBalance;

    if (award.awarded) {
      await appendActivityLog(ctx, {
        actorEmployeeId: wallet.employeeId,
        type: "first_login",
        sourceId: `${wallet.employeeId}:first_login`,
        summary: `ได้รับขวัญถุงแรกเข้า ${FIRST_LOGIN_POINTS} Special Points`,
        meta: {
          employeeId: String(wallet.employeeId),
          date: checkin.today,
          amount: FIRST_LOGIN_POINTS,
        },
      });
    }
  }

  if (shouldAwardLoginStreak(checkin.loginStreak)) {
    const award = await awardSpecialPoints(ctx, {
      employeeId: wallet.employeeId,
      delta: LOGIN_STREAK_POINTS,
      sourceType: "login_streak",
      sourceId: `${wallet.employeeId}:${checkin.today}:login_streak`,
      note: `โบนัสเข้าสู่ระบบติดต่อกัน ${LOGIN_STREAK_DAYS} วัน`,
    });
    loginStreakAwarded = award.awarded;
    specialBudget = award.newBalance;

    if (award.awarded) {
      await appendActivityLog(ctx, {
        actorEmployeeId: wallet.employeeId,
        type: "login_streak",
        sourceId: `${wallet.employeeId}:${checkin.today}:login_streak`,
        summary: `ได้รับโบนัสเข้าสู่ระบบติดต่อกัน ${LOGIN_STREAK_POINTS} Special Points`,
        meta: {
          employeeId: String(wallet.employeeId),
          date: checkin.today,
          streak: checkin.loginStreak,
          amount: LOGIN_STREAK_POINTS,
        },
      });
    }
  }

  return {
    checkedIn: true,
    firstLoginAwarded,
    loginStreakAwarded,
    loginStreak: checkin.loginStreak,
    specialBudget,
  };
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
