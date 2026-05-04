import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { authMutation, authQuery, privateAuthAction } from "../lib/crpc";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./generated/server";

const zEmployeeDocId = z.custom<Id<"employee">>(
  (val): val is Id<"employee"> => typeof val === "string" && val.length > 0,
);

function normalizeOptionalEmail(email: string | null | undefined): string | undefined {
  const t = email?.trim() ?? "";
  return t.length > 0 ? t : undefined;
}

type NewEmployeePayload = {
  businessEmployeeId: string;
  name: string;
  email: string | undefined;
  department: string;
  position: string;
  rank: string;
  division: string;
  password: string;
};

async function insertEmployeeWalletAndScheduleSignup(
  ctx: MutationCtx,
  row: NewEmployeePayload,
): Promise<Id<"employee">> {
  const employeeDocId = await ctx.db.insert("employee", {
    employeeId: row.businessEmployeeId,
    name: row.name,
    email: row.email,
    department: row.department,
    position: row.position,
    rank: row.rank,
    division: row.division,
    citizenId: row.password,
  });

  await ctx.db.insert("wallet", {
    employeeId: employeeDocId,
    givingBudget: 100,
    receivingBudget: 0,
    lastBudgetUpdate: Date.now(),
  });

  await ctx.scheduler.runAfter(0, internal.employee.signUpEmployeeInternal, {
    name: row.name,
    email: row.email || "example@somboon.co.th",
    password: row.password,
    username: row.businessEmployeeId,
    employeeId: employeeDocId,
  });

  return employeeDocId;
}

function matchesEmployeeSearch(
  row: {
    employeeId: string;
    name: string;
    email: string | null;
    department: string;
    position: string;
    rank: string;
    division: string;
  },
  normalizedQuery: string,
) {
  if (!normalizedQuery) return true;
  return (
    row.employeeId.toLowerCase().includes(normalizedQuery) ||
    row.name.toLowerCase().includes(normalizedQuery) ||
    row.department.toLowerCase().includes(normalizedQuery) ||
    row.position.toLowerCase().includes(normalizedQuery) ||
    row.rank.toLowerCase().includes(normalizedQuery) ||
    row.division.toLowerCase().includes(normalizedQuery) ||
    (row.email ?? "").toLowerCase().includes(normalizedQuery)
  );
}

async function deleteLikesAndCommentsForTransaction(
  ctx: MutationCtx,
  transactionId: Id<"transaction">,
) {
  for (const row of await ctx.db
    .query("like")
    .withIndex("by_transactionId", (q) => q.eq("transactionId", transactionId))
    .collect()) {
    await ctx.db.delete(row._id);
  }
  for (const row of await ctx.db
    .query("comment")
    .withIndex("by_transactionId", (q) => q.eq("transactionId", transactionId))
    .collect()) {
    await ctx.db.delete(row._id);
  }
}

