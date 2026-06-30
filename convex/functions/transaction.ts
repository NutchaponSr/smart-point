import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { authMutation, authQuery } from "../lib/crpc";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

function transactionTimestamp(t: Doc<"transaction">) {
  return t.createdAt ?? t._creationTime;
}

type TransactionPartyNames = {
  senderName: string | null;
  receiverName: string | null;
};

async function getPartyNamesByTransaction(
  ctx: QueryCtx,
  transactions: Doc<"transaction">[],
) {
  const employeeIds = new Set<Id<"employee">>();
  for (const transaction of transactions) {
    employeeIds.add(transaction.senderId);
    employeeIds.add(transaction.receiverId);
  }

  const employees = await Promise.all(
    Array.from(employeeIds).map(async (employeeId) => {
      const employee = await ctx.db.get(employeeId);
      return employee ? ([employeeId, employee.name] as const) : null;
    }),
  );
  const employeeNameMap = new Map(
    employees.filter(
      (entry): entry is NonNullable<typeof entry> => entry !== null,
    ),
  );

  const transactionPartyMap = new Map<
    Id<"transaction">,
    TransactionPartyNames
  >();
  for (const transaction of transactions) {
    transactionPartyMap.set(transaction._id, {
      senderName: employeeNameMap.get(transaction.senderId) ?? null,
      receiverName: employeeNameMap.get(transaction.receiverId) ?? null,
    });
  }

  return transactionPartyMap;
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
    senderName?: string | null;
    receiverName?: string | null;
  },
) {
  const ts = transactionTimestamp(t);
  const normalizedQuery = input.query?.trim().toLowerCase();

  if (input.from != null && ts < input.from) return false;
  if (input.to != null && ts > input.to) return false;
  if (normalizedQuery) {
    const message = (t.message ?? "").toLowerCase();
    const senderId = t.senderId.toLowerCase();
    const receiverId = t.receiverId.toLowerCase();
    const senderName = (input.senderName ?? "").toLowerCase();
    const receiverName = (input.receiverName ?? "").toLowerCase();
    const isQueryMatch =
      message.includes(normalizedQuery) ||
      senderId.includes(normalizedQuery) ||
      receiverId.includes(normalizedQuery) ||
      senderName.includes(normalizedQuery) ||
      receiverName.includes(normalizedQuery);

    if (!isQueryMatch) return false;
  }
  if (input.status?.length && !input.status.includes(t.status)) return false;
  if (input.min != null && input.min > 0 && t.amount < input.min) return false;
  if (input.max != null && input.max > 0 && t.amount > input.max) return false;
  return true;
}

async function enrichTransaction(ctx: QueryCtx, t: Doc<"transaction">) {
  const [senderEmployee, receiverEmployee] = await Promise.all([
    ctx.db.get(t.senderId),
    ctx.db.get(t.receiverId),
  ]);

  const [senderUser, receiverUser] = await Promise.all([
    senderEmployee
      ? ctx.db
          .query("user")
          .withIndex("by_employeeId", (q) =>
            q.eq("employeeId", senderEmployee._id),
          )
          .first()
      : null,
    receiverEmployee
      ? ctx.db
          .query("user")
          .withIndex("by_employeeId", (q) =>
            q.eq("employeeId", receiverEmployee._id),
          )
          .first()
      : null,
  ]);

  const toParty = (employee: typeof senderEmployee, user: typeof senderUser) =>
    employee
      ? {
          id: employee.employeeId,
          name: employee.name,
          department: employee.department,
          image: user?.image ?? null,
        }
      : null;

  return {
    ...t,
    sender: toParty(senderEmployee, senderUser),
    receiver: toParty(receiverEmployee, receiverUser),
  };
}

type TransactionListViewMode = "sent" | "received" | null;

type TransactionListFilterBounds = {
  query: string;
  status: Array<"pending" | "completed" | "rejected"> | null;
  min: number | null;
  max: number | null;
  from: number | null;
  to: number | null;
  view: TransactionListViewMode;
  /** When true, scope to the authenticated user's transactions only. */
  self: boolean;
  /** Resolved `by` employee document id when valid; omitted when unset. Invalid `by` is handled separately. */
  counterpartyEmployeeDocId: Id<"employee"> | null;
};

type TransactionPaginateResult = {
  page: Doc<"transaction">[];
  isDone: boolean;
  continueCursor: string | null;
};

