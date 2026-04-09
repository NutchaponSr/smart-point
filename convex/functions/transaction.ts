import z from "zod/v4";

import { CRPCError } from "better-convex/server";

import { authMutation, authQuery } from "../lib/crpc";

import { Id } from "./_generated/dataModel";

export const getHistory = authQuery
  .input(
    z.object({
      query: z.string().optional(),
      status: z.array(z.enum(["pending", "completed", "rejected", "approved"])).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      from: z.number().optional(),
      to: z.number().optional(),
      cursor: z.number().nullish(),
      limit: z.number()
    })
  )
  .query(async ({ ctx, input }) => {
    const [sent, received] = await Promise.all([
      ctx.db
        .query("transaction")
        .withIndex("by_senderId", (q) =>
          q.eq("senderId", ctx.user.employeeId)
        )
        .order("desc")
        .collect(),
      ctx.db
        .query("transaction")
        .withIndex("by_receiverId", (q) =>
          q.eq("receiverId", ctx.user.employeeId)
        )
        .order("desc")
        .collect(),
    ]);

    const merged = [
      ...sent,
      ...received,
    ].sort((a, b) => b._creationTime - a._creationTime);

    const filtered = merged.filter((t) => {
      if (input.query && !t.message?.toLowerCase().includes(input.query.toLowerCase())) return false;
      if (input.status && input.status.length > 0 && !input.status.includes(t.status)) return false;
      if (input.min !== undefined && input.min > 0 && t.amount < input.min) return false;
      if (input.max !== undefined && input.max > 0 && t.amount > input.max) return false;
      if (input.from !== undefined && t._creationTime < input.from) return false;
      if (input.to !== undefined && t._creationTime > input.to) return false;
      return true;
    });

    const offset = input.cursor ?? 0;
    const page = filtered.slice(offset, offset + input.limit);
    const enriched = await Promise.all(
      page.map(async (t) => {
        const [senderEmployee, receiverEmployee] = await Promise.all([
          ctx.db.get(t.senderId),
          ctx.db.get(t.receiverId),
        ]);

        const [senderUser, receiverUser] = await Promise.all([
          senderEmployee
            ? ctx.db
              .query("user")
              .withIndex("by_employeeId", (q) =>
                q.eq("employeeId", senderEmployee._id)
              )
              .first()
            : null,
          receiverEmployee
            ? ctx.db
              .query("user")
              .withIndex("by_employeeId", (q) =>
                q.eq("employeeId", receiverEmployee._id)
              )
              .first()
            : null,
        ]);

        return {
          ...t,
          sender: senderEmployee
            ? {
              name: senderEmployee.name,
              department: senderEmployee.department,
              image: senderUser?.image ?? null,
            }
            : null,
          receiver: receiverEmployee
            ? {
              name: receiverEmployee.name,
              department: receiverEmployee.department,
              image: receiverUser?.image ?? null,
            }
            : null,
        };
      })
    );

    return {
      items: {
        sent: enriched.filter((t) => t.senderId === ctx.user.employeeId),
        received: enriched.filter((t) => t.receiverId === ctx.user.employeeId),
      },
      total: filtered.length,
      nextCursor:
        offset + input.limit < filtered.length
          ? offset + input.limit
          : undefined,
    };
  });

export const send = authMutation
  .input(
    z.object({
      receiverId: z.string(),
      amount: z.number(),
      message: z.string(),
      tags: z.array(z.string()),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const [sender, receiver] = await Promise.all([
      ctx.db
        .query("employee")
        .withIndex("by_employeeId", (q) =>
          q.eq("employeeId", ctx.user.username)
        )
        .first(),
      ctx.db
        .query("employee")
        .withIndex("by_employeeId", (q) =>
          q.eq("employeeId", input.receiverId)
        )
        .first(),
    ]);

    if (!sender || !receiver) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Sender or receiver not found",
      });
    }

    if (sender.employeeId === receiver.employeeId) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "You cannot send money to yourself",
      });
    }

    const wallet = await ctx.db
      .query("wallet")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", sender._id))
      .first();

    if (!wallet) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Wallet not found",
      });
    }

    if (wallet.givingBudget < input.amount) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Insufficient giving budget",
      });
    }

    await ctx.db.patch(wallet._id, {
      givingBudget: wallet.givingBudget - input.amount,
    });

    const transactionId = await ctx.db.insert("transaction", {
      senderId: sender._id,
      receiverId: receiver._id,
      amount: input.amount,
      message: input.message,
      tags: input.tags,
      status: "pending",
      reviewedBy: ctx.user.employeeId,
      reviewedAt: Date.now(),
    });

    await ctx.db.insert("pointLedger", {
      employeeId: sender._id,
      delta: -input.amount,
      balanceAfter: wallet.givingBudget - input.amount,
      balanceType: "giving",
      sourceType: "transaction",
      sourceId: transactionId,
      note: `Sent to ${receiver.name}`,
      createdAt: Date.now(),
    });

    return transactionId;
  });

export const approve = authMutation
  .input(
    z.object({
      transactionId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const transaction = await ctx.db.get(input.transactionId as Id<"transaction">);

    if (!transaction) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "pending") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Transaction is not pending",
      });
    }

    const receiverWallet = await ctx.db
      .query("wallet")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", transaction.receiverId))
      .first();

    if (!receiverWallet) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Wallet not found",
      });
    }

    await ctx.db.patch(receiverWallet._id, {
      receivingBudget: receiverWallet.receivingBudget + transaction.amount,
    });

    await ctx.db.insert("pointLedger", {
      employeeId: transaction.receiverId,
      delta: transaction.amount,
      balanceAfter: receiverWallet.receivingBudget + transaction.amount,
      balanceType: "receiving",
      sourceType: "transaction",
      sourceId: transaction._id,
      note: `Received from ${transaction.senderId}`,
      createdAt: Date.now(),
    });

    await ctx.db.patch(transaction._id, {
      status: "completed",
      reviewedAt: Date.now(),
      reviewedBy: ctx.user.employeeId,
      updatedAt: Date.now(),
    });
  })