import z from "zod/v4";

import { authMutation, authQuery, privateMutation } from "../lib/crpc";

import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { CRPCError } from "better-convex/server";

const BATCH_SIZE = 100;

export const monthlyReset = privateMutation
  .mutation(async ({ ctx }) => {
    await ctx.scheduler.runAfter(
      0,
      internal.wallet.resetGivingBudget,
      { cursor: null },
    )
  })

export const resetGivingBudget = privateMutation
  .input(
    z.object({
      cursor: z.string().nullable(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const wallets = await ctx.db
      .query("wallet")
      .paginate({
        cursor: input.cursor ?? null,
        numItems: BATCH_SIZE,
      })

      await Promise.all(
        wallets.page.map((wallet) =>
          ctx.db.patch(wallet._id, {
            givingBudget: 100,
            lastBudgetUpdate: Date.now(),
          })
        )
      );
  
      if (!wallets.isDone) {
        await ctx.scheduler.runAfter(
          0,
          internal.wallet.resetGivingBudget,
          { cursor: wallets.continueCursor },
        );
      }
  });

export const initial = privateMutation
  .input(
    z.object({
      employeeId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .query("wallet")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", input.employeeId as Id<"employee">))
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

export const getOne = authQuery
  .query(async ({ ctx }) => {
    const wallet = await ctx.db
      .query("wallet")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", ctx.user.employeeId as Id<"employee">))
      .first();

    if (!wallet) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Wallet not found",
      })
    }

    return {
      ...wallet,
      specialBudget: wallet.specialBudget ?? 0,
    };
  });

const THAI_OFFSET_MS = 7 * 60 * 60 * 1000;

const toThaiDateString = (ms: number) =>
  new Date(ms + THAI_OFFSET_MS).toISOString().slice(0, 10);

export const dailyLogin = authMutation
  .mutation(async ({ ctx }) => {
    const today = toThaiDateString(Date.now());

    const wallet = await ctx.db
      .query("wallet")
      .withIndex("by_employeeId", (q) =>
        q.eq("employeeId", ctx.user.employeeId as Id<"employee">)
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

    return { claimed: true, specialBudget: newBalance };
  })

export const dailyBonusHistory = authQuery
  .query(async ({ ctx }) => {
    const entries = await ctx.db
      .query("pointLedger")
      .withIndex("by_employeeId_sourceType", (q) =>
        q
          .eq("employeeId", ctx.user.employeeId as Id<"employee">)
          .eq("sourceType", "daily_login")
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