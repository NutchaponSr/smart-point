import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { requireAdmin } from "../lib/auth-helper";
import {
  authMutation,
  authQuery,
  privateAction,
  privateAuthAction,
  privateMutation,
} from "../lib/crpc";
import {
  findDepartmentBySlug,
  findPositionBySlug,
  resolveDepartment,
  resolvePosition,
} from "../lib/employee-directory";
import { normalizeText } from "../lib/employee-id";
import {
  isLocalizedString,
  localizedLabel,
  localizedSearchText,
  toLocalizedString,
  type LocalizedString,
} from "../lib/localized";
import { hashPassword } from "../lib/password";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./generated/server";

const zAccountDocId = z.custom<Id<"account">>(
  (val): val is Id<"account"> => typeof val === "string" && val.length > 0,
);

const zUserDocId = z.custom<Id<"user">>(
  (val): val is Id<"user"> => typeof val === "string" && val.length > 0,
);

const NEVER_MATCHES_DEPARTMENT: LocalizedString = { th: " ", en: " " };

const zLocalizedName = z.object({
  th: z.string().trim().min(1),
  en: z.string().trim().min(1),
});

function requireLocalizedName(
  value: LocalizedString | string,
): LocalizedString {
  const name = toLocalizedString(value);
  if (!name) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "ชื่อพนักงานต้องไม่ว่าง",
    });
  }
  return name;
}

function nameSearchFrom(name: LocalizedString): string {
  return localizedSearchText(name).trim();
}

function departmentSearchFrom(department: LocalizedString): string {
  return localizedSearchText(department).trim();
}

const zEmployeeDocId = z.custom<Id<"employee">>(
  (val): val is Id<"employee"> => typeof val === "string" && val.length > 0,
);

function defaultSignupEmail(businessEmployeeId: string): string {
  return `${businessEmployeeId}@example.somboon.co.th`;
}

function normalizeOptionalEmail(email: string | null | undefined): string | undefined {
  const t = email?.trim() ?? "";
  return t.length > 0 ? t : undefined;
}

type NewEmployeePayload = {
  businessEmployeeId: string;
  citizenId: string;
  name: LocalizedString | string;
  email: string | undefined;
  department: LocalizedString | string;
  position: LocalizedString | string;
  rank: string;
  division: string;
  password: string;
};

function coerceDepartment(value: LocalizedString | string): LocalizedString {
  return isLocalizedString(value)
    ? requireLocalizedName(value)
    : resolveDepartment(value);
}

function coercePosition(value: LocalizedString | string): LocalizedString {
  return isLocalizedString(value)
    ? requireLocalizedName(value)
    : resolvePosition(value);
}

async function findEmployeeByBusinessId(
  ctx: QueryCtx | MutationCtx,
  businessEmployeeId: string,
) {
  return await ctx.db
    .query("employee")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", businessEmployeeId))
    .first();
}

async function findEmployeeByCitizenId(
  ctx: QueryCtx | MutationCtx,
  citizenId: string,
) {
  return await ctx.db
    .query("employee")
    .withIndex("by_citizenId", (q) => q.eq("citizenId", citizenId))
    .first();
}

async function assertCitizenIdAvailable(
  ctx: QueryCtx | MutationCtx,
  citizenId: string,
  exceptEmployeeDocId?: Id<"employee">,
) {
  const existing = await findEmployeeByCitizenId(ctx, citizenId);
  if (existing && existing._id !== exceptEmployeeDocId) {
    throw new CRPCError({
      code: "CONFLICT",
      message: "เลขบัตรประชาชนนี้ถูกใช้แล้ว",
    });
  }
}

