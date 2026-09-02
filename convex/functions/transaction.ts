import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { appendActivityLog } from "../lib/activity-log";
import { requireAdmin } from "../lib/auth-helper";
import { authMutation, authQuery } from "../lib/crpc";
import {
  DAILY_SEND_CAP,
  DAILY_SEND_LIMIT_ENABLED,
  getDailySendUsed,
} from "../lib/daily-send";
import { normalizeText } from "../lib/employee-id";
import { listVisibleSubjectEmployeeDocIds } from "../lib/k2-visibility";
import { syncLeaderboardEntry } from "../lib/leaderboard-entry";
// import { awardSpecialPoints } from "../lib/points";
import {
  coerceLocalized,
  isLocalizedString,
  localizedLabel,
  localizedSearchText,
} from "../lib/localized";
import {
  getMonthlyTransferUsed,
  MONTHLY_TRANSFER_CAP_PER_RECEIVER,
  MONTHLY_TRANSFER_LIMIT_ENABLED,
  thaiMonthRange,
} from "../lib/monthly-transfer";
import { canSendUnlimitedPoints } from "../lib/point-send-privileges";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const zLocalizedString = z.object({
  th: z.string(),
  en: z.string(),
});

function rankAsString(value: unknown): string {
  if (typeof value === "string") return value;
  if (isLocalizedString(value)) return value.th.trim() || value.en.trim();
  return "";
}

const MONTHLY_QUEST_GOAL = 20;
const MONTHLY_QUEST_REWARD_PER_GIVE = 1;

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
      return employee
        ? ([employeeId, localizedSearchText(employee.name)] as const)
        : null;
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
    const transactionId = t._id.toLowerCase();
    const senderId = t.senderId.toLowerCase();
    const receiverId = t.receiverId.toLowerCase();
    const senderName = (input.senderName ?? "").toLowerCase();
    const receiverName = (input.receiverName ?? "").toLowerCase();
    const isQueryMatch =
      message.includes(normalizedQuery) ||
      transactionId.includes(normalizedQuery) ||
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
          name: coerceLocalized(employee.name),
          department: coerceLocalized(employee.department),
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

type TransactionListCursor = {
  creationTime: number;
  id: Id<"transaction">;
} | null;

type TransactionListBaseQueryFactory = (cursor: TransactionListCursor) => {
  take: (n: number) => Promise<Doc<"transaction">[]>;
};

const MAX_LIST_SCAN_PER_CALL = 2_000;

function encodeTransactionListCursor(
  cursor: TransactionListCursor,
): string | null {
  if (cursor == null) return null;
  return JSON.stringify(cursor);
}

function decodeTransactionListCursor(
  raw: string | null | undefined,
): TransactionListCursor {
  if (raw == null || raw === "") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "creationTime" in parsed &&
      "id" in parsed &&
      typeof (parsed as { creationTime: unknown }).creationTime === "number" &&
      typeof (parsed as { id: unknown }).id === "string"
    ) {
      return {
        creationTime: (parsed as { creationTime: number }).creationTime,
        id: (parsed as { id: string }).id as Id<"transaction">,
      };
    }
  } catch {
    // opaque/old Convex paginate cursors → restart from newest
  }
  return null;
}

