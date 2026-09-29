import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { requireAdmin } from "../lib/auth-helper";
import { authQuery } from "../lib/crpc";
import { localizedLabel } from "../lib/localized";

import type { Id } from "./_generated/dataModel";

/** กันช่วงเวลากว้างเกินจนสแกนหนัก — จำกัด 31 วัน */
const MAX_RANGE_MS = 31 * 24 * 60 * 60 * 1000;

/**
 * KPI แดชบอร์ดแอดมิน (Section 1) ตามช่วงวันที่เลือกจากปฏิทิน
 * client ส่ง [start, end) เป็น ms — ห้ามใช้ Date.now() ใน query
 */
export const getKpis = authQuery
  .input(
    z.object({
      start: z.number().int().nonnegative(),
      end: z.number().int().nonnegative(),
    }),
  )
  .query(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const { start, end } = input;
    if (end <= start || end - start > MAX_RANGE_MS) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "ช่วงวันที่ไม่ถูกต้อง",
      });
    }

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
    const firstLoginCount = wallets.filter(
      (w) => w.lastDailyBonus != null,
    ).length;

    // 2. คะแนนคำชม P2P ที่ส่งในช่วงวัน (ไม่นับที่ถูกปฏิเสธ)
    const praisePoints = transactions
      .filter((t) => t.status !== "rejected")
      .reduce((sum, t) => sum + t.amount, 0);

    // 2b. คะแนนจากกิจกรรมที่จ่ายในช่วงวัน (ledger sourceType "activity")
    const eventPoints = ledgerRows
      .filter((row) => row.sourceType === "activity" && row.delta > 0)
      .reduce((sum, row) => sum + row.delta, 0);

    // 3. พนักงานที่สมัคร/เข้าร่วมกิจกรรมในช่วงวัน (นับคนไม่ซ้ำ ไม่นับยกเลิก)
    const eventParticipantCount = new Set(
      participants
        .filter((p) => p.status !== "cancelled")
        .map((p) => String(p.employeeId)),
    ).size;

    // 4. จำนวนรางวัลที่แลกในช่วงวัน (รวม quantity ไม่นับยกเลิก)
    const activeRedemptions = redemptions.filter(
      (r) => r.status !== "cancelled",
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
        totalEmployees: wallets.length,
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
const TOP_DEPARTMENT_LIMIT = 6;

/**
 * สถิติวัฒนธรรมองค์กร (Section 2)
 * 1. แนวโน้มการส่งคำชมรายวัน (จำนวนครั้ง + คะแนน)
 * 2. แผนกที่ส่งคำชมบ่อยที่สุด
 * client ส่ง start ที่เที่ยงคืนตามเวลาท้องถิ่น — bucket = start + k วัน
 */
export const getCultureStats = authQuery
  .input(
    z.object({
      start: z.number().int().nonnegative(),
      end: z.number().int().nonnegative(),
    }),
  )
  .query(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const { start, end } = input;
    if (end <= start || end - start > MAX_RANGE_MS) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "ช่วงวันที่ไม่ถูกต้อง",
      });
    }

    const transactions = await ctx.db
      .query("transaction")
      .withIndex("by_creation_time", (q) =>
        q.gte("_creationTime", start).lt("_creationTime", end),
      )
      .collect();

    const sent = transactions.filter((t) => t.status !== "rejected");

    // 1. แนวโน้มรายวัน — bucket ตามวันที่ client จัดให้ตรงเที่ยงคืนท้องถิ่น
    const dayCount = Math.ceil((end - start) / DAY_MS);
    const trend = Array.from({ length: dayCount }, (_, index) => ({
      date: start + index * DAY_MS,
      count: 0,
      points: 0,
    }));
    for (const t of sent) {
      const bucket = Math.floor((t._creationTime - start) / DAY_MS);
      const row = trend[bucket];
      if (!row) continue;
      row.count += 1;
      row.points += t.amount;
    }

    // 2. แผนกผู้ส่งที่ส่งคำชมบ่อยสุด — แคช department ต่อ sender
    const departmentBySender = new Map<string, string>();
    const departmentStats = new Map<
      string,
      { department: string; count: number; points: number }
    >();

    for (const t of sent) {
      const senderKey = String(t.senderId);
      let department = departmentBySender.get(senderKey);
      if (department == null) {
        const sender = await ctx.db.get(t.senderId);
        department = sender ? localizedLabel(sender.department, "th") : "ไม่ระบุ";
        departmentBySender.set(senderKey, department);
      }

      const entry = departmentStats.get(department) ?? {
        department,
        count: 0,
        points: 0,
      };
      entry.count += 1;
      entry.points += t.amount;
      departmentStats.set(department, entry);
    }

    const topDepartments = [...departmentStats.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_DEPARTMENT_LIMIT);

    return { trend, topDepartments };
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
  .input(
    z.object({
      start: z.number().int().nonnegative(),
      end: z.number().int().nonnegative(),
    }),
  )
  .query(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const { start, end } = input;
    if (end <= start || end - start > MAX_RANGE_MS) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "ช่วงวันที่ไม่ถูกต้อง",
      });
    }

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
          name: reward ? localizedLabel(reward.name, "th") : "ไม่ระบุ",
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
      const balance = wallet.receivingBudget + (wallet.specialBudget ?? 0);
      const label = bucketLabel(balance);
      const index = distributionIndex.get(label);
      if (index == null) continue;
      const row = distribution[index];
      if (row) row.count += 1;
    }

    // 3. ยอดบริจาคในช่วงวัน (1 พอยต์ = 1 บาท)
    const donationPoints = donations.reduce((sum, row) => sum + row.points, 0);

    // 4. คำชมล่าสุดในช่วงวัน (เรียงใหม่ → เก่า)
    const sent = transactions.filter((t) => t.status !== "rejected");
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
            name: sender ? localizedLabel(sender.name, "th") : "ไม่ระบุ",
            department: sender
              ? localizedLabel(sender.department, "th")
              : "ไม่ระบุ",
          },
          receiver: {
            name: receiver ? localizedLabel(receiver.name, "th") : "ไม่ระบุ",
            department: receiver
              ? localizedLabel(receiver.department, "th")
              : "ไม่ระบุ",
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
        count: donations.length,
      },
      recentTransactions,
    };
  });