async function syncBusinessEmployeeId(
  ctx: MutationCtx,
  employeeDocId: Id<"employee">,
  nextBusinessId: string,
  currentBusinessId: string,
) {
  if (nextBusinessId === currentBusinessId) return;

  const conflictEmployee = await findEmployeeByBusinessId(ctx, nextBusinessId);
  if (conflictEmployee && conflictEmployee._id !== employeeDocId) {
    throw new CRPCError({
      code: "CONFLICT",
      message: "รหัสพนักงานนี้ถูกใช้แล้ว",
    });
  }

  const conflictUser = await ctx.db
    .query("user")
    .withIndex("by_username", (q) => q.eq("username", nextBusinessId))
    .first();
  const linkedUser = await ctx.db
    .query("user")
    .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeDocId))
    .first();
  if (conflictUser && (!linkedUser || conflictUser._id !== linkedUser._id)) {
    throw new CRPCError({
      code: "CONFLICT",
      message: "ชื่อผู้ใช้งานนี้ถูกใช้แล้ว",
    });
  }

  await ctx.db.patch(employeeDocId, { employeeId: nextBusinessId });
  if (linkedUser) {
    await ctx.db.patch(linkedUser._id, {
      username: nextBusinessId,
      displayUsername: nextBusinessId,
    });
  }
}

async function applyEmployeeProfilePatch(
  ctx: MutationCtx,
  employeeDocId: Id<"employee">,
  fields: {
    name: LocalizedString;
    department: LocalizedString;
    position: LocalizedString;
    rank: string;
    division: string;
    citizenId?: string;
  },
) {
  await ctx.db.patch(employeeDocId, {
    name: fields.name,
    nameSearch: nameSearchFrom(fields.name),
    department: fields.department,
    departmentSearch: departmentSearchFrom(fields.department),
    position: fields.position,
    rank: fields.rank,
    division: fields.division,
    ...(fields.citizenId !== undefined ? { citizenId: fields.citizenId } : {}),
  });
}

async function insertEmployeeWalletAndScheduleSignup(
  ctx: MutationCtx,
  row: NewEmployeePayload,
): Promise<Id<"employee">> {
  const businessEmployeeId = normalizeText(row.businessEmployeeId, 5);
  const citizenId = normalizeText(row.citizenId, 5);
  await assertCitizenIdAvailable(ctx, citizenId);

  const name = requireLocalizedName(row.name);
  const department = coerceDepartment(row.department);

  const employeeDocId = await ctx.db.insert("employee", {
    employeeId: businessEmployeeId,
    citizenId,
    name,
    nameSearch: nameSearchFrom(name),
    email: row.email,
    department,
    departmentSearch: departmentSearchFrom(department),
    position: coercePosition(row.position),
    rank: row.rank.trim(),
    division: row.division,
  });

  await ctx.db.insert("wallet", {
    employeeId: employeeDocId,
    givingBudget: 100,
    receivingBudget: 0,
    specialBudget: 0,
    lastBudgetUpdate: Date.now(),
  });

  await ctx.scheduler.runAfter(0, internal.employee.signUpEmployeeInternal, {
    name: localizedLabel(name, "th"),
    email: row.email ?? defaultSignupEmail(businessEmployeeId),
    password: row.password,
    username: businessEmployeeId,
    employeeId: employeeDocId,
  });

  return employeeDocId;
}

/** บัญชี admin จาก seed (scripts/employee.csv) — position/rank/division เป็น Admin ทั้งสาม */
function isSystemAdminEmployee(row: {
  position: LocalizedString | string;
  rank: LocalizedString | string;
  division: string;
}) {
  const positionEn = isLocalizedString(row.position)
    ? row.position.en
    : row.position;
  return (
    positionEn === "Admin" &&
    rankText(row.rank) === "Admin" &&
    row.division === "Admin"
  );
}

async function getAdminEmployeeDocIds(
  ctx: Pick<QueryCtx, "db">,
): Promise<Set<string>> {
  const adminUsers = await ctx.db
    .query("user")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .collect();

  return new Set(adminUsers.map((user) => user.employeeId));
}

type EmployeeListRow = {
  employeeId: string;
  name: LocalizedString | string;
  email: string | null;
  department: LocalizedString | string;
  position: LocalizedString | string;
  rank: LocalizedString | string;
  division: string;
};

function rankText(rank: LocalizedString | string): string {
  return typeof rank === "string" ? rank : rank.th.trim() || rank.en.trim();
}

type EmployeeListFilters = {
  query?: string | null;
  division?: string[] | null;
  department?: string[] | null;
  rank?: string[] | null;
};

