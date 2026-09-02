import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { appendActivityLog } from "../lib/activity-log";
import { authMutation, authQuery } from "../lib/crpc";
import { syncLeaderboardEntry } from "../lib/leaderboard-entry";
import { localizedLabel } from "../lib/localized";
import { UNLIMITED_POINT_SEND_EMPLOYEE_ID } from "../lib/point-send-privileges";
import { getWalletOrThrow, splitRedeemCost } from "../lib/points";
import { assertRedemptionOpen, GIVING_BUDGET } from "../lib/program-rules";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./generated/server";

async function resolveAdmin1EmployeeId(
  ctx: MutationCtx | QueryCtx,
): Promise<Id<"employee"> | null> {
  const admin = await ctx.db
    .query("employee")
    .withIndex("by_employeeId", (q) =>
      q.eq("employeeId", UNLIMITED_POINT_SEND_EMPLOYEE_ID),
    )
    .first();

  return admin?._id ?? null;
}

/** ยอดบริจาครวมทั้งหมด (พอยต์ = บาท) */
export const getTotals = authQuery.query(async ({ ctx }) => {
  const recipientEmployeeId = await resolveAdmin1EmployeeId(ctx);

  if (!recipientEmployeeId) {
    return { totalPoints: 0, totalBaht: 0 };
  }

  // eslint-disable-next-line @convex-dev/no-query-collect -- sum total donations to Admin1
  const rows = await ctx.db
    .query("donation")
    .withIndex("by_recipientEmployeeId", (q) =>
      q.eq("recipientEmployeeId", recipientEmployeeId),
    )
    .collect();

  const totalPoints = rows.reduce((sum, row) => sum + row.points, 0);

  return {
    totalPoints,
    totalBaht: totalPoints,
  };
});

/** บริจาคพอยต์แลกได้ → Admin1 (1 พอยต์ = 1 บาท) */
export const donate = authMutation
  .input(
    z.object({
      points: z.number().int().min(1),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    assertRedemptionOpen();

    const donorEmployeeId = ctx.user.employeeId as Id<"employee">;
    const recipientEmployeeId = await resolveAdmin1EmployeeId(ctx);

    if (!recipientEmployeeId) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Donation recipient (Admin1) not found",
      });
    }

    if (donorEmployeeId === recipientEmployeeId) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Cannot donate to yourself",
      });
    }

    const [donorWallet, recipientWalletRaw, recipient] = await Promise.all([
      getWalletOrThrow(ctx, donorEmployeeId),
      ctx.db
        .query("wallet")
        .withIndex("by_employeeId", (q) =>
          q.eq("employeeId", recipientEmployeeId),
        )
        .first(),
      ctx.db.get(recipientEmployeeId),
    ]);

    let recipientWallet = recipientWalletRaw;
    if (!recipientWallet) {
      const walletId = await ctx.db.insert("wallet", {
        employeeId: recipientEmployeeId,
        givingBudget: GIVING_BUDGET,
        receivingBudget: 0,
        specialBudget: 0,
        lastBudgetUpdate: Date.now(),
      });
      recipientWallet = await ctx.db.get(walletId);
      if (!recipientWallet) {
        throw new CRPCError({
          code: "NOT_FOUND",
          message: "Wallet not found",
        });
      }
    }

    const split = splitRedeemCost(
      donorWallet.receivingBudget,
      donorWallet.specialBudget ?? 0,
      input.points,
    );

    if (!split.ok) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Insufficient points",
      });
    }

    const bahtAmount = input.points;
    const now = Date.now();

    const donationId = await ctx.db.insert("donation", {
      donorEmployeeId,
      recipientEmployeeId,
      points: input.points,
      bahtAmount,
      status: "completed",
      createdAt: now,
    });

    await ctx.db.patch(donorWallet._id, {
      receivingBudget: split.newReceiving,
      specialBudget: split.newSpecial,
    });
    await syncLeaderboardEntry(ctx, donorEmployeeId);

    const newRecipientReceiving =
      recipientWallet.receivingBudget + input.points;
    await ctx.db.patch(recipientWallet._id, {
      receivingBudget: newRecipientReceiving,
    });
    await syncLeaderboardEntry(ctx, recipientEmployeeId);

    const sourceId = String(donationId);

    if (split.fromReceiving > 0) {
      await ctx.db.insert("pointLedger", {
        employeeId: donorEmployeeId,
        delta: -split.fromReceiving,
        balanceAfter: split.newReceiving,
        balanceType: "receiving",
        sourceType: "donation",
        sourceId,
        note: "Donation (receiving)",
        createdAt: now,
      });
    }

    if (split.fromSpecial > 0) {
      await ctx.db.insert("pointLedger", {
        employeeId: donorEmployeeId,
        delta: -split.fromSpecial,
        balanceAfter: split.newSpecial,
        balanceType: "special",
        sourceType: "donation",
        sourceId,
        note: "Donation (special)",
        createdAt: now,
      });
    }

    await ctx.db.insert("pointLedger", {
      employeeId: recipientEmployeeId,
      delta: input.points,
      balanceAfter: newRecipientReceiving,
      balanceType: "receiving",
      sourceType: "donation",
      sourceId,
      note: "Donation received",
      createdAt: now,
    });

    const recipientName = recipient
      ? localizedLabel(recipient.name, "th")
      : "Admin1";

    await appendActivityLog(ctx, {
      actorEmployeeId: donorEmployeeId,
      subjectEmployeeId: recipientEmployeeId,
      type: "donation",
      sourceId,
      summary: `บริจาค ${input.points} พอยต์ (${bahtAmount} บาท) ให้ ${recipientName}`,
      meta: {
        amount: input.points,
        bahtAmount,
        donationId: sourceId,
        recipientEmployeeId: String(recipientEmployeeId),
      },
    });

    return {
      donationId,
      points: input.points,
      bahtAmount,
      fromReceiving: split.fromReceiving,
      fromSpecial: split.fromSpecial,
    };
  });