type TransactionListBaseQuery = {
  paginate(opts: {
    cursor: string | null;
    numItems: number;
  }): Promise<TransactionPaginateResult>;
};

function assertTransactionListRanges(
  min: number | null,
  max: number | null,
  from: number | null,
  to: number | null,
): void {
  if (min != null && max != null && min > max) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "Minimum amount cannot be greater than maximum amount",
    });
  }
  if (from != null && to != null && from > to) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "Start date cannot be greater than end date",
    });
  }
}

async function resolveCounterpartyEmployeeDocIdFromPublicEmployeeId(
  ctx: QueryCtx,
  employeePublicId: string,
): Promise<Id<"employee"> | null> {
  const trimmed = employeePublicId.trim();
  if (trimmed === "") return null;

  const employee = await ctx.db
    .query("employee")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", trimmed))
    .first();

  return employee?._id ?? null;
}

function buildTransactionListBaseQuery(
  ctx: QueryCtx,
  scopeEmployeeDocId: Id<"employee"> | null,
  from: number | null,
  to: number | null,
  view: TransactionListViewMode,
) {
  if (scopeEmployeeDocId == null) {
    return ctx.db.query("transaction").order("desc");
  }

  const myEmployeeDocId = scopeEmployeeDocId;

  if (view === "received") {
    return ctx.db
      .query("transaction")
      .withIndex("by_receiverId", (q) => {
        const receiverRange = q.eq("receiverId", myEmployeeDocId);
        if (from != null && to != null) {
          return receiverRange
            .gte("_creationTime", from)
            .lte("_creationTime", to);
        }
        if (from != null) {
          return receiverRange.gte("_creationTime", from);
        }
        if (to != null) {
          return receiverRange.lte("_creationTime", to);
        }
        return receiverRange;
      })
      .order("desc");
  }

  return ctx.db
    .query("transaction")
    .withIndex("by_senderId", (q) => {
      const senderRange = q.eq("senderId", myEmployeeDocId);
      if (from != null && to != null) {
        return senderRange.gte("_creationTime", from).lte("_creationTime", to);
      }
      if (from != null) {
        return senderRange.gte("_creationTime", from);
      }
      if (to != null) {
        return senderRange.lte("_creationTime", to);
      }
      return senderRange;
    })
    .order("desc");
}

function transactionMatchesListFilters(
  transaction: Doc<"transaction">,
  bounds: TransactionListFilterBounds,
  partyNames: TransactionPartyNames | undefined,
): boolean {
  const counterpartyId = bounds.counterpartyEmployeeDocId;
  if (counterpartyId != null) {
    if (bounds.self) {
      const viewingReceived = bounds.view === "received";
      if (viewingReceived) {
        if (transaction.senderId !== counterpartyId) return false;
      } else if (transaction.receiverId !== counterpartyId) {
        return false;
      }
    } else if (
      transaction.senderId !== counterpartyId &&
      transaction.receiverId !== counterpartyId
    ) {
      return false;
    }
  }

  return filterTransaction(transaction, {
    query: bounds.query,
    status: bounds.status,
    min: bounds.min,
    max: bounds.max,
    from: bounds.from,
    to: bounds.to,
    senderName: partyNames?.senderName ?? null,
    receiverName: partyNames?.receiverName ?? null,
  });
}

async function collectFilteredEnrichedTransactionPage(
  ctx: QueryCtx,
  baseQuery: TransactionListBaseQuery,
  bounds: TransactionListFilterBounds,
  limit: number,
  initialCursor: string | null,
): Promise<{
  page: Array<Awaited<ReturnType<typeof enrichTransaction>>>;
  lastPageResult: TransactionPaginateResult;
  exhausted: boolean;
}> {
  let cursor = initialCursor;
  let pageResult = await baseQuery.paginate({
    cursor,
    numItems: limit,
  });
  const page: Array<Awaited<ReturnType<typeof enrichTransaction>>> = [];
  let exhausted = false;

  while (page.length < limit) {
    const partyNamesById = await getPartyNamesByTransaction(
      ctx,
      pageResult.page,
    );
    const filteredRows = pageResult.page.filter((transaction) =>
      transactionMatchesListFilters(
        transaction,
        bounds,
        partyNamesById.get(transaction._id),
      ),
    );

    const remain = limit - page.length;
    const enrichedRows = await Promise.all(
      filteredRows
        .slice(0, remain)
        .map((transaction) => enrichTransaction(ctx, transaction)),
    );
    page.push(...enrichedRows);

    exhausted =
      pageResult.isDone ||
      pageResult.continueCursor == null ||
      pageResult.page.length === 0;
    if (exhausted || page.length >= limit) {
      break;
    }

    cursor = pageResult.continueCursor;
    pageResult = await baseQuery.paginate({
      cursor,
      numItems: limit,
    });
  }

  return { page, lastPageResult: pageResult, exhausted };
}

