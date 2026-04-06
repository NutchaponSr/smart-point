import z from "zod/v4";

import { authQuery, privateMutation, publicQuery } from "../lib/crpc";

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

    return wallet;
  });