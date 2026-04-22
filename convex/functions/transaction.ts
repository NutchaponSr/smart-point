import z from "zod/v4";

import { CRPCError } from "better-convex/server";

import { authMutation, authQuery } from "../lib/crpc";

import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

function transactionTimestamp(t: Doc<"transaction">) {
  return t.createdAt ?? t._creationTime;
}

function filterTransaction(
  t: Doc<"transaction">,
  input: {
    query?: string;
    status?: Array<"pending" | "completed" | "rejected" | "approved"> | null;
    min: number | null;
    max: number | null;
    from?: number | null;
    to?: number | null;
  }
) {
  const ts = transactionTimestamp(t);
  if (input.from != null && ts < input.from) return false;
  if (input.to != null && ts > input.to) return false;
  if (input.query && !t.message?.toLowerCase().includes(input.query.toLowerCase())) return false;
  if (input.status?.length && !input.status.includes(t.status)) return false;
  if (input.min != null && input.min > 0 && t.amount < input.min) return false;
  if (input.max != null && input.max > 0 && t.amount > input.max) return false;
  return true;
};

async function enrichTransaction(
  ctx: QueryCtx,
  t: Doc<"transaction">
) {
  const [senderEmployee, receiverEmployee] = await Promise.all([
    ctx.db.get(t.senderId),
    ctx.db.get(t.receiverId),
  ]);

  const [senderUser, receiverUser] = await Promise.all([
    senderEmployee
      ? ctx.db.query("user").withIndex("by_employeeId", (q) => q.eq("employeeId", senderEmployee._id)).first()
      : null,
    receiverEmployee
      ? ctx.db.query("user").withIndex("by_employeeId", (q) => q.eq("employeeId", receiverEmployee._id)).first()
      : null,
  ]);

  const toParty = (employee: typeof senderEmployee, user: typeof senderUser) =>
    employee ? { name: employee.name, department: employee.department, image: user?.image ?? null } : null;

  return {
    ...t,
    sender: toParty(senderEmployee, senderUser),
    receiver: toParty(receiverEmployee, receiverUser),
  };
};