export const getMany = authQuery
  .input(
    z.object({
      query: z.string().optional().nullable(),
      limit: z.number().min(1).max(100),
      cursor: z.string().nullish(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const normalizedQuery = input.query?.trim().toLowerCase() ?? "";
    const baseQuery = ctx.orm.query.employee
      .select()
      .withIndex("by_employeeId")
      .orderBy({ employeeId: "asc" })
      .filter((row) => matchesEmployeeSearch(row, normalizedQuery))
      .map((row) => row);

    const pageResult = await baseQuery.paginate({
      cursor: input.cursor ?? null,
      limit: input.limit,
    });

    if (pageResult.continueCursor == null || pageResult.isDone) {
      return { ...pageResult, hasNextPage: false };
    }

    const probeResult = await baseQuery.paginate({
      cursor: pageResult.continueCursor,
      limit: 1,
    });

    return {
      ...pageResult,
      hasNextPage: probeResult.page.length > 0,
    };
  });

export const getOne = authQuery
  .input(
    z.object({
      employeeId: zEmployeeDocId,
    }),
  )
  .query(async ({ ctx, input }) => {
    const employee = await ctx.db.get(input.employeeId);

    if (!employee) {
      throw new CRPCError({ code: "NOT_FOUND", message: "Employee not found" });
    }
    
    return employee;
  });

export const search = authQuery
  .input(
    z.object({
      query: z.string(),
      self: z.boolean().optional().default(false),
    }),
  )
  .query(async ({ ctx, input }) => {
    const q = input.query.toLowerCase();

    const [id, name] = await Promise.all([
      ctx.orm.query.employee.findMany({
        where: { employeeId: q },
        limit: 5,
      }),
      ctx.orm.query.employee
        .findMany({
          orderBy: { employeeId: "asc" },
          allowFullScan: true,
        })
        .then((rows) =>
          rows
            .filter(
              (row) =>
                row.name.toLowerCase().includes(q) ||
                (row.email ?? "").toLowerCase().includes(q) ||
                row.employeeId.toLowerCase().includes(q),
            )
            .slice(0, 10),
        ),
    ]);

    const seen = new Set<string>();
    const results = [...id, ...name].filter((e) => {
      /** `self: true` — ให้ผลค้นหารวมตัวเองได้; default ตัดตัวเองออกสำหรับ picker */
      if (!input.self && e.id === ctx.user.employeeId) return false;
      if (seen.has(e.employeeId)) return false;

      seen.add(e.employeeId);
      return true;
    });

    return results.slice(0, 10);
  });

export const bulkImport = authMutation
  .input(
    z.object({
      rows: z.array(
        z.object({
          employeeId: z.string().trim(),
          name: z.string().trim(),
          email: z.string().optional().nullable(),
          department: z.string().trim(),
          position: z.string().trim(),
          rank: z.string().trim(),
          division: z.string().trim(),
          password: z.string().trim(),
        }),
      )
    }),
  )
  .mutation(async ({ ctx, input }) => {
    let inserted = 0;
    let skipped = 0;

    for (const row of input.rows) {
      const email = normalizeOptionalEmail(row.email);
      const existing = await ctx.db
        .query("employee")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", row.employeeId))
        .first();

      if (existing) {
        skipped += 1;
        continue;
      }

      await insertEmployeeWalletAndScheduleSignup(ctx, {
        businessEmployeeId: row.employeeId,
        name: row.name,
        email,
        department: row.department,
        position: row.position,
        rank: row.rank,
        division: row.division,
        password: row.password,
      });

      inserted += 1;
    }

    return { inserted, skipped };
  });

export const signUpEmployeeInternal = privateAuthAction
  .input(
    z.object({
      name: z.string().trim().min(1),
      email: z.string().trim().email(),
      password: z.string().trim().min(1),
      username: z.string().trim().min(1),
      employeeId: zEmployeeDocId,
    }),
  )
  .action(async ({ ctx, input }) => {
    await ctx.auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        username: input.username,
        employeeId: input.employeeId,
      },
    });
  });