function isAfterTransactionListCursor(
  tx: Doc<"transaction">,
  cursor: TransactionListCursor,
): boolean {
  if (cursor == null) return true;
  return (
    tx._creationTime < cursor.creationTime ||
    (tx._creationTime === cursor.creationTime && tx._id < cursor.id)
  );
}

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
  cursor: TransactionListCursor,
) {
  // Desc page: tighten upper bound so we don't re-read docs newer than cursor.
  const effectiveTo =
    cursor != null
      ? to == null
        ? cursor.creationTime
        : Math.min(to, cursor.creationTime)
      : to;

  if (scopeEmployeeDocId == null) {
    // Admin/all list: no sender/receiver scope. Bound by creation time when
    // possible so cursor pages don't re-read newer docs.
    if (from != null && effectiveTo != null) {
      return ctx.db
        .query("transaction")
        .filter((q) =>
          q.and(
            q.gte(q.field("_creationTime"), from),
            q.lte(q.field("_creationTime"), effectiveTo),
          ),
        )
        .order("desc");
    }
    if (from != null) {
      return ctx.db
        .query("transaction")
        .filter((q) => q.gte(q.field("_creationTime"), from))
        .order("desc");
    }
    if (effectiveTo != null) {
      return ctx.db
        .query("transaction")
        .filter((q) => q.lte(q.field("_creationTime"), effectiveTo))
        .order("desc");
    }
    return ctx.db.query("transaction").order("desc");
  }

  const myEmployeeDocId = scopeEmployeeDocId;

  if (view === "received") {
    return ctx.db
      .query("transaction")
      .withIndex("by_receiverId", (q) => {
        const receiverRange = q.eq("receiverId", myEmployeeDocId);
        if (from != null && effectiveTo != null) {
          return receiverRange
            .gte("_creationTime", from)
            .lte("_creationTime", effectiveTo);
        }
        if (from != null) {
          return receiverRange.gte("_creationTime", from);
        }
        if (effectiveTo != null) {
          return receiverRange.lte("_creationTime", effectiveTo);
        }
        return receiverRange;
      })
      .order("desc");
  }

  return ctx.db
    .query("transaction")
    .withIndex("by_senderId", (q) => {
      const senderRange = q.eq("senderId", myEmployeeDocId);
      if (from != null && effectiveTo != null) {
        return senderRange
          .gte("_creationTime", from)
          .lte("_creationTime", effectiveTo);
      }
      if (from != null) {
        return senderRange.gte("_creationTime", from);
      }
      if (effectiveTo != null) {
        return senderRange.lte("_creationTime", effectiveTo);
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
  createBaseQuery: TransactionListBaseQueryFactory,
  bounds: TransactionListFilterBounds,
  limit: number,
  initialCursor: TransactionListCursor,
): Promise<{
  page: Array<Awaited<ReturnType<typeof enrichTransaction>>>;
  continueCursor: string | null;
  hasNextPage: boolean;
  isDone: boolean;
}> {
  const target = limit + 1; // +1 probe → hasNextPage without a second paginate
  const matched: Doc<"transaction">[] = [];
  let scanCursor = initialCursor;
  let streamExhausted = false;
  let totalScanned = 0;

  while (matched.length < target && !streamExhausted) {
    const remaining = target - matched.length;
    const batchSize = Math.min(
      Math.max(remaining * 5, 50),
      MAX_LIST_SCAN_PER_CALL - totalScanned,
    );
    if (batchSize <= 0) break;

    const raw = await createBaseQuery(scanCursor).take(batchSize);
    totalScanned += raw.length;

    const afterCursor = raw.filter((tx) =>
      isAfterTransactionListCursor(tx, scanCursor),
    );

    if (afterCursor.length === 0) {
      if (raw.length === 0) {
        streamExhausted = true;
        break;
      }
      // Same-timestamp boundary: advance past this batch and keep scanning.
      const lastRaw = raw[raw.length - 1]!;
      scanCursor = {
        creationTime: lastRaw._creationTime,
        id: lastRaw._id,
      };
      streamExhausted = raw.length < batchSize;
      continue;
    }

    const partyNamesById = await getPartyNamesByTransaction(ctx, afterCursor);
    for (const tx of afterCursor) {
      if (
        transactionMatchesListFilters(tx, bounds, partyNamesById.get(tx._id))
      ) {
        matched.push(tx);
        if (matched.length >= target) break;
      }
    }

    const lastRaw = afterCursor[afterCursor.length - 1]!;
    scanCursor = {
      creationTime: lastRaw._creationTime,
      id: lastRaw._id,
    };

    streamExhausted = raw.length < batchSize;
    if (matched.length >= target) break;
    if (totalScanned >= MAX_LIST_SCAN_PER_CALL) break;
  }

  const hasNextPage =
    matched.length > limit ||
    (!streamExhausted && totalScanned >= MAX_LIST_SCAN_PER_CALL);

  const pageDocs = matched.slice(0, limit);
  const page = await Promise.all(
    pageDocs.map((tx) => enrichTransaction(ctx, tx)),
  );

  const lastPageDoc = pageDocs[pageDocs.length - 1];
  const continueCursor =
    lastPageDoc == null
      ? hasNextPage
        ? encodeTransactionListCursor(scanCursor)
        : null
      : encodeTransactionListCursor({
          creationTime: lastPageDoc._creationTime,
          id: lastPageDoc._id,
        });

  return {
    page,
    continueCursor: hasNextPage ? continueCursor : null,
    hasNextPage,
    isDone: !hasNextPage,
  };
}

type StreamCursor = {
  creationTime: number;
  id: Id<"transaction">;
} | null;

type FeedsCursor = {
  senderCursor: StreamCursor;
  receiverCursor: StreamCursor;
  senderPendingIds: Id<"transaction">[];
  receiverPendingIds: Id<"transaction">[];
};

function emptyFeedsCursor(): FeedsCursor {
  return {
    senderCursor: null,
    receiverCursor: null,
    senderPendingIds: [],
    receiverPendingIds: [],
  };
}

function normalizeStreamCursor(value: unknown): StreamCursor {
  if (
    value &&
    typeof value === "object" &&
    "creationTime" in value &&
    "id" in value &&
    typeof value.creationTime === "number" &&
    typeof value.id === "string"
  ) {
    return {
      creationTime: value.creationTime,
      id: value.id as Id<"transaction">,
    };
  }
  return null;
}

function encodeFeedsCursor(cursor: FeedsCursor): string | null {
  if (
    cursor.senderCursor == null &&
    cursor.receiverCursor == null &&
    cursor.senderPendingIds.length === 0 &&
    cursor.receiverPendingIds.length === 0
  ) {
    return null;
  }
  return JSON.stringify(cursor);
}

function decodeFeedsCursor(raw: string | null | undefined): FeedsCursor {
  if (!raw) {
    return emptyFeedsCursor();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FeedsCursor>;
    return {
      senderCursor: normalizeStreamCursor(parsed.senderCursor),
      receiverCursor: normalizeStreamCursor(parsed.receiverCursor),
      senderPendingIds: parsed.senderPendingIds ?? [],
      receiverPendingIds: parsed.receiverPendingIds ?? [],
    };
  } catch {
    return emptyFeedsCursor();
  }
}

function isAfterStreamCursor(
  tx: Doc<"transaction">,
  cursor: StreamCursor,
): boolean {
  if (!cursor) {
    return true;
  }

  return (
    tx._creationTime < cursor.creationTime ||
    (tx._creationTime === cursor.creationTime && tx._id < cursor.id)
  );
}

async function fetchCompletedStreamBatch(
  baseQuery: {
    take: (n: number) => Promise<Doc<"transaction">[]>;
  },
  cursor: StreamCursor,
  limit: number,
): Promise<{ batch: Doc<"transaction">[]; exhausted: boolean }> {
  let overfetch = Math.max(limit * 5, 50);
  let raw: Doc<"transaction">[] = [];
  let filtered: Doc<"transaction">[] = [];

  while (true) {
    raw = await baseQuery.take(overfetch);
    filtered = raw.filter((tx) => isAfterStreamCursor(tx, cursor));

    if (filtered.length >= limit || raw.length < overfetch) {
      break;
    }

    overfetch = Math.min(overfetch * 2, 500);
  }

  return {
    batch: filtered.slice(0, limit),
    exhausted: raw.length < overfetch && filtered.length <= limit,
  };
}

function advanceStreamCursor(
  cursor: StreamCursor,
  batch: Doc<"transaction">[],
): StreamCursor {
  if (batch.length === 0) {
    return cursor;
  }

  const last = batch[batch.length - 1]!;
  return {
    creationTime: last._creationTime,
    id: last._id,
  };
}

async function restoreFeedBuffer(
  ctx: QueryCtx,
  ids: Id<"transaction">[],
): Promise<Doc<"transaction">[]> {
  const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
  return docs.filter((doc): doc is Doc<"transaction"> => doc !== null);
}

type FeedFilterBounds = {
  query: string;
  min: number | null;
  max: number | null;
  from: number | null;
  to: number | null;
};

function buildCompletedFeedStreamQuery(
  ctx: QueryCtx,
  employeeId: Id<"employee">,
  role: "sender" | "receiver",
  from: number | null,
  to: number | null,
) {
  if (role === "sender") {
    return ctx.db
      .query("transaction")
      .withIndex("by_senderId_status", (q) => {
        const range = q.eq("senderId", employeeId).eq("status", "completed");
        if (from != null && to != null) {
          return range.gte("_creationTime", from).lte("_creationTime", to);
        }
        if (from != null) {
          return range.gte("_creationTime", from);
        }
        if (to != null) {
          return range.lte("_creationTime", to);
        }
        return range;
      })
      .order("desc");
  }

  return ctx.db
    .query("transaction")
    .withIndex("by_receiverId_status", (q) => {
      const range = q.eq("receiverId", employeeId).eq("status", "completed");
      if (from != null && to != null) {
        return range.gte("_creationTime", from).lte("_creationTime", to);
      }
      if (from != null) {
        return range.gte("_creationTime", from);
      }
      if (to != null) {
        return range.lte("_creationTime", to);
      }
      return range;
    })
    .order("desc");
}

async function filterFeedCandidates(
  ctx: QueryCtx,
  candidates: Doc<"transaction">[],
  bounds: FeedFilterBounds,
): Promise<Doc<"transaction">[]> {
  if (candidates.length === 0) {
    return candidates;
  }

  const needsNameLookup = bounds.query.length > 0;
  const partyNamesById = needsNameLookup
    ? await getPartyNamesByTransaction(ctx, candidates)
    : null;

  return candidates.filter((transaction) => {
    const partyNames = partyNamesById?.get(transaction._id);
    return filterTransaction(transaction, {
      query: bounds.query,
      min: bounds.min,
      max: bounds.max,
      from: bounds.from,
      to: bounds.to,
      senderName: partyNames?.senderName ?? null,
      receiverName: partyNames?.receiverName ?? null,
    });
  });
}

async function collectMyCompletedFeedPage(
  ctx: QueryCtx,
  employeeId: Id<"employee">,
  limit: number,
  initialCursor: FeedsCursor,
  view: "all" | "sent" | "received" = "all",
  bounds: FeedFilterBounds = {
    query: "",
    min: null,
    max: null,
    from: null,
    to: null,
  },
): Promise<{
  page: Doc<"transaction">[];
  nextCursor: FeedsCursor;
  exhausted: boolean;
}> {
  let senderCursor = initialCursor.senderCursor;
  let receiverCursor = initialCursor.receiverCursor;
  let sentBuffer = await filterFeedCandidates(
    ctx,
    await restoreFeedBuffer(ctx, initialCursor.senderPendingIds),
    bounds,
  );
  let receivedBuffer = await filterFeedCandidates(
    ctx,
    await restoreFeedBuffer(ctx, initialCursor.receiverPendingIds),
    bounds,
  );
  let senderExhausted = view === "received";
  let receiverExhausted = view === "sent";

  const sentQuery = buildCompletedFeedStreamQuery(
    ctx,
    employeeId,
    "sender",
    bounds.from,
    bounds.to,
  );
  const receivedQuery = buildCompletedFeedStreamQuery(
    ctx,
    employeeId,
    "receiver",
    bounds.from,
    bounds.to,
  );

  const page: Doc<"transaction">[] = [];

  while (page.length < limit) {
    if (sentBuffer.length === 0 && !senderExhausted) {
      const senderResult = await fetchCompletedStreamBatch(
        sentQuery,
        senderCursor,
        limit,
      );
      sentBuffer = await filterFeedCandidates(ctx, senderResult.batch, bounds);
      senderExhausted = senderResult.exhausted;
      senderCursor = advanceStreamCursor(senderCursor, senderResult.batch);
    }

    if (receivedBuffer.length === 0 && !receiverExhausted) {
      const receiverResult = await fetchCompletedStreamBatch(
        receivedQuery,
        receiverCursor,
        limit,
      );
      receivedBuffer = await filterFeedCandidates(
        ctx,
        receiverResult.batch,
        bounds,
      );
      receiverExhausted = receiverResult.exhausted;
      receiverCursor = advanceStreamCursor(
        receiverCursor,
        receiverResult.batch,
      );
    }

    if (sentBuffer.length === 0 && receivedBuffer.length === 0) {
      break;
    }

    while (
      page.length < limit &&
      (sentBuffer.length > 0 || receivedBuffer.length > 0)
    ) {
      const pickSent =
        receivedBuffer.length === 0 ||
        (sentBuffer.length > 0 &&
          sentBuffer[0]!._creationTime >= receivedBuffer[0]!._creationTime);
      page.push(pickSent ? sentBuffer.shift()! : receivedBuffer.shift()!);
    }

    if (page.length >= limit) {
      break;
    }
    if (senderExhausted && receiverExhausted) {
      break;
    }
  }

  const exhausted =
    page.length < limit &&
    senderExhausted &&
    receiverExhausted &&
    sentBuffer.length === 0 &&
    receivedBuffer.length === 0;

  return {
    page,
    nextCursor: {
      senderCursor,
      receiverCursor,
      senderPendingIds: sentBuffer.map((tx) => tx._id),
      receiverPendingIds: receivedBuffer.map((tx) => tx._id),
    },
    exhausted,
  };
}

type TeamFeedsCursor = {
  creationTime: number;
  id: Id<"transaction">;
} | null;

function decodeTeamFeedsCursor(
  raw: string | null | undefined,
): TeamFeedsCursor {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TeamFeedsCursor>;
    if (
      parsed &&
      typeof parsed.creationTime === "number" &&
      typeof parsed.id === "string"
    ) {
      return {
        creationTime: parsed.creationTime,
        id: parsed.id as Id<"transaction">,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function encodeTeamFeedsCursor(cursor: TeamFeedsCursor): string | null {
  if (!cursor) return null;
  return JSON.stringify(cursor);
}

async function collectTeamCompletedFeedPage(
  ctx: QueryCtx,
  viewerBusinessCode: string,
  limit: number,
  initialCursor: TeamFeedsCursor,
  view: "all" | "sent" | "received" = "all",
  bounds: FeedFilterBounds = {
    query: "",
    min: null,
    max: null,
    from: null,
    to: null,
  },
): Promise<{
  page: Doc<"transaction">[];
  nextCursor: TeamFeedsCursor;
  exhausted: boolean;
}> {
  const subjectIds = await listVisibleSubjectEmployeeDocIds(
    ctx,
    viewerBusinessCode,
  );

  if (subjectIds.length === 0) {
    return { page: [], nextCursor: null, exhausted: true };
  }

  const subjectSet = new Set(subjectIds);
  const streamCursor: StreamCursor = initialCursor
    ? { creationTime: initialCursor.creationTime, id: initialCursor.id }
    : null;

  // Overfetch per stream so filters + multi-subject merge still fill a page.
  const perStreamTake = Math.max(limit * 3, 30);
  const candidates: Doc<"transaction">[] = [];
  const seen = new Set<Id<"transaction">>();
  let anyStreamHasMore = false;

  for (const employeeId of subjectIds) {
    if (view === "all" || view === "sent") {
      const senderResult = await fetchCompletedStreamBatch(
        buildCompletedFeedStreamQuery(
          ctx,
          employeeId,
          "sender",
          bounds.from,
          bounds.to,
        ),
        streamCursor,
        perStreamTake,
      );
      if (!senderResult.exhausted) {
        anyStreamHasMore = true;
      }
      for (const tx of senderResult.batch) {
        if (!seen.has(tx._id)) {
          seen.add(tx._id);
          candidates.push(tx);
        }
      }
    }

    if (view === "all" || view === "received") {
      const receiverResult = await fetchCompletedStreamBatch(
        buildCompletedFeedStreamQuery(
          ctx,
          employeeId,
          "receiver",
          bounds.from,
          bounds.to,
        ),
        streamCursor,
        perStreamTake,
      );
      if (!receiverResult.exhausted) {
        anyStreamHasMore = true;
      }
      for (const tx of receiverResult.batch) {
        if (!seen.has(tx._id)) {
          seen.add(tx._id);
          candidates.push(tx);
        }
      }
    }
  }

  // เฉพาะธุรกรรมที่คู่สัญญาอย่างน้อยฝ่ายหนึ่งอยู่ในชุด subject ตาม k2
  const scoped = candidates.filter(
    (tx) => subjectSet.has(tx.senderId) || subjectSet.has(tx.receiverId),
  );

  const filtered = await filterFeedCandidates(ctx, scoped, bounds);
  filtered.sort((a, b) => {
    if (a._creationTime !== b._creationTime) {
      return b._creationTime - a._creationTime;
    }
    return a._id < b._id ? 1 : a._id > b._id ? -1 : 0;
  });

  const page = filtered.slice(0, limit);
  const last = page[page.length - 1];
  const exhausted = page.length < limit && !anyStreamHasMore;

  return {
    page,
    nextCursor: last
      ? { creationTime: last._creationTime, id: last._id }
      : null,
    exhausted,
  };
}

type ApproveTransactionResult =
  | {
      transactionId: Id<"transaction">;
      status: "rejected";
      amount: number;
    }
  | {
      transactionId: Id<"transaction">;
      status: "failed";
      code: "NOT_FOUND" | "BAD_REQUEST";
      message: string;
    };

async function deleteTransactionRelations(
  ctx: MutationCtx,
  transactionId: Id<"transaction">,
) {
  const likes = await ctx.db
    .query("like")
    .withIndex("by_transactionId", (q) => q.eq("transactionId", transactionId))
    .collect();
  for (const like of likes) {
    await ctx.db.delete(like._id);
  }

  const comments = await ctx.db
    .query("comment")
    .withIndex("by_transactionId", (q) => q.eq("transactionId", transactionId))
    .collect();
  for (const comment of comments) {
    await ctx.db.delete(comment._id);
  }
}

async function approveTransactionById(
  ctx: MutationCtx & { user: { employeeId: Id<"employee"> } },
  transactionId: Id<"transaction">,
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

  if (transaction.amount <= 0) {
    return {
      transactionId: transaction._id,
      status: "failed" as const,
      code: "BAD_REQUEST" as const,
      message: "Transaction amount must be greater than zero",
    };
  }

  const transactionSourceId = String(transaction._id);
  const now = Date.now();
  const reviewedBy = ctx.user.employeeId;

  const ledgers = await ctx.db
    .query("pointLedger")
    .withIndex("by_sourceType_sourceId", (q) =>
      q.eq("sourceType", "transaction").eq("sourceId", transactionSourceId),
    )
    .collect();

  const shouldRefundSender =
    transaction.status === "pending" || transaction.status === "completed";
  const shouldClawbackReceiver = transaction.status === "completed";

  const [senderWallet, receiverWallet] = await Promise.all([
    shouldRefundSender
      ? ctx.db
          .query("wallet")
          .withIndex("by_employeeId", (q) =>
            q.eq("employeeId", transaction.senderId),
          )
          .first()
      : Promise.resolve(null),
    shouldClawbackReceiver
      ? ctx.db
          .query("wallet")
          .withIndex("by_employeeId", (q) =>
            q.eq("employeeId", transaction.receiverId),
          )
          .first()
      : Promise.resolve(null),
  ]);

  if (shouldRefundSender && !senderWallet) {
    return {
      transactionId: transaction._id,
      status: "failed" as const,
      code: "NOT_FOUND" as const,
      message: "Sender wallet not found",
    };
  }

  if (shouldClawbackReceiver && !receiverWallet) {
    return {
      transactionId: transaction._id,
      status: "failed" as const,
      code: "NOT_FOUND" as const,
      message: "Receiver wallet not found",
    };
  }

  const existingRefundLedger = ledgers.find(
    (ledger) =>
      ledger.balanceType === "giving" &&
      ledger.employeeId === transaction.senderId &&
      ledger.delta > 0,
  );
  const existingClawbackLedger = ledgers.find(
    (ledger) =>
      ledger.balanceType === "receiving" &&
      ledger.employeeId === transaction.receiverId &&
      ledger.delta < 0,
  );

  if (
    shouldClawbackReceiver &&
    receiverWallet &&
    !existingClawbackLedger &&
    receiverWallet.receivingBudget < transaction.amount
  ) {
    return {
      transactionId: transaction._id,
      status: "failed" as const,
      code: "BAD_REQUEST" as const,
      message: "ผู้รับใช้แต้มไปแล้ว ไม่สามารถลบธุรกรรมและคืนแต้มได้",
    };
  }

  if (shouldRefundSender && senderWallet && !existingRefundLedger) {
    const newGivingBudget = senderWallet.givingBudget + transaction.amount;

    await ctx.db.patch(senderWallet._id, {
      givingBudget: newGivingBudget,
    });

    await ctx.db.insert("pointLedger", {
      employeeId: transaction.senderId,
      delta: transaction.amount,
      balanceAfter: newGivingBudget,
      balanceType: "giving",
      sourceType: "transaction",
      sourceId: transactionSourceId,
      note: "คืนแต้ม: ลบธุรกรรม",
      createdAt: now,
    });
  }

  if (shouldClawbackReceiver && receiverWallet && !existingClawbackLedger) {
    const newReceivingBudget =
      receiverWallet.receivingBudget - transaction.amount;

    await ctx.db.patch(receiverWallet._id, {
      receivingBudget: newReceivingBudget,
    });
    await syncLeaderboardEntry(ctx, transaction.receiverId);

    await ctx.db.insert("pointLedger", {
      employeeId: transaction.receiverId,
      delta: -transaction.amount,
      balanceAfter: newReceivingBudget,
      balanceType: "receiving",
      sourceType: "transaction",
      sourceId: transactionSourceId,
      note: "หักแต้มคืน: ลบธุรกรรม",
      createdAt: now,
    });
  }

  await deleteTransactionRelations(ctx, transaction._id);
  await ctx.db.delete(transaction._id);

  await appendActivityLog(ctx, {
    actorEmployeeId: reviewedBy,
    subjectEmployeeId: transaction.senderId,
    type: "point_transfer_rejected",
    sourceId: transactionSourceId,
    summary: "ผู้ดูแลระบบปฏิเสธคำชมของคุณ และได้คืนแต้มแล้ว",
    meta: {
      transactionId: transactionSourceId,
      senderId: String(transaction.senderId),
      receiverId: String(transaction.receiverId),
      amount: transaction.amount,
    },
  });

  return {
    transactionId: transaction._id,
    status: "rejected" as const,
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

    const createBaseQuery: TransactionListBaseQueryFactory = (cursor) =>
      buildTransactionListBaseQuery(
        ctx,
        input.self ? ctx.user.employeeId : null,
        bounds.from,
        bounds.to,
        bounds.view,
        cursor,
      );

    return await collectFilteredEnrichedTransactionPage(
      ctx,
      createBaseQuery,
      bounds,
      input.limit,
      decodeTransactionListCursor(input.cursor ?? null),
    );
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

    const createBaseQuery: TransactionListBaseQueryFactory = (cursor) =>
      buildTransactionListBaseQuery(
        ctx,
        input.self ? ctx.user.employeeId : null,
        bounds.from,
        bounds.to,
        bounds.view,
        cursor,
      );

    const aggregated: Array<Awaited<ReturnType<typeof enrichTransaction>>> = [];
    let cursor: TransactionListCursor = null;

    while (true) {
      const { page, continueCursor, isDone } =
        await collectFilteredEnrichedTransactionPage(
          ctx,
          createBaseQuery,
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

      if (isDone || continueCursor == null) break;
      cursor = decodeTransactionListCursor(continueCursor);
    }

    return aggregated;
  });

const STANDARD_SEND_AMOUNTS = [1] as const;

export const send = authMutation
  .input(
    z.object({
      receiverId: z.string(),
      amount: z.number().int().positive(),
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

    const [wallet, receiverWallet] = await Promise.all([
      ctx.db
        .query("wallet")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", sender._id))
        .first(),
      ctx.db
        .query("wallet")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", receiver._id))
        .first(),
    ]);

    if (!wallet) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Wallet not found",
      });
    }

    if (!receiverWallet) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Receiver wallet not found",
      });
    }

    const unlimitedSend = canSendUnlimitedPoints(sender.employeeId);

    if (!unlimitedSend) {
      if (
        !(STANDARD_SEND_AMOUNTS as readonly number[]).includes(input.amount)
      ) {
        throw new CRPCError({
          code: "BAD_REQUEST",
          message: "จำนวนแต้มต้องเป็น 1 เท่านั้น",
        });
      }

      if (wallet.givingBudget < input.amount) {
        throw new CRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient giving budget",
        });
      }

      if (DAILY_SEND_LIMIT_ENABLED) {
        const daily = await getDailySendUsed({
          ctx,
          senderId: sender._id,
        });

        if (daily.alreadySentToday) {
          throw new CRPCError({
            code: "BAD_REQUEST",
            message: "วันนี้ส่งคำชมไปแล้ว ส่งได้อีกครั้งในวันพรุ่งนี้",
          });
        }
      }

      if (MONTHLY_TRANSFER_LIMIT_ENABLED) {
        const quota = await getMonthlyTransferUsed({
          ctx,
          senderId: sender._id,
          receiverId: receiver._id,
        });

        if (quota.used + input.amount > quota.cap) {
          throw new CRPCError({
            code: "BAD_REQUEST",
            message: `โอนให้พนักงานคนนี้ได้ไม่เกิน ${quota.cap} พอยต์ต่อเดือน (ใช้ไปแล้ว ${quota.used} เหลือ ${quota.remaining})`,
          });
        }
      }
    }

    const now = Date.now();
    const newGivingBudget = wallet.givingBudget - input.amount;
    const newReceivingBudget = receiverWallet.receivingBudget + input.amount;

    await ctx.db.patch(wallet._id, {
      givingBudget: newGivingBudget,
    });

    await ctx.db.patch(receiverWallet._id, {
      receivingBudget: newReceivingBudget,
    });
    await syncLeaderboardEntry(ctx, receiver._id);

    const transactionId = await ctx.db.insert("transaction", {
      senderId: sender._id,
      receiverId: receiver._id,
      amount: input.amount,
      message: input.message,
      tags: input.tags,
      status: "completed",
      reviewedBy: ctx.user.employeeId,
      reviewedAt: now,
    });

    const transactionSourceId = String(transactionId);

    await ctx.db.insert("pointLedger", {
      employeeId: sender._id,
      delta: -input.amount,
      balanceAfter: newGivingBudget,
      balanceType: "giving",
      sourceType: "transaction",
      sourceId: transactionSourceId,
      note: `Sent to ${localizedLabel(receiver.name, "th")}`,
      createdAt: now,
    });

    await ctx.db.insert("pointLedger", {
      employeeId: receiver._id,
      delta: input.amount,
      balanceAfter: newReceivingBudget,
      balanceType: "receiving",
      sourceType: "transaction",
      sourceId: transactionSourceId,
      note: `Received from ${sender._id}`,
      createdAt: now,
    });

    await appendActivityLog(ctx, {
      actorEmployeeId: sender._id,
      subjectEmployeeId: receiver._id,
      type: "point_transfer_sent",
      sourceId: String(transactionId),
      summary: `โอน ${input.amount} พอยต์ให้ ${localizedLabel(receiver.name, "th")}`,
      meta: {
        transactionId: String(transactionId),
        senderId: String(sender._id),
        receiverId: String(receiver._id),
        amount: input.amount,
        receiverName: localizedLabel(receiver.name, "th"),
        ...(unlimitedSend ? { adminBypass: true } : {}),
      },
    });

    return transactionId;
  });