async function hasNextFilteredTransactionPage(
  ctx: QueryCtx,
  baseQuery: TransactionListBaseQuery,
  bounds: TransactionListFilterBounds,
  startCursor: string | null,
): Promise<boolean> {
  let currentCursor = startCursor;
  let done = currentCursor == null;

  while (!done) {
    const probeResult = await baseQuery.paginate({
      cursor: currentCursor,
      numItems: 1,
    });
    if (probeResult.page.length === 0) {
      break;
    }

    const [probeItem] = probeResult.page;
    const probePartyNames = await getPartyNamesByTransaction(ctx, [probeItem]);
    if (
      transactionMatchesListFilters(
        probeItem,
        bounds,
        probePartyNames.get(probeItem._id),
      )
    ) {
      return true;
    }

    done = probeResult.isDone || probeResult.continueCursor == null;
    currentCursor = probeResult.continueCursor;
  }

  return false;
}

type ApproveTransactionResult =
  | {
      transactionId: Id<"transaction">;
      status: "approved" | "alreadyCompleted";
      amount: number;
    }
  | {
      transactionId: Id<"transaction">;
      status: "failed";
      code: "NOT_FOUND" | "BAD_REQUEST";
      message: string;
    };

async function approveTransactionById(
  ctx: MutationCtx & { user: { employeeId: Id<"employee"> } },
  transactionId: Id<"transaction">,
  confirm: boolean,
): Promise<ApproveTransactionResult> {
  const transaction = await ctx.db.get(transactionId);
  if (!transaction) {
    return {
      transactionId,
      status: "failed" as const,
      code: "NOT_FOUND" as const,
      message: "Transaction not found",
    };
  }

  if (transaction.status === "completed") {
    return {
      transactionId: transaction._id,
      status: "alreadyCompleted" as const,
      amount: transaction.amount,
    };
  }

  if (transaction.status !== "pending") {
    return {
      transactionId: transaction._id,
      status: "failed" as const,
      code: "BAD_REQUEST" as const,
      message: "Transaction is not pending",
    };
  }

  if (transaction.amount <= 0) {
    return {
      transactionId: transaction._id,
      status: "failed" as const,
      code: "BAD_REQUEST" as const,
      message: "Transaction amount must be greater than zero",
    };
  }

  const receiverWallet = await ctx.db
    .query("wallet")
    .withIndex("by_employeeId", (q) =>
      q.eq("employeeId", transaction.receiverId),
    )
    .first();

  if (!receiverWallet) {
    return {
      transactionId: transaction._id,
      status: "failed" as const,
      code: "NOT_FOUND" as const,
      message: "Wallet not found",
    };
  }

  const transactionSourceId = String(transaction._id);
  const existingReceiverLedger = await ctx.db
    .query("pointLedger")
    .withIndex("by_sourceType_sourceId", (q) =>
      q.eq("sourceType", "transaction").eq("sourceId", transactionSourceId),
    )
    .filter((q) =>
      q.and(
        q.eq(q.field("balanceType"), "receiving"),
        q.eq(q.field("employeeId"), transaction.receiverId),
      ),
    )
    .first();

  if (confirm && !existingReceiverLedger) {
    await ctx.db.patch(receiverWallet._id, {
      receivingBudget: receiverWallet.receivingBudget + transaction.amount,
    });

    await ctx.db.insert("pointLedger", {
      employeeId: transaction.receiverId,
      delta: transaction.amount,
      balanceAfter: receiverWallet.receivingBudget + transaction.amount,
      balanceType: "receiving",
      sourceType: "transaction",
      sourceId: transactionSourceId,
      note: `Received from ${transaction.senderId}`,
      createdAt: Date.now(),
    });
  }

  await ctx.db.patch(transaction._id, {
    status: confirm ? "completed" : "rejected",
    reviewedAt: Date.now(),
    reviewedBy: ctx.user.employeeId,
    updatedAt: Date.now(),
  });

  return {
    transactionId: transaction._id,
    status: "approved" as const,
    amount: transaction.amount,
  };
}

export const getMany = authQuery
  .input(
    z.object({
      q: z.string().optional().nullable(),
      status: z
        .array(z.enum(["pending", "completed", "rejected"]))
        .optional()
        .nullable(),
      min: z.number().optional().nullable(),
      max: z.number().optional().nullable(),
      from: z.number().optional().nullable(),
      to: z.number().optional().nullable(),
      by: z.string().optional().nullable(), //employee Id
      cursor: z.string().nullish(),
      limit: z.number().min(1).max(50),
      view: z.enum(["sent", "received"]).optional().nullable(), // sent or received
      self: z.boolean(), // show only own transactions
    }),
  )
  .query(async ({ ctx, input }) => {
    const trimmedBy = input.by?.trim() ?? "";

    let counterpartyEmployeeDocId: Id<"employee"> | null = null;

    if (trimmedBy !== "") {
      const resolved =
        await resolveCounterpartyEmployeeDocIdFromPublicEmployeeId(
          ctx,
          trimmedBy,
        );

      if (resolved === null) {
        return {
          page: [] as Array<Awaited<ReturnType<typeof enrichTransaction>>>,
          continueCursor: null,
          hasNextPage: false,
          isDone: true,
        };
      }

      counterpartyEmployeeDocId = resolved;
    }

    const bounds: TransactionListFilterBounds = {
      query: input.q?.trim().toLowerCase() ?? "",
      status: input.status ?? null,
      min: input.min ?? null,
      max: input.max ?? null,
      from: input.from ?? null,
      to: input.to ?? null,
      view: input.view ?? null,
      self: input.self,
      counterpartyEmployeeDocId,
    };

    assertTransactionListRanges(bounds.min, bounds.max, bounds.from, bounds.to);

    const baseQuery = buildTransactionListBaseQuery(
      ctx,
      input.self ? ctx.user.employeeId : null,
      bounds.from,
      bounds.to,
      bounds.view,
    );

    const { page, lastPageResult, exhausted } =
      await collectFilteredEnrichedTransactionPage(
        ctx,
        baseQuery,
        bounds,
        input.limit,
        input.cursor ?? null,
      );

    if (exhausted) {
      return {
        ...lastPageResult,
        page,
        continueCursor: null,
        hasNextPage: false,
        isDone: true,
      };
    }

    const hasNextPage = await hasNextFilteredTransactionPage(
      ctx,
      baseQuery,
      bounds,
      lastPageResult.continueCursor,
    );

    return {
      ...lastPageResult,
      page,
      hasNextPage,
    };
  });

const MAX_EXPORT_ROWS = 10_000;
const EXPORT_FETCH_BATCH = 100;