function normalizeFilterArray(
  value: string[] | null | undefined,
): string[] {
  if (value == null || value.length === 0) return [];
  return [
    ...new Set(
      value
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  ];
}

function matchesEmployeeSearch(row: EmployeeListRow, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  return (
    row.employeeId.toLowerCase().includes(normalizedQuery) ||
    localizedSearchText(row.name).toLowerCase().includes(normalizedQuery) ||
    localizedSearchText(row.department).toLowerCase().includes(normalizedQuery) ||
    localizedSearchText(row.position).toLowerCase().includes(normalizedQuery) ||
    rankText(row.rank).toLowerCase().includes(normalizedQuery) ||
    row.division.toLowerCase().includes(normalizedQuery) ||
    (row.email ?? "").toLowerCase().includes(normalizedQuery)
  );
}

function localizedEn(value: LocalizedString | string): string {
  return isLocalizedString(value) ? value.en : value;
}

function matchesEmployeeListFilters(
  row: EmployeeListRow,
  filters: {
    divisions: string[];
    departments: string[];
    ranks: string[];
    normalizedQuery: string;
  },
) {
  if (
    filters.divisions.length > 0 &&
    !filters.divisions.includes(row.division)
  ) {
    return false;
  }
  if (
    filters.departments.length > 0 &&
    !filters.departments.some(
      (slug) => findDepartmentBySlug(slug)?.en === localizedEn(row.department),
    )
  ) {
    return false;
  }
  if (filters.ranks.length > 0 && !filters.ranks.includes(rankText(row.rank))) {
    return false;
  }
  return matchesEmployeeSearch(row, filters.normalizedQuery);
}

const employeeListFilterInput = {
  query: z.string().optional().nullable(),
  division: z.array(z.string()).optional().nullable(),
  department: z.array(z.string()).optional().nullable(),
  rank: z.array(z.string()).optional().nullable(),
};

function buildEmployeeListQuery(
  ctx: Pick<QueryCtx, "orm"> | Pick<MutationCtx, "orm">,
  input: EmployeeListFilters,
) {
  const divisions = normalizeFilterArray(input.division);
  const departments = normalizeFilterArray(input.department);
  const ranks = normalizeFilterArray(input.rank);
  const normalizedQuery = input.query?.trim().toLowerCase() ?? "";
  const matches = (row: EmployeeListRow) =>
    matchesEmployeeListFilters(row, {
      divisions,
      departments,
      ranks,
      normalizedQuery,
    });

  // ใช้ equality index ได้เมื่อเลือกค่าเดียวในมิตินั้น
  if (divisions.length === 1 && departments.length === 1) {
    const departmentValue =
      findDepartmentBySlug(departments[0]!) ?? NEVER_MATCHES_DEPARTMENT;
    return ctx.orm.query.employee
      .select()
      .withIndex("by_division_department_employeeId", (q) =>
        q.eq("division", divisions[0]!).eq("department", departmentValue),
      )
      .orderBy({ employeeId: "asc" })
      .filter(matches)
      .map((row) => row);
  }

  if (divisions.length === 1) {
    return ctx.orm.query.employee
      .select()
      .withIndex("by_division_employeeId", (q) =>
        q.eq("division", divisions[0]!),
      )
      .orderBy({ employeeId: "asc" })
      .filter(matches)
      .map((row) => row);
  }

  if (departments.length === 1) {
    const departmentValue =
      findDepartmentBySlug(departments[0]!) ?? NEVER_MATCHES_DEPARTMENT;
    return ctx.orm.query.employee
      .select()
      .withIndex("by_department_employeeId", (q) =>
        q.eq("department", departmentValue),
      )
      .orderBy({ employeeId: "asc" })
      .filter(matches)
      .map((row) => row);
  }

  if (ranks.length === 1) {
    return ctx.orm.query.employee
      .select()
      .withIndex("by_rank_employeeId", (q) => q.eq("rank", ranks[0]!))
      .orderBy({ employeeId: "asc" })
      .filter(matches)
      .map((row) => row);
  }

  return ctx.orm.query.employee
    .select()
    .withIndex("by_employeeId")
    .orderBy({ employeeId: "asc" })
    .filter(matches)
    .map((row) => row);
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
      ...employeeListFilterInput,
      limit: z.number().min(1).max(100),
      cursor: z.string().nullish(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const baseQuery = buildEmployeeListQuery(ctx, input);

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

const MAX_EXPORT_ROWS = 10000;
const EXPORT_PAGE_SIZE = 100;

/** ดึงรายชื่อพนักงานทั้งหมดที่ตรง filter — ใช้ logic เดียวกับ getMany */
export const exportAll = authMutation
  .input(z.object(employeeListFilterInput))
  .mutation(async ({ ctx, input }) => {
    const baseQuery = buildEmployeeListQuery(ctx, input);

    const rows: Awaited<ReturnType<(typeof baseQuery)["paginate"]>>["page"] =
      [];
    let cursor: string | null = null;

    while (true) {
      const pageResult = await baseQuery.paginate({
        cursor,
        limit: EXPORT_PAGE_SIZE,
      });

      rows.push(...pageResult.page);
      if (rows.length > MAX_EXPORT_ROWS) {
        throw new CRPCError({
          code: "BAD_REQUEST",
          message: `พบข้อมูลมากเกิน ${MAX_EXPORT_ROWS} รายการ กรุณาใช้คำค้นให้เฉพาะเจาะจงมากขึ้น`,
        });
      }

      if (pageResult.isDone || pageResult.continueCursor == null) {
        break;
      }
      cursor = pageResult.continueCursor;
    }

    return rows;
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
    const q = input.query.trim();
    if (!q) return [];

    const adminEmployeeIds = await getAdminEmployeeDocIds(ctx);

    const [byEmployeeId, byName, byDepartment, byEmail] = await Promise.all([
      ctx.orm.query.employee.findMany({
        search: { index: "search_employeeId", query: q },
        limit: 10,
      }),
      ctx.orm.query.employee.findMany({
        search: { index: "search_name", query: q },
        limit: 10,
      }),
      ctx.orm.query.employee.findMany({
        search: { index: "search_department", query: q },
        limit: 10,
      }),
      ctx.orm.query.employee.findMany({
        search: { index: "search_email", query: q },
        limit: 10,
      }),
    ]);

    const seen = new Set<string>();
    const results = [...byEmployeeId, ...byName, ...byDepartment, ...byEmail].filter((e) => {
      /** `self: true` — ให้ผลค้นหารวมตัวเองได้; default ตัดตัวเองออกสำหรับ picker */
      if (!input.self && e.id === ctx.user.employeeId) return false;
      if (adminEmployeeIds.has(e.id) || isSystemAdminEmployee(e)) return false;
      if (seen.has(e.employeeId)) return false;

      seen.add(e.employeeId);
      return true;
    });

    return results.slice(0, 10);
  });

const bulkImportRowSchema = z.object({
  rowIndex: z.number().int().positive(),
  employeeId: z.string().trim(),
  name: zLocalizedName,
  email: z.string().optional().nullable(),
  department: zLocalizedName,
  position: zLocalizedName,
  rank: z.string().trim(),
  division: z.string().trim(),
  password: z.string().trim(),
});

export const bulkImport = authMutation
  .input(
    z.object({
      rows: z.array(bulkImportRowSchema),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    let inserted = 0;
    let skipped = 0;
    const errors: Array<{
      rowIndex: number;
      employeeId: string;
      message: string;
    }> = [];
    const seenInBatch = new Set<string>();

    for (const row of input.rows) {
      const businessEmployeeId = normalizeText(row.employeeId, 5);

      if (seenInBatch.has(businessEmployeeId)) {
        skipped += 1;
        console.log("bulkImport skip (duplicate in batch)", {
          rowIndex: row.rowIndex,
          employeeId: businessEmployeeId,
        });
        continue;
      }
      seenInBatch.add(businessEmployeeId);

      try {
        const email = normalizeOptionalEmail(row.email);
        const existing = await ctx.db
          .query("employee")
          .withIndex("by_employeeId", (q) => q.eq("employeeId", businessEmployeeId))
          .first();

        if (existing) {
          skipped += 1;
          console.log("bulkImport skip (already exists)", {
            rowIndex: row.rowIndex,
            employeeId: businessEmployeeId,
          });
          continue;
        }

        await insertEmployeeWalletAndScheduleSignup(ctx, {
          businessEmployeeId,
          name: row.name,
          email,
          department: row.department,
          position: row.position,
          rank: row.rank,
          division: row.division,
          citizenId: normalizeText(row.password, 5),
          password: normalizeText(row.password, 5),
        });

        inserted += 1;
        console.log("bulkImport created", {
          rowIndex: row.rowIndex,
          employeeId: businessEmployeeId,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดขณะนำเข้า";
        console.error("bulkImport failed", {
          rowIndex: row.rowIndex,
          employeeId: row.employeeId,
          error: message,
        });
        errors.push({
          rowIndex: row.rowIndex,
          employeeId: row.employeeId,
          message,
        });
      }
    }

    return { inserted, skipped, errors };
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
        password: normalizeText(input.password, 5),
        username: input.username,
        employeeId: input.employeeId,
        role: "user",
      },
    });
  });

/** Hash password outside mutation (bcrypt uses setTimeout). */
export const setEmployeePasswordInternal = privateAction
  .input(
    z.object({
      accountId: zAccountDocId,
      userId: zUserDocId,
      password: z.string().trim().min(1),
    }),
  )
  .action(async ({ ctx, input }) => {
    const passwordHash = await hashPassword(normalizeText(input.password, 5));
    await ctx.runMutation(internal.employee.patchEmployeePasswordInternal, {
      accountId: input.accountId,
      userId: input.userId,
      passwordHash,
    });
  });

export const patchEmployeePasswordInternal = privateMutation
  .input(
    z.object({
      accountId: zAccountDocId,
      userId: zUserDocId,
      passwordHash: z.string().min(1),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const account = await ctx.db.get(input.accountId);
    if (!account) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "ไม่พบบัญชีเข้าสู่ระบบของพนักงานนี้",
      });
    }

    await ctx.db.patch(input.accountId, { password: input.passwordHash });

    for (const session of await ctx.db
      .query("session")
      .withIndex("by_userId", (q) => q.eq("userId", input.userId))
      .collect()) {
      await ctx.db.delete(session._id);
    }
  });

export const create = authMutation
  .input(
    z.object({
      employeeId: z.string().trim(),
      name: zLocalizedName,
      email: z.string().optional().nullable(),
      department: zLocalizedName,
      position: zLocalizedName,
      rank: z.string().trim().min(1),
      division: z.string().trim(),
      password: z.string().trim(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const businessEmployeeId = normalizeText(input.employeeId, 5);
    const citizenId = normalizeText(input.password, 5);
    const email = normalizeOptionalEmail(input.email);
    const existing = await ctx.db
      .query("employee")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", businessEmployeeId))
      .first();

    if (existing) {
      throw new CRPCError({ code: "CONFLICT", message: "Employee already exists" });
    }

    const employeeDocId = await insertEmployeeWalletAndScheduleSignup(ctx, {
      businessEmployeeId,
      name: input.name,
      email,
      department: input.department,
      position: input.position,
      rank: input.rank,
      division: input.division,
      citizenId,
      password: citizenId,
    });

    return employeeDocId;
  });

export const update = authMutation
  .input(
    z.object({
      /** Convex document `_id` ของ employee */
      employeeId: zEmployeeDocId,
      /** รหัสพนักงานธุรกิจ (login username) */
      businessEmployeeId: z.string().trim().min(1),
      name: zLocalizedName,
      department: zLocalizedName,
      position: zLocalizedName,
      rank: z.string().trim().min(1),
      division: z.string().trim(),
      /** ว่าง/ไม่ส่ง = ไม่เปลี่ยนรหัสผ่าน */
      newPassword: z.string().trim().min(5).max(20).optional().nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const employee = await ctx.db.get(input.employeeId);

    if (!employee) {
      throw new CRPCError({ code: "NOT_FOUND", message: "Employee not found" });
    }

    const name = requireLocalizedName(input.name);
    const department = requireLocalizedName(input.department);
    const position = requireLocalizedName(input.position);
    const rank = input.rank.trim();
    const nextBusinessId = normalizeText(input.businessEmployeeId, 5);

    await syncBusinessEmployeeId(
      ctx,
      input.employeeId,
      nextBusinessId,
      employee.employeeId,
    );
    await applyEmployeeProfilePatch(ctx, input.employeeId, {
      name,
      department,
      position,
      rank,
      division: input.division,
    });

    const rawPassword = input.newPassword?.trim() ?? "";
    if (rawPassword.length > 0) {
      const password = normalizeText(rawPassword, 5);
      const userRow = await ctx.db
        .query("user")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", input.employeeId))
        .first();

      if (!userRow) {
        throw new CRPCError({
          code: "NOT_FOUND",
          message: "ไม่พบบัญชีผู้ใช้ของพนักงานนี้",
        });
      }

      const account = await ctx.db
        .query("account")
        .withIndex("by_userId", (q) => q.eq("userId", userRow._id))
        .first();

      if (!account) {
        throw new CRPCError({
          code: "NOT_FOUND",
          message: "ไม่พบบัญชีเข้าสู่ระบบของพนักงานนี้",
        });
      }

      // bcrypt ใช้ setTimeout — ต้อง hash ใน action แล้วค่อย patch
      await ctx.scheduler.runAfter(
        0,
        internal.employee.setEmployeePasswordInternal,
        {
          accountId: account._id,
          userId: userRow._id,
          password,
        },
      );
    }

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
    requireAdmin(ctx.user);

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

/**
 * Backfill name/department/position → { th, en } + nameSearch/departmentSearch.
 * If rank was briefly stored as { th, en }, flatten to a plain string.
 * Empty name strings are skipped and reported (required field).
 */
export const migrateEmployeeLocalizedFields = privateMutation.mutation(
  async ({ ctx }) => {
    const employees = await ctx.db.query("employee").collect();
    let updated = 0;
    const skippedEmptyName: string[] = [];

    for (const employee of employees) {
      const nameNeedsUpdate = !isLocalizedString(employee.name);
      const departmentNeedsUpdate = !isLocalizedString(employee.department);
      const positionNeedsUpdate = !isLocalizedString(employee.position);
      const rankNeedsFlatten = isLocalizedString(employee.rank);

      const name = nameNeedsUpdate
        ? toLocalizedString(employee.name as unknown as string)
        : (employee.name as LocalizedString);

      if (!name) {
        skippedEmptyName.push(employee._id);
        continue;
      }

      const department = departmentNeedsUpdate
        ? (findDepartmentBySlug(employee.department as unknown as string) ??
          toLocalizedString(employee.department as unknown as string))
        : employee.department;
      const position = positionNeedsUpdate
        ? (findPositionBySlug(employee.position as unknown as string) ??
          toLocalizedString(employee.position as unknown as string))
        : employee.position;

      if (!department || !position) continue;

      const rank = rankNeedsFlatten
        ? rankText(employee.rank)
        : (employee.rank as string);

      const nextNameSearch = nameSearchFrom(name);
      const nextDepartmentSearch = departmentSearchFrom(department);
      const nameSearchNeedsUpdate = employee.nameSearch !== nextNameSearch;
      const departmentSearchNeedsUpdate =
        employee.departmentSearch !== nextDepartmentSearch;

      if (
        !nameNeedsUpdate &&
        !departmentNeedsUpdate &&
        !positionNeedsUpdate &&
        !rankNeedsFlatten &&
        !nameSearchNeedsUpdate &&
        !departmentSearchNeedsUpdate
      ) {
        continue;
      }

      await ctx.db.patch(employee._id, {
        name,
        nameSearch: nextNameSearch,
        department,
        departmentSearch: nextDepartmentSearch,
        position,
        rank,
      });
      updated += 1;
    }

    return {
      scanned: employees.length,
      updated,
      skippedEmptyName,
    };
  },
);