export const create = authMutation
  .input(
    z.object({
      employeeId: z.string().trim(),
      name: z.string().trim(),
      email: z.string().optional().nullable(),
      department: z.string().trim(),
      position: z.string().trim(),
      rank: z.string().trim(),
      division: z.string().trim(),
      password: z.string().trim(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const email = normalizeOptionalEmail(input.email);
    const existing = await ctx.db
      .query("employee")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", input.employeeId))
      .first();

    if (existing) {
      throw new CRPCError({ code: "CONFLICT", message: "Employee already exists" });
    }

    const employeeDocId = await insertEmployeeWalletAndScheduleSignup(ctx, {
      businessEmployeeId: input.employeeId,
      name: input.name,
      email,
      department: input.department,
      position: input.position,
      rank: input.rank,
      division: input.division,
      password: input.password,
    });

    return employeeDocId;
  });

export const update = authMutation
  .input(
    z.object({
      employeeId: zEmployeeDocId,
      name: z.string().trim(),
      department: z.string().trim(),
      position: z.string().trim(),
      rank: z.string().trim(),
      division: z.string().trim(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const employee = await ctx.db.get(input.employeeId);

    if (!employee) {
      throw new CRPCError({ code: "NOT_FOUND", message: "Employee not found" });
    }

    await ctx.db.patch(input.employeeId, {
      name: input.name,
      department: input.department,
      position: input.position,
      rank: input.rank,
      division: input.division,
    });

    return input.employeeId;
  });

/** ล้างข้อมูลอ้างอิงทั้งหมดแล้วลบ employee (ใช้เมื่อ remove / bulkDelete) */
export async function deleteEmployeeCascade(
  ctx: MutationCtx,
  eid: Id<"employee">,
) {
  const transactionIds = new Set<Id<"transaction">>();

  for (const t of await ctx.db
    .query("transaction")
    .withIndex("by_senderId", (q) => q.eq("senderId", eid))
    .collect()) {
    transactionIds.add(t._id);
  }
  for (const t of await ctx.db
    .query("transaction")
    .withIndex("by_receiverId", (q) => q.eq("receiverId", eid))
    .collect()) {
    transactionIds.add(t._id);
  }
  for (const t of await ctx.db
    .query("transaction")
    .filter((q) => q.eq(q.field("reviewedBy"), eid))
    .collect()) {
    transactionIds.add(t._id);
  }

  for (const transactionId of transactionIds) {
    await deleteLikesAndCommentsForTransaction(ctx, transactionId);
    await ctx.db.delete(transactionId);
  }

  for (const row of await ctx.db
    .query("like")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", eid))
    .collect()) {
    await ctx.db.delete(row._id);
  }
  for (const row of await ctx.db
    .query("comment")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", eid))
    .collect()) {
    await ctx.db.delete(row._id);
  }

  for (const row of await ctx.db
    .query("redemption")
    .filter((q) => q.eq(q.field("fulfilledBy"), eid))
    .collect()) {
    await ctx.db.patch(row._id, { fulfilledBy: undefined, fulfilledAt: undefined });
  }

  for (const redemption of await ctx.db
    .query("redemption")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", eid))
    .collect()) {
    const review = await ctx.db
      .query("review")
      .withIndex("by_redemptionId", (q) => q.eq("redemptionId", redemption._id))
      .first();
    if (review) await ctx.db.delete(review._id);
    await ctx.db.delete(redemption._id);
  }

  for (const row of await ctx.db
    .query("activityParticipant")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", eid))
    .collect()) {
    await ctx.db.delete(row._id);
  }

  const userRow = await ctx.db
    .query("user")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", eid))
    .first();

  if (userRow) {
    for (const row of await ctx.db
      .query("activityParticipant")
      .filter((q) => q.eq(q.field("awardedBy"), userRow._id))
      .collect()) {
      await ctx.db.patch(row._id, { awardedBy: undefined, awardedAt: undefined });
    }
    for (const row of await ctx.db
      .query("review")
      .withIndex("by_userId", (q) => q.eq("userId", userRow._id))
      .collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db
      .query("session")
      .withIndex("by_userId", (q) => q.eq("userId", userRow._id))
      .collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db
      .query("account")
      .withIndex("by_userId", (q) => q.eq("userId", userRow._id))
      .collect()) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(userRow._id);
  }

  for (const row of await ctx.db
    .query("pointLedger")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", eid))
    .collect()) {
    await ctx.db.delete(row._id);
  }

  for (const cart of await ctx.db
    .query("cart")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", eid))
    .collect()) {
    for (const item of await ctx.db
      .query("cartItem")
      .withIndex("by_cartId", (q) => q.eq("cartId", cart._id))
      .collect()) {
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(cart._id);
  }

  for (const row of await ctx.db
    .query("wallet")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", eid))
    .collect()) {
    await ctx.db.delete(row._id);
  }

  await ctx.db.delete(eid);
}

export const remove = authMutation
  .input(
    z.object({
      employeeId: zEmployeeDocId,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const eid = input.employeeId;
    const employee = await ctx.db.get(eid);

    if (!employee) {
      throw new CRPCError({ code: "NOT_FOUND", message: "Employee not found" });
    }

    if (ctx.user.employeeId === eid) {
      throw new CRPCError({
        code: "FORBIDDEN",
        message: "Cannot delete your own employee record",
      });
    }

    await deleteEmployeeCascade(ctx, eid);
  });

export const bulkDelete = authMutation
  .input(
    z.object({
      employeeIds: z.array(zEmployeeDocId).min(1),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const me = ctx.user.employeeId;
    const unique = [...new Set(input.employeeIds)];
    let deleted = 0;
    let skipped = 0;

    for (const eid of unique) {
      if (eid === me) {
        skipped += 1;
        continue;
      }
      const row = await ctx.db.get(eid);
      if (!row) {
        skipped += 1;
        continue;
      }
      await deleteEmployeeCascade(ctx, eid);
      deleted += 1;
    }

    return { deleted, skipped };
  });