export const approve = authMutation
  .input(
    z.object({
      transactionId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const result = await approveTransactionById(
      ctx,
      input.transactionId as Id<"transaction">,
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
    }),
  )
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const uniqueTransactionIds = Array.from(new Set(input.transactionIds));
    // ต้องทำทีละรายการ — ห้าม Promise.all เพราะหลาย tx ของ receiver/sender
    // คนเดียวกันจะอ่าน wallet ฉบับเดียวกันแล้ว patch ทับกัน (last write wins)
    const results: ApproveTransactionResult[] = [];
    for (const transactionId of uniqueTransactionIds) {
      results.push(
        await approveTransactionById(ctx, transactionId as Id<"transaction">),
      );
    }

    const rejectedCount = results.filter(
      (item) => item.status === "rejected",
    ).length;
    const failedCount = results.filter(
      (item) => item.status === "failed",
    ).length;

    return {
      total: uniqueTransactionIds.length,
      rejectedCount,
      failedCount,
      results,
    };
  });

export const feeds = authQuery
  .input(
    z.object({
      scope: z.enum(["mine", "team"]).optional().default("mine"),
      view: z.enum(["all", "sent", "received"]).optional().default("all"),
      q: z.string().optional().nullable(),
      min: z.number().optional().nullable(),
      max: z.number().optional().nullable(),
      from: z.number().optional().nullable(),
      to: z.number().optional().nullable(),
    }),
  )
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
        employeeId: z.string(),
        name: zLocalizedString,
        department: zLocalizedString,
        position: zLocalizedString,
        rank: z.string(),
        division: z.string(),
        image: z.string().nullable(),
      }),
      receiver: z.object({
        _id: z.custom<Id<"employee">>(),
        employeeId: z.string(),
        name: zLocalizedString,
        department: zLocalizedString,
        position: zLocalizedString,
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
            employeeId: z.string(),
            name: zLocalizedString,
            department: zLocalizedString,
            position: zLocalizedString,
            rank: z.string(),
            division: z.string(),
            image: z.string().nullable(),
          }),
        }),
      ),
    }),
  })
  .query(async ({ ctx, input }) => {
    const bounds: FeedFilterBounds = {
      query: input.q?.trim().toLowerCase() ?? "",
      min: input.min ?? null,
      max: input.max ?? null,
      from: input.from ?? null,
      to: input.to ?? null,
    };

    assertTransactionListRanges(bounds.min, bounds.max, bounds.from, bounds.to);

    const scope = input.scope ?? "mine";
    const viewerBusinessCode = normalizeText(ctx.user.employee.employeeId, 5);

    const {
      page: transactions,
      nextCursor,
      exhausted,
    } = scope === "team"
      ? await collectTeamCompletedFeedPage(
          ctx,
          viewerBusinessCode,
          input.limit,
          decodeTeamFeedsCursor(input.cursor),
          input.view,
          bounds,
        )
      : await collectMyCompletedFeedPage(
          ctx,
          ctx.user.employeeId,
          input.limit,
          decodeFeedsCursor(input.cursor),
          input.view,
          bounds,
        );

    const txMeta = await Promise.all(
      transactions.map(async (tx) => {
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
                _id: sender._id,
                employeeId: sender.employeeId,
                name: coerceLocalized(sender.name),
                department: coerceLocalized(sender.department),
                position: coerceLocalized(sender.position),
                rank: rankAsString(sender.rank),
                division: sender.division,
                image: userImageByEmployeeId.get(sender._id) ?? null,
              },
              receiver: {
                _id: receiver._id,
                employeeId: receiver.employeeId,
                name: coerceLocalized(receiver.name),
                department: coerceLocalized(receiver.department),
                position: coerceLocalized(receiver.position),
                rank: rankAsString(receiver.rank),
                division: receiver.division,
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
                      employeeId: author.employeeId,
                      name: coerceLocalized(author.name),
                      department: coerceLocalized(author.department),
                      position: coerceLocalized(author.position),
                      rank: rankAsString(author.rank),
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
      isDone: exhausted,
      continueCursor:
        exhausted || nextCursor == null
          ? null
          : scope === "team"
            ? encodeTeamFeedsCursor(nextCursor as TeamFeedsCursor)
            : encodeFeedsCursor(nextCursor as FeedsCursor),
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

    const now = Date.now();
    const commentId = await ctx.db.insert("comment", {
      employeeId: employee._id,
      transactionId,
      content: input.content,
      createdAt: now,
    });

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
        name: coerceLocalized(employee.name),
        department: coerceLocalized(employee.department),
        position: coerceLocalized(employee.position),
        rank: rankAsString(employee.rank),
        division: employee.division,
        image: user?.image ?? null,
      },
    };
  });

const emptyDailyQuota = {
  dailyEnabled: false as const,
  alreadySentToday: false,
  dailyCap: DAILY_SEND_CAP,
  dailyRemaining: DAILY_SEND_CAP,
  dayStart: null as number | null,
  dayEnd: null as number | null,
};

export const getMonthlyTransferQuota = authQuery
  .input(
    z.object({
      receiverId: z.string().min(1),
    }),
  )
  .query(async ({ ctx, input }) => {
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

    const unlimited = Boolean(
      sender && canSendUnlimitedPoints(sender.employeeId),
    );

    const daily =
      sender && !unlimited && DAILY_SEND_LIMIT_ENABLED
        ? await getDailySendUsed({
            ctx,
            senderId: sender._id,
          })
        : null;

    const dailyFields = daily
      ? {
          dailyEnabled: true as const,
          alreadySentToday: daily.alreadySentToday,
          dailyCap: daily.cap,
          dailyRemaining: daily.remaining,
          dayStart: daily.dayStart,
          dayEnd: daily.dayEnd,
        }
      : emptyDailyQuota;

    if (unlimited || !MONTHLY_TRANSFER_LIMIT_ENABLED) {
      return {
        enabled: false as const,
        cap: MONTHLY_TRANSFER_CAP_PER_RECEIVER,
        used: 0,
        remaining: MONTHLY_TRANSFER_CAP_PER_RECEIVER,
        monthStart: null as number | null,
        monthEnd: null as number | null,
        receiverName: receiver?.name ?? null,
        ...dailyFields,
      };
    }

    if (!sender || !receiver) {
      return {
        enabled: true as const,
        cap: MONTHLY_TRANSFER_CAP_PER_RECEIVER,
        used: 0,
        remaining: MONTHLY_TRANSFER_CAP_PER_RECEIVER,
        monthStart: null as number | null,
        monthEnd: null as number | null,
        receiverName: receiver?.name ?? null,
        ...dailyFields,
      };
    }

    const quota = await getMonthlyTransferUsed({
      ctx,
      senderId: sender._id,
      receiverId: receiver._id,
    });

    return {
      enabled: true as const,
      ...quota,
      receiverName: receiver.name,
      ...dailyFields,
    };
  });

export const getMonthlyQuestProgress = authQuery
  .input(
    z.object({
      /** @deprecated ใช้ขอบเดือนไทยฝั่งเซิร์ฟเวอร์ — คงไว้เพื่อไม่พัง client เก่า */
      monthStart: z.number().optional(),
    }),
  )
  .query(async ({ ctx }) => {
    const { start, end } = thaiMonthRange();
    const sentTransactions = await ctx.db
      .query("transaction")
      .withIndex("by_senderId", (q) =>
        q.eq("senderId", ctx.user.employeeId as Id<"employee">),
      )
      .collect();

    const count = sentTransactions.filter((transaction) => {
      if (transaction.status !== "completed") return false;
      const ts = transactionTimestamp(transaction);
      return ts >= start && ts < end;
    }).length;

    return {
      count: Math.min(count, MONTHLY_QUEST_GOAL),
      goal: MONTHLY_QUEST_GOAL,
      reward: MONTHLY_QUEST_REWARD_PER_GIVE,
      isComplete: count >= MONTHLY_QUEST_GOAL,
    };
  });