export const getHistory = authQuery
  .input(
    z.object({
      query: z.string().optional(),
      status: z.array(z.enum(["pending", "completed", "rejected", "approved"])).optional().nullable(),
      min: z.number().nullable(),
      max: z.number().nullable(),
      from: z.number().nullable().optional(),
      to: z.number().nullable().optional(),
      cursor: z.number().nullable(),
      limit: z.number(),
      view: z.enum(["sent", "received"]),
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

    const source = input.view === "sent" ? sent : received;

    const filtered = source.filter((t) => filterTransaction(t, input));

    const offset = input.cursor ?? 0;
    const page = filtered.slice(offset, offset + input.limit);

    const items = await Promise.all(page.map((t) => enrichTransaction(ctx, t)));

    return {
      items,
      total: filtered.length,
      nextCursor: offset + input.limit < filtered.length ? offset + input.limit : undefined,
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
  });

export const feeds = authQuery
  .paginated({
    limit: 10,
    item: z.object({
      _id: z.custom<Id<"transaction">>(),
      _creationTime: z.number(),
      amount: z.number(),
      createdAt: z.number(),
      message: z.string(),
      tags: z.array(z.string().nullish()),
      status: z.enum(["pending", "approved", "rejected", "completed"]),
      rejectionReason: z.string().nullable(),
      reviewedAt: z.number(),
      reviewedBy: z.string(),
      senderId: z.custom<Id<"employee">>(),
      receiverId: z.custom<Id<"employee">>(),
      updatedAt: z.number().nullable(),
      sender: z.object({
        _id: z.custom<Id<"employee">>(),
        name: z.string(),
        department: z.string(),
        position: z.string(),
        rank: z.string(),
        division: z.string(),
        image: z.string().nullable(),
      }),
      receiver: z.object({
        _id: z.custom<Id<"employee">>(),
        name: z.string(),
        department: z.string(),
        position: z.string(),
        rank: z.string(),
        division: z.string(),
        image: z.string().nullable(),
      }),
      likes: z.object({
        count: z.number(),
        likedByCurrentUser: z.boolean(),
      }),
      comments: z.array(z.object({
        _id: z.custom<Id<"comment">>(),
        content: z.string(),
        createdAt: z.number(),
        updatedAt: z.number().nullable(),
        author: z.object({
          _id: z.custom<Id<"employee">>(),
          name: z.string(),
          department: z.string(),
          position: z.string(),
          rank: z.string(),
          division: z.string(),
          image: z.string().nullable(),
        }),
      })),
    })
  })
  .query(async ({ ctx, input }) => {
    const result = await ctx.db
      .query("transaction")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .paginate({
        numItems: input.limit,
        cursor: input.cursor ?? null,
      });

    const txMeta = await Promise.all(
      result.page.map(async (tx) => {
        const [likes, comments, likedByCurrentUser] = await Promise.all([
          ctx.db
            .query("like")
            .withIndex("by_transactionId", (q) => q.eq("transactionId", tx._id))
            .collect(),
          ctx.db
            .query("comment")
            .withIndex("by_transactionId", (q) => q.eq("transactionId", tx._id))
            .order("desc")
            .collect(),
          ctx.db
            .query("like")
            .withIndex("by_employeeId_transactionId", (q) =>
              q.eq("employeeId", ctx.user.employeeId).eq("transactionId", tx._id)
            )
            .first(),
        ]);

        return {
          tx,
          likesCount: likes.length,
          likedByCurrentUser: likedByCurrentUser !== null,
          comments,
        };
      })
    );

    const employeeIds = new Set<Id<"employee">>();
    for (const item of txMeta) {
      employeeIds.add(item.tx.senderId);
      employeeIds.add(item.tx.receiverId);
      for (const comment of item.comments) {
        employeeIds.add(comment.employeeId);
      }
    }

    const employeeEntries = await Promise.all(
      Array.from(employeeIds).map(async (employeeId) => {
        const employee = await ctx.db.get(employeeId);
        return employee ? ([employeeId, employee] as const) : null;
      })
    );
    const employeeMap = new Map(
      employeeEntries.filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    );

    const userEntries = await Promise.all(
      Array.from(employeeIds).map(async (employeeId) => {
        const user = await ctx.db
          .query("user")
          .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
          .first();
        return [employeeId, user?.image ?? null] as const;
      })
    );
    const userImageByEmployeeId = new Map(userEntries);

    return {
      page: txMeta.flatMap(({ tx, likesCount, likedByCurrentUser, comments }) => {
        const sender = employeeMap.get(tx.senderId);
        const receiver = employeeMap.get(tx.receiverId);
        if (!sender || !receiver) return [];

        return [{
          ...tx,
          createdAt: tx.createdAt ?? tx._creationTime,
          rejectionReason: tx.rejectionReason ?? null,
          updatedAt: tx.updatedAt ?? null,
          sender: {
            ...sender,
            image: userImageByEmployeeId.get(sender._id) ?? null,
          },
          receiver: {
            ...receiver,
            _id: receiver._id,
            image: userImageByEmployeeId.get(receiver._id) ?? null,
          },
          likes: {
            count: likesCount,
            likedByCurrentUser,
          },
          comments: comments.flatMap((comment) => {
            const author = employeeMap.get(comment.employeeId);
            if (!author) return [];

            return [{
              _id: comment._id,
              content: comment.content,
              createdAt: comment.createdAt ?? comment._creationTime,
              updatedAt: comment.updatedAt ?? null,
              author: {
                _id: author._id,
                name: author.name,
                department: author.department,
                position: author.position,
                rank: author.rank,
                division: author.division,
                image: userImageByEmployeeId.get(author._id) ?? null,
              },
            }];
          }),
        }];
      }),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  });

export const like = authMutation
  .input(
    z.object({
      transactionId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const transactionId = input.transactionId as Id<"transaction">;
    const transaction = await ctx.db.get(transactionId);
    if (!transaction) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "completed") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "You can only like completed transactions",
      });
    }

    const existingLike = await ctx.db
      .query("like")
      .withIndex("by_employeeId_transactionId", (q) =>
        q.eq("employeeId", ctx.user.employeeId).eq("transactionId", transactionId)
      )
      .first();

    let likedByCurrentUser = false;
    if (existingLike) {
      await ctx.db.delete(existingLike._id);
    } else {
      await ctx.db.insert("like", {
        employeeId: ctx.user.employeeId,
        transactionId,
        createdAt: Date.now(),
      });
      likedByCurrentUser = true;
    }

    const likes = await ctx.db
      .query("like")
      .withIndex("by_transactionId", (q) => q.eq("transactionId", transactionId))
      .collect();

    return {
      transactionId: String(transactionId),
      likes: {
        count: likes.length,
        likedByCurrentUser,
      },
    };
  });

export const comment = authMutation
  .input(
    z.object({
      transactionId: z.string(),
      content: z
        .string()
        .trim()
        .min(1, "Comment cannot be empty")
        .max(500, "Comment cannot exceed 500 characters"),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const transactionId = input.transactionId as Id<"transaction">;
    const transaction = await ctx.db.get(transactionId);
    if (!transaction) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "completed") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "You can only comment on completed transactions",
      });
    }

    const employee = await ctx.db.get(ctx.user.employeeId);
    if (!employee) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Current employee not found",
      });
    }

    const user = await ctx.db
      .query("user")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", employee._id))
      .first();

    const existingComment = await ctx.db
      .query("comment")
      .withIndex("by_employeeId_transactionId", (q) =>
        q.eq("employeeId", ctx.user.employeeId).eq("transactionId", transactionId)
      )
      .first();

    const now = Date.now();
    let commentId: Id<"comment">;

    if (existingComment) {
      await ctx.db.patch(existingComment._id, {
        content: input.content,
        updatedAt: now,
      });
      commentId = existingComment._id;
    } else {
      commentId = await ctx.db.insert("comment", {
        employeeId: ctx.user.employeeId,
        transactionId,
        content: input.content,
        createdAt: now,
      });
    }

    const saved = await ctx.db.get(commentId);
    if (!saved) {
      throw new CRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to save comment",
      });
    }

    return {
      _id: String(saved._id),
      transactionId: String(transactionId),
      content: saved.content,
      createdAt: saved.createdAt ?? saved._creationTime,
      updatedAt: saved.updatedAt ?? null,
      author: {
        _id: String(employee._id),
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        position: employee.position,
        rank: employee.rank,
        division: employee.division,
        image: user?.image ?? null,
      },
    };
  });