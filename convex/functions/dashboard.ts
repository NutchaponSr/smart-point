import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { requireAdmin } from "../lib/auth-helper";
import { authQuery } from "../lib/crpc";
import { localizedLabel } from "../lib/localized";

import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

/** กันช่วงเวลากว้างเกินจนสแกนหนัก — จำกัด 31 วัน */
const MAX_RANGE_MS = 31 * 24 * 60 * 60 * 1000;

const rangeInput = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  /** BU / สังกัด — ไม่ส่ง = ทุกสังกัด */
  division: z.string().optional().nullable(),
  locale: z.enum(["th", "en"]).optional(),
});

type DashboardLocale = "th" | "en";

function assertRange(start: number, end: number) {
  if (end <= start || end - start > MAX_RANGE_MS) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "ช่วงวันที่ไม่ถูกต้อง",
    });
  }
}

function appLocale(value: string | null | undefined): DashboardLocale {
  return value === "en" ? "en" : "th";
}

function unknownLabel(locale: DashboardLocale) {
  return locale === "en" ? "Unknown" : "ไม่ระบุ";
}

function selectedDivision(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function employeeIdsInDivision(ctx: QueryCtx, division: string | null) {
  if (!division) return null;
  // eslint-disable-next-line @convex-dev/no-query-collect -- one affiliation
  const employees = await ctx.db
    .query("employee")
    .withIndex("by_division_employeeId", (q) => q.eq("division", division))
    .collect();
  return new Set(employees.map((employee) => String(employee._id)));
}

function belongsToDivision(
  employeeIds: Set<string> | null,
  employeeId: string,
) {
  return employeeIds == null || employeeIds.has(employeeId);
}

/**
 * KPI แดชบอร์ดแอดมิน (Section 1) ตามช่วงวันที่เลือกจากปฏิทิน
 * client ส่ง [start, end) เป็น ms — ห้ามใช้ Date.now() ใน query
 */
export const getKpis = authQuery
  .input(rangeInput)
  .query(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const { start, end } = input;
    assertRange(start, end);
    const divisionIds = await employeeIdsInDivision(
      ctx,
      selectedDivision(input.division),
    );

    const [wallets, transactions, ledgerRows, participants, redemptions] =
      await Promise.all([
        // จำนวนแถว = จำนวนพนักงาน — ใช้หา login วันนั้นจาก lastDailyBonus
        // eslint-disable-next-line @convex-dev/no-query-collect -- bounded by employee count
        ctx.db
          .query("wallet")
          .collect(),
        ctx.db
          .query("transaction")
          .withIndex("by_creation_time", (q) =>
            q.gte("_creationTime", start).lt("_creationTime", end),
          )
          .collect(),
        ctx.db
          .query("pointLedger")
          .withIndex("by_creation_time", (q) =>
            q.gte("_creationTime", start).lt("_creationTime", end),
          )
          .collect(),
        ctx.db
          .query("activityParticipant")
          .withIndex("by_creation_time", (q) =>
            q.gte("_creationTime", start).lt("_creationTime", end),
          )
          .collect(),
        ctx.db
          .query("redemption")
          .withIndex("by_creation_time", (q) =>
            q.gte("_creationTime", start).lt("_creationTime", end),
          )
          .collect(),
      ]);

    // 1. จำนวนคนที่ first login แล้ว (สะสมทั้งหมด ไม่กรองตามวัน)
    //    lastDailyBonus ถูกตั้งครั้งแรกตอน dailyLogin และไม่ถูกล้างตอนรีเซ็ต
    const scopedWallets = wallets.filter((wallet) =>
      belongsToDivision(divisionIds, String(wallet.employeeId)),
    );
    const firstLoginCount = scopedWallets.filter(
      (w) => w.lastDailyBonus != null,
    ).length;

    // 2. คะแนนคำชม P2P ที่ส่งในช่วงวัน (ไม่นับที่ถูกปฏิเสธ)
    const praisePoints = transactions
      .filter(
        (t) =>
          t.status !== "rejected" &&
          belongsToDivision(divisionIds, String(t.senderId)),
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // 2b. คะแนนจากกิจกรรมที่จ่ายในช่วงวัน (ledger sourceType "activity")
    const eventPoints = ledgerRows
      .filter(
        (row) =>
          row.sourceType === "activity" &&
          row.delta > 0 &&
          belongsToDivision(divisionIds, String(row.employeeId)),
      )
      .reduce((sum, row) => sum + row.delta, 0);

    // 3. พนักงานที่สมัคร/เข้าร่วมกิจกรรมในช่วงวัน (นับคนไม่ซ้ำ ไม่นับยกเลิก)
    const eventParticipantCount = new Set(
      participants
        .filter(
          (p) =>
            p.status !== "cancelled" &&
            belongsToDivision(divisionIds, String(p.employeeId)),
        )
        .map((p) => String(p.employeeId)),
    ).size;

    // 4. จำนวนรางวัลที่แลกในช่วงวัน (รวม quantity ไม่นับยกเลิก)
    const activeRedemptions = redemptions.filter(
      (r) =>
        r.status !== "cancelled" &&
        belongsToDivision(divisionIds, String(r.employeeId)),
    );
    const redeemedItemCount = activeRedemptions.reduce(
      (sum, r) => sum + r.quantity,
      0,
    );
    const redeemedPoints = activeRedemptions.reduce(
      (sum, r) => sum + r.pointSpent,
      0,
    );

    return {
      login: {
        firstLoginCount,
        totalEmployees: divisionIds ? divisionIds.size : wallets.length,
      },
      praise: {
        total: praisePoints + eventPoints,
        praisePoints,
        eventPoints,
      },
      events: {
        participantCount: eventParticipantCount,
      },
      rewards: {
        redeemedItemCount,
        redeemedPoints,
        redemptionCount: activeRedemptions.length,
      },
    };
  });

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_AFFILIATION_LIMIT = 9;

/**
 * สถิติการมีส่วนร่วม (Section 2)
 * 1. แนวโน้มรายวัน แยกคะแนนคำชม กับคะแนนจากกิจกรรม
 * 2. สังกัดที่ส่งคำชมมากที่สุด (นับคน)
 * 3. สังกัดที่เข้าร่วมกิจกรรมมากที่สุด (นับคน)
 */
export const getCultureStats = authQuery
  .input(rangeInput)
  .query(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const { start, end } = input;
    assertRange(start, end);
    const locale = appLocale(input.locale);
    const divisionIds = await employeeIdsInDivision(
      ctx,
      selectedDivision(input.division),
    );
    const missing = unknownLabel(locale);

    const [transactions, ledgerRows, participants] = await Promise.all([
      ctx.db
        .query("transaction")
        .withIndex("by_creation_time", (q) =>
          q.gte("_creationTime", start).lt("_creationTime", end),
        )
        .collect(),
      ctx.db
        .query("pointLedger")
        .withIndex("by_creation_time", (q) =>
          q.gte("_creationTime", start).lt("_creationTime", end),
        )
        .collect(),
      ctx.db
        .query("activityParticipant")
        .withIndex("by_creation_time", (q) =>
          q.gte("_creationTime", start).lt("_creationTime", end),
        )
        .collect(),
    ]);

    const sent = transactions.filter(
      (row) =>
        row.status !== "rejected" &&
        belongsToDivision(divisionIds, String(row.senderId)),
    );
    const activityAwards = ledgerRows.filter(
      (row) =>
        row.sourceType === "activity" &&
        row.delta > 0 &&
        belongsToDivision(divisionIds, String(row.employeeId)),
    );
    const joined = participants.filter(
      (row) =>
        row.status !== "cancelled" &&
        belongsToDivision(divisionIds, String(row.employeeId)),
    );

    const dayCount = Math.ceil((end - start) / DAY_MS);
    const trend = Array.from({ length: dayCount }, (_, index) => ({
      date: start + index * DAY_MS,
      praisePoints: 0,
      praiseCount: 0,
      activityPoints: 0,
    }));
    for (const row of sent) {
      const bucket = trend[Math.floor((row._creationTime - start) / DAY_MS)];
      if (!bucket) continue;
      bucket.praiseCount += 1;
      bucket.praisePoints += row.amount;
    }
    for (const row of activityAwards) {
      const bucket = trend[Math.floor((row._creationTime - start) / DAY_MS)];
      if (!bucket) continue;
      bucket.activityPoints += row.delta;
    }

    const divisionByEmployee = new Map<string, string>();
    const divisionOf = async (employeeId: Id<"employee">) => {
      const key = String(employeeId);
      const cached = divisionByEmployee.get(key);
      if (cached != null) return cached;
      const employee = await ctx.db.get(employeeId);
      const division = employee?.division?.trim() || missing;
      divisionByEmployee.set(key, division);
      return division;
    };

    const praiseByAffiliation = new Map<
      string,
      { affiliation: string; people: Set<string>; sends: number; points: number }
    >();
    for (const row of sent) {
      const affiliation = await divisionOf(row.senderId);
      const entry = praiseByAffiliation.get(affiliation) ?? {
        affiliation,
        people: new Set<string>(),
        sends: 0,
        points: 0,
      };
      entry.people.add(String(row.senderId));
      entry.sends += 1;
      entry.points += row.amount;
      praiseByAffiliation.set(affiliation, entry);
    }

    const activityByAffiliation = new Map<
      string,
      { affiliation: string; people: Set<string> }
    >();
    for (const row of joined) {
      const affiliation = await divisionOf(row.employeeId);
      const entry = activityByAffiliation.get(affiliation) ?? {
        affiliation,
        people: new Set<string>(),
      };
      entry.people.add(String(row.employeeId));
      activityByAffiliation.set(affiliation, entry);
    }

    const praiseAffiliations = [...praiseByAffiliation.values()]
      .map((row) => ({
        affiliation: row.affiliation,
        people: row.people.size,
        sends: row.sends,
        points: row.points,
      }))
      .sort((a, b) => b.people - a.people)
      .slice(0, TOP_AFFILIATION_LIMIT);

    const activityAffiliations = [...activityByAffiliation.values()]
      .map((row) => ({
        affiliation: row.affiliation,
        people: row.people.size,
      }))
      .sort((a, b) => b.people - a.people)
      .slice(0, TOP_AFFILIATION_LIMIT);

    return { trend, praiseAffiliations, activityAffiliations };
  });

const TOP_REWARD_LIMIT = 5;
const REALTIME_FEED_LIMIT = 10;

const POINT_BUCKETS = [
  { label: "<10", min: 0, max: 10, color: "#1cb0f6" },
  { label: "10-25", min: 10, max: 26, color: "#ce82ff" },
  { label: "50-75", min: 50, max: 76, color: "#58cc02" },
  { label: "100-150", min: 100, max: 151, color: "#ff9600" },
  { label: "200+", min: 200, max: Number.POSITIVE_INFINITY, color: "#ff4b4b" },
] as const;

type PointBucketLabel = (typeof POINT_BUCKETS)[number]["label"];

function bucketLabel(amount: number): PointBucketLabel {
  for (const bucket of POINT_BUCKETS) {
    if (amount >= bucket.min && amount < bucket.max) return bucket.label;
  }
  // ช่วงที่ไม่อยู่ใน bucket หลัก (เช่น 26-49, 76-99) → รวมเข้าใกล้สุด
  if (amount < 50) return "10-25";
  if (amount < 100) return "50-75";
  if (amount < 200) return "100-150";
  return "200+";
}

/**
 * ผลลัพธ์ Pre-order / CSR / feed (Section 3)
 * 1. Top 5 รางวัลที่แลกบ่อยสุด
 * 2. การกระจายคะแนนปัจจุบันใน wallet (receiving + special)
 * 3. ยอดบริจาคในช่วงวัน
 * 4. คำชมล่าสุดในช่วงวัน
 */
export const getOutcomeStats = authQuery
  .input(rangeInput)
  .query(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const { start, end } = input;
    assertRange(start, end);
    const locale = appLocale(input.locale);
    const divisionIds = await employeeIdsInDivision(
      ctx,
      selectedDivision(input.division),
    );
    const missing = unknownLabel(locale);

    const [redemptions, transactions, donations, wallets] = await Promise.all([
      ctx.db
        .query("redemption")
        .withIndex("by_creation_time", (q) =>
          q.gte("_creationTime", start).lt("_creationTime", end),
        )
        .collect(),
      ctx.db
        .query("transaction")
        .withIndex("by_creation_time", (q) =>
          q.gte("_creationTime", start).lt("_creationTime", end),
        )
        .collect(),
      ctx.db
        .query("donation")
        .withIndex("by_creation_time", (q) =>
          q.gte("_creationTime", start).lt("_creationTime", end),
        )
        .collect(),
      // eslint-disable-next-line @convex-dev/no-query-collect -- bounded by employee count
      ctx.db
        .query("wallet")
        .collect(),
    ]);

    // 1. Top 5 รางวัลที่แลกบ่อยสุด (รวม quantity ไม่นับยกเลิก)
    const rewardStats = new Map<
      string,
      { rewardId: string; quantity: number; points: number }
    >();
    for (const row of redemptions) {
      if (row.status === "cancelled") continue;
      if (!belongsToDivision(divisionIds, String(row.employeeId))) continue;
      const key = String(row.rewardId);
      const entry = rewardStats.get(key) ?? {
        rewardId: key,
        quantity: 0,
        points: 0,
      };
      entry.quantity += row.quantity;
      entry.points += row.pointSpent;
      rewardStats.set(key, entry);
    }

    const topRewardRows = [...rewardStats.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, TOP_REWARD_LIMIT);

    const topRewards = await Promise.all(
      topRewardRows.map(async (row) => {
        const reward = await ctx.db.get(row.rewardId as Id<"reward">);
        return {
          rewardId: row.rewardId,
          name: reward ? localizedLabel(reward.name, locale) : missing,
          quantity: row.quantity,
          points: row.points,
        };
      }),
    );

    // 2. การกระจายคะแนนปัจจุบัน — receiving + special ต่อคน (ไม่กรองตามวัน)
    const distribution = POINT_BUCKETS.map((bucket) => ({
      label: bucket.label,
      count: 0,
      color: bucket.color,
    }));
    const distributionIndex = new Map(
      distribution.map((row, index) => [row.label, index]),
    );
    for (const wallet of wallets) {
      if (!belongsToDivision(divisionIds, String(wallet.employeeId))) continue;
      const balance = wallet.receivingBudget + (wallet.specialBudget ?? 0);
      const label = bucketLabel(balance);
      const index = distributionIndex.get(label);
      if (index == null) continue;
      const row = distribution[index];
      if (row) row.count += 1;
    }

    // 3. ยอดบริจาคในช่วงวัน (1 พอยต์ = 1 บาท)
    const scopedDonations = donations.filter((row) =>
      belongsToDivision(divisionIds, String(row.donorEmployeeId)),
    );
    const donationPoints = scopedDonations.reduce(
      (sum, row) => sum + row.points,
      0,
    );

    // 4. คำชมล่าสุดในช่วงวัน (เรียงใหม่ → เก่า)
    const sent = transactions.filter(
      (row) =>
        row.status !== "rejected" &&
        belongsToDivision(divisionIds, String(row.senderId)),
    );
    const recent = [...sent]
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, REALTIME_FEED_LIMIT);

    const recentTransactions = await Promise.all(
      recent.map(async (t) => {
        const [sender, receiver] = await Promise.all([
          ctx.db.get(t.senderId),
          ctx.db.get(t.receiverId),
        ]);
        return {
          id: t._id,
          amount: t.amount,
          message: t.message,
          tags: t.tags,
          createdAt: t._creationTime,
          sender: {
            name: sender ? localizedLabel(sender.name, locale) : missing,
            department: sender
              ? localizedLabel(sender.department, locale)
              : missing,
            affiliation: sender?.division?.trim() || missing,
          },
          receiver: {
            name: receiver ? localizedLabel(receiver.name, locale) : missing,
            department: receiver
              ? localizedLabel(receiver.department, locale)
              : missing,
            affiliation: receiver?.division?.trim() || missing,
          },
        };
      }),
    );

    return {
      topRewards,
      distribution,
      donation: {
        points: donationPoints,
        baht: donationPoints,
        count: scopedDonations.length,
      },
      recentTransactions,
    };
  });
