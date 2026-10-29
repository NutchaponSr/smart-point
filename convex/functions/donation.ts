import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { requireAdmin } from "../lib/auth-helper";
import { appendActivityLog } from "../lib/activity-log";
import { authMutation, authQuery } from "../lib/crpc";
import { syncLeaderboardEntry } from "../lib/leaderboard-entry";
import {
  coerceLocalized,
  localizedLabel,
  localizedSearchText,
  type LocalizedString,
} from "../lib/localized";
import { UNLIMITED_POINT_SEND_EMPLOYEE_ID } from "../lib/point-send-privileges";
import { getWalletOrThrow, splitRedeemCost } from "../lib/points";
import { assertRedemptionOpen, GIVING_BUDGET } from "../lib/program-rules";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./generated/server";

const MAX_EXPORT_ROWS = 10_000;
const EXPORT_PAGE_SIZE = 100;

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

function donationInPointRange(
  points: number,
  min: number | null,
  max: number | null,
): boolean {
  if (min != null && min > 0 && points < min) return false;
  if (max != null && max > 0 && points > max) return false;
  return true;
}

function donationInDateRange(
  row: Doc<"donation">,
  from: number | null,
  to: number | null,
): boolean {
  const ts = row.createdAt ?? row._creationTime;
  if (from != null && ts < from) return false;
  if (to != null && ts > to) return false;
  return true;
}

async function resolveDonorDocId(
  ctx: MutationCtx | QueryCtx,
  publicEmployeeId: string,
): Promise<Id<"employee"> | null> {
  const trimmed = publicEmployeeId.trim();
  if (trimmed === "") return null;

  const employee = await ctx.db
    .query("employee")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", trimmed))
    .unique();

  return employee?._id ?? null;
}

type DonationAdminRow = {
  _id: Id<"donation">;
  employeeId: string;
  donorName: LocalizedString;
  department: LocalizedString;
  division: string;
  points: number;
  bahtAmount: number;
  createdAt: number;
};

type ScanCursor = { db: string | null; skip: number };

function assertDonationDateRange(
  from: number | null,
  to: number | null,
): void {
  if (from != null && to != null && from > to) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "Start date cannot be greater than end date",
    });
  }
}

function decodeScanCursor(raw: string | null | undefined): ScanCursor {
  if (raw == null || raw === "") return { db: null, skip: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<ScanCursor>;
    if (
      (parsed.db === null || typeof parsed.db === "string") &&
      typeof parsed.skip === "number"
    ) {
      return { db: parsed.db ?? null, skip: Math.max(0, parsed.skip) };
    }
  } catch {
    // cursor ที่อ่านไม่ได้ให้เริ่มใหม่
  }
  return { db: null, skip: 0 };
}

function donorMatchesQuery(
  donor: Doc<"employee">,
  normalizedQuery: string,
): boolean {
  if (normalizedQuery === "") return true;
  const haystack =
    `${localizedSearchText(donor.name)} ${donor.employeeId}`.toLowerCase();
  return haystack.includes(normalizedQuery);
}

function toDonationAdminRow(
  row: Doc<"donation">,
  donor: Doc<"employee">,
): DonationAdminRow {
  return {
    _id: row._id,
    employeeId: donor.employeeId,
    donorName: coerceLocalized(donor.name),
    department: coerceLocalized(donor.department),
    division: donor.division,
    points: row.points,
    bahtAmount: row.bahtAmount,
    createdAt: row.createdAt ?? row._creationTime,
  };
}

async function paginateDonations(
  ctx: MutationCtx | QueryCtx,
  donorDocId: Id<"employee"> | null,
  cursor: string | null,
) {
  if (donorDocId != null) {
    return await ctx.db
      .query("donation")
      .withIndex("by_donorEmployeeId", (q) =>
        q.eq("donorEmployeeId", donorDocId),
      )
      .order("desc")
      .paginate({ cursor, numItems: EXPORT_PAGE_SIZE });
  }

  return await ctx.db
    .query("donation")
    .order("desc")
    .paginate({ cursor, numItems: EXPORT_PAGE_SIZE });
}

async function readDonationPage(
  ctx: MutationCtx | QueryCtx,
  input: {
    normalizedQuery: string;
    dateFrom: number | null;
    dateTo: number | null;
    minPoints: number | null;
    maxPoints: number | null;
    donorDocId: Id<"employee"> | null;
    limit: number;
    cursor: string | null;
  },
) {
  let scan = decodeScanCursor(input.cursor);
  const page: DonationAdminRow[] = [];

  while (true) {
    const result = await paginateDonations(ctx, input.donorDocId, scan.db);
    const donors = await Promise.all(
      result.page.map((row) => ctx.db.get(row.donorEmployeeId)),
    );

    for (let i = scan.skip; i < result.page.length; i++) {
      const row = result.page[i];
      const donor = donors[i];
      if (row == null || donor == null) continue;
      if (!donationInDateRange(row, input.dateFrom, input.dateTo)) continue;
      if (!donationInPointRange(row.points, input.minPoints, input.maxPoints)) {
        continue;
      }
      if (!donorMatchesQuery(donor, input.normalizedQuery)) continue;

      if (page.length === input.limit) {
        return {
          page,
          continueCursor: JSON.stringify({
            db: scan.db,
            skip: i,
          } satisfies ScanCursor),
          hasNextPage: true,
          isDone: false,
        };
      }

      page.push(toDonationAdminRow(row, donor));
    }

    if (
      result.isDone ||
      result.continueCursor == null ||
      result.continueCursor === scan.db
    ) {
      return {
        page,
        continueCursor: null,
        hasNextPage: false,
        isDone: true,
      };
    }

    scan = { db: result.continueCursor, skip: 0 };
  }
}

const donationListInput = {
  q: z.string().optional().nullable(),
  min: z.number().optional().nullable(),
  max: z.number().optional().nullable(),
  from: z.number().nullish(),
  to: z.number().nullish(),
  by: z.string().optional().nullable(),
};

async function resolveDonationListScope(
  ctx: MutationCtx | QueryCtx,
  input: {
    q?: string | null;
    min?: number | null;
    max?: number | null;
    from?: number | null;
    to?: number | null;
    by?: string | null;
  },
) {
  const dateFrom = input.from ?? null;
  const dateTo = input.to ?? null;
  const minPoints = input.min ?? null;
  const maxPoints = input.max ?? null;
  assertDonationDateRange(dateFrom, dateTo);
  if (
    minPoints != null &&
    maxPoints != null &&
    minPoints > 0 &&
    maxPoints > 0 &&
    minPoints > maxPoints
  ) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "Minimum amount cannot be greater than maximum amount",
    });
  }

  const trimmedBy = input.by?.trim() ?? "";
  const donorDocId =
    trimmedBy === "" ? null : await resolveDonorDocId(ctx, trimmedBy);

  return {
    normalizedQuery: input.q?.trim().toLowerCase() ?? "",
    dateFrom,
    dateTo,
    minPoints,
    maxPoints,
    donorDocId,
    missingDonor: trimmedBy !== "" && donorDocId == null,
  };
}

/** รายการบริจาคสำหรับแอดมิน ตามคำค้น รหัสพนักงาน และช่วงวัน */
export const getManyAdmin = authQuery
  .input(
    z.object({
      ...donationListInput,
      limit: z.number().min(1).max(100),
      cursor: z.string().nullish(),
    }),
  )
  .query(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const scope = await resolveDonationListScope(ctx, input);
    if (scope.missingDonor) {
      return {
        page: [] as DonationAdminRow[],
        continueCursor: null,
        hasNextPage: false,
        isDone: true,
      };
    }

    return await readDonationPage(ctx, {
      normalizedQuery: scope.normalizedQuery,
      dateFrom: scope.dateFrom,
      dateTo: scope.dateTo,
      minPoints: scope.minPoints,
      maxPoints: scope.maxPoints,
      donorDocId: scope.donorDocId,
      limit: input.limit,
      cursor: input.cursor ?? null,
    });
  });

/** ส่งออกบริจาคทั้งหมดที่ตรงตัวกรองเดียวกับ getManyAdmin */
export const exportAll = authMutation
  .input(z.object(donationListInput))
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const scope = await resolveDonationListScope(ctx, input);
    if (scope.missingDonor) return [] as DonationAdminRow[];

    const rows: DonationAdminRow[] = [];
    let cursor: string | null = null;

    while (true) {
      const batch = await readDonationPage(ctx, {
        normalizedQuery: scope.normalizedQuery,
        dateFrom: scope.dateFrom,
        dateTo: scope.dateTo,
        minPoints: scope.minPoints,
        maxPoints: scope.maxPoints,
        donorDocId: scope.donorDocId,
        limit: EXPORT_PAGE_SIZE,
        cursor,
      });
      rows.push(...batch.page);
      if (rows.length > MAX_EXPORT_ROWS) {
        throw new CRPCError({
          code: "BAD_REQUEST",
          message: `พบข้อมูลมากเกิน ${MAX_EXPORT_ROWS} รายการ กรุณาใช้ตัวกรองให้แคบลง`,
        });
      }
      if (!batch.hasNextPage || batch.continueCursor == null) break;
      cursor = batch.continueCursor;
    }

    return rows;
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