/** ส่งออกธุรกรรมทั้งหมดที่ตรง filter เดียวกับ getMany (รวม pagination) */
export const exportAll = authMutation
  .input(
    z.object({
      q: z.string().optional().nullable(),
      status: z
        .array(z.enum(["pending", "completed", "rejected"]))
        .optional()
        .nullable(),
      min: z.number().optional().nullable(),
      max: z.number().optional().nullable(),
      from: z.number().optional().nullable(),
      to: z.number().optional().nullable(),
      by: z.string().optional().nullable(),
      view: z.enum(["sent", "received"]).optional().nullable(),
      self: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const trimmedBy = input.by?.trim() ?? "";

    let counterpartyEmployeeDocId: Id<"employee"> | null = null;

    if (trimmedBy !== "") {
      const resolved =
        await resolveCounterpartyEmployeeDocIdFromPublicEmployeeId(
          ctx,
          trimmedBy,
        );

      if (resolved === null) {
        return [] as Array<Awaited<ReturnType<typeof enrichTransaction>>>;
      }

      counterpartyEmployeeDocId = resolved;
    }

    const bounds: TransactionListFilterBounds = {
      query: input.q?.trim().toLowerCase() ?? "",
      status: input.status ?? null,
      min: input.min ?? null,
      max: input.max ?? null,
      from: input.from ?? null,
      to: input.to ?? null,
      view: input.view ?? null,
      self: input.self,
      counterpartyEmployeeDocId,
    };

    assertTransactionListRanges(bounds.min, bounds.max, bounds.from, bounds.to);

    const baseQuery = buildTransactionListBaseQuery(
      ctx,
      input.self ? ctx.user.employeeId : null,
      bounds.from,
      bounds.to,
      bounds.view,
    );

    const aggregated: Array<Awaited<ReturnType<typeof enrichTransaction>>> = [];
    let cursor: string | null = null;

    while (true) {
      const { page, lastPageResult, exhausted } =
        await collectFilteredEnrichedTransactionPage(
          ctx,
          baseQuery,
          bounds,
          EXPORT_FETCH_BATCH,
          cursor,
        );

      aggregated.push(...page);
      if (aggregated.length > MAX_EXPORT_ROWS) {
        throw new CRPCError({
          code: "BAD_REQUEST",
          message: `พบข้อมูลมากเกิน ${MAX_EXPORT_ROWS} รายการ กรุณาใช้ตัวกรองให้แคบลง`,
        });
      }

      if (exhausted) break;

      const next = lastPageResult.continueCursor;
      if (next == null) break;
      cursor = next;
    }

    return aggregated;
  });

export const send = authMutation
  .input(
    z.object({
      receiverId: z.string(),
      amount: z.number(),
      message: z.string(),
      tags: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const [sender, receiver] = await Promise.all([
      ctx.db
        .query("employee")
        .withIndex("by_employeeId", (q) =>
          q.eq("employeeId", ctx.user.username),
        )
        .first(),
      ctx.db
        .query("employee")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", input.receiverId))
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
      sourceId: String(transactionId),
      note: `Sent to ${receiver.name}`,
      createdAt: Date.now(),
    });

    return transactionId;
  });

export const approve = authMutation
  .input(
    z.object({
      transactionId: z.string(),
      confirm: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const result = await approveTransactionById(
      ctx,
      input.transactionId as Id<"transaction">,
      input.confirm,
    );

    if (result.status === "failed") {
      throw new CRPCError({
        code: result.code,
        message: result.message,
      });
    }

    return result;
  });

export const bulkApprove = authMutation
  .input(
    z.object({
      transactionIds: z.array(z.string()).min(1).max(100),
      confirm: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const uniqueTransactionIds = Array.from(new Set(input.transactionIds));
    const results = await Promise.all(
      uniqueTransactionIds.map((transactionId) =>
        approveTransactionById(
          ctx,
          transactionId as Id<"transaction">,
          input.confirm,
        ),
      ),
    );

    const approvedCount = results.filter(
      (item) => item.status === "approved",
    ).length;
    const alreadyCompletedCount = results.filter(
      (item) => item.status === "alreadyCompleted",
    ).length;
    const failedCount = results.filter(
      (item) => item.status === "failed",
    ).length;

    return {
      total: uniqueTransactionIds.length,
      approvedCount,
      alreadyCompletedCount,
      failedCount,
      results,
    };
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
      tags: z.string().nullish(),
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
      comments: z.array(
        z.object({
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
        }),
      ),
    }),
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
              q
                .eq("employeeId", ctx.user.employeeId)
                .eq("transactionId", tx._id),
            )
            .first(),
        ]);

        return {
          tx,
          likesCount: likes.length,
          likedByCurrentUser: likedByCurrentUser !== null,
          comments,
        };
      }),
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
      }),
    );
    const employeeMap = new Map(
      employeeEntries.filter(
        (entry): entry is NonNullable<typeof entry> => entry !== null,
      ),
    );

    const userEntries = await Promise.all(
      Array.from(employeeIds).map(async (employeeId) => {
        const user = await ctx.db
          .query("user")
          .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
          .first();
        return [employeeId, user?.image ?? null] as const;
      }),
    );
    const userImageByEmployeeId = new Map(userEntries);

    return {
      page: txMeta.flatMap(
        ({ tx, likesCount, likedByCurrentUser, comments }) => {
          const sender = employeeMap.get(tx.senderId);
          const receiver = employeeMap.get(tx.receiverId);
          if (!sender || !receiver) return [];

          return [
            {
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

                return [
                  {
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
                  },
                ];
              }),
            },
          ];
        },
      ),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  });

export const like = authMutation
  .input(
    z.object({
      transactionId: z.string(),
    }),
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
        q
          .eq("employeeId", ctx.user.employeeId)
          .eq("transactionId", transactionId),
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
      .withIndex("by_transactionId", (q) =>
        q.eq("transactionId", transactionId),
      )
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
    }),
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
        q
          .eq("employeeId", ctx.user.employeeId)
          .eq("transactionId", transactionId),
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
