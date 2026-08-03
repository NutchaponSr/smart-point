# Employee department/position localization (TH/EN) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store `employee.department` and `employee.position` as `{ th, en }` localized objects instead of slug strings, matching the existing `reward.name`/`activity.name`/`news.title` pattern, and fix every downstream reader across the app so nothing renders `[object Object]` or fails Zod output validation.

**Architecture:** Add `localizedStringField()` to the two columns in `convex/functions/schema.ts`. Keep every client-facing input (form dropdown, Excel cell, filters, bulk import) sending a plain slug string unchanged; add one new server-side module (`convex/lib/employee-directory.ts`) that resolves a slug/th/en string to the canonical `{th, en}` object, used by every mutation that writes `department`/`position`. Update every reader (list/search/filter queries, other modules' pass-through payloads, Zod output schemas, and the ~10 frontend components that render the value as text) to use the object shape, with `pickLocalized(value, locale)` (already in `src/lib/i18n/localized.ts`) for anywhere text is actually shown to a user.

**Tech Stack:** Convex (`better-convex/orm`), Zod v4, Next.js (App Router, `[locale]` routing via `next-intl`), React Hook Form, TanStack Query, `xlsx`.

## Global Constraints

- `employee.name`, `rank`, `division` stay plain strings — out of scope (confirmed with user).
- `activity.allowedDepartments` stays `string[]` of slugs — its matching logic is currently dead code (`normalizeActivityBuFields` always forces it to `[]`); do not migrate it to objects.
- No test runner is configured in this repo (no vitest/jest, no `convex-test` devDependency). Verification per task uses `npx tsc --noEmit -p convex/functions/tsconfig.json` (backend), `npx tsc --noEmit -p tsconfig.json` (frontend), `npx convex codegen` (regenerate `_generated/*` types from `schema.ts` without deploying), and manual smoke-test instructions — not automated tests.
- The department/position resolver must match **case-insensitively against slug, `th`, or `en`** — not slug-only. Historically, Excel bulk-import (`employeeExportSchema.department: z.string()`) had no validation tying it to the fixed department list, so existing rows may hold a slug, a Thai display name, or an English display name. A slug-only resolver would reject/break real existing data during migration and future imports.
- `employee.ts`'s `isSystemAdminEmployee` checks `row.position === "Admin"` — this is a non-slug sentinel used only for seeded admin accounts (`scripts/employee.csv`), not a real position. The migration must convert it too (falling back to `{th: "Admin", en: "Admin"}` via `toLocalizedString`), and the equality check must change to `row.position.en === "Admin"`.
- Follow existing repo conventions: reuse `convex/lib/localized.ts` (`LocalizedString`, `isLocalizedString`, `toLocalizedString`, `localizedSearchText`) and `src/lib/i18n/localized.ts` (`pickLocalized`) rather than re-implementing. Follow the existing per-file local Zod schema convention (each file defines its own `z.object({th, en})` shape, as `reward.ts`/`activity.ts` already do) rather than centralizing.

---

## File Map

| File | Change |
|---|---|
| `convex/lib/employee-directory.ts` | **New.** Slug/th/en → `{th,en}` resolver for department & position. |
| `convex/functions/schema.ts` | `department`/`position` columns → `localizedStringField()`. |
| `convex/functions/employee.ts` | Resolve on write; fix list/search/filter; fix `isSystemAdminEmployee`; add migration mutation. |
| `convex/functions/seed.ts` | Resolve on write (`insertEmployee`). |
| `convex/functions/leaderboard.ts` | Type + search fix (duplicate logic of `employee.ts`). |
| `convex/functions/activity.ts` | Type fixes only (BU display, participant details, eligibility check). |
| `convex/functions/transaction.ts` | Zod **output** schema fixes (sender/receiver/comment author) — 3 occurrences. |
| `convex/functions/redemption.ts` | Type fix (admin row employee shape). |
| `src/modules/employee/ui/components/employee-columns.tsx` | Render `pickLocalized(...)` instead of raw string. |
| `src/modules/employee/hooks/use-employee-excel.ts` + `src/modules/employee/constants.ts` | Excel export: 2 columns (TH/EN) per field; import unchanged. |
| `src/modules/transactions/ui/components/feeds.tsx`, `transaction-review-dialog.tsx` | `PartyCard` department prop + rendering. |
| `src/modules/redemptions/ui/components/redemption-shipping-columns.tsx` | `pickLocalized(...)` rendering. |
| `src/modules/events/ui/components/participant-columns.tsx`, `src/modules/events/hooks/use-participant-excel.ts` | `pickLocalized(...)` rendering + export. |
| `src/modules/wallets/schema.ts`, `src/modules/wallets/ui/components/send-step.tsx`, `src/modules/events/schema.ts`, `src/modules/events/ui/views/join-event-view.tsx` | Type-only fix for inert `employee.department` form field. |

---

### Task 1: Employee directory resolver module

**Files:**
- Create: `convex/lib/employee-directory.ts`
- Modify (read-only reference, no edits): `src/modules/employee/constants.ts` (source of truth for the department/position lists being duplicated)

**Interfaces:**
- Consumes: `LocalizedString` type from `convex/lib/localized.ts`.
- Produces:
  - `resolveDepartment(value: string): LocalizedString` — throws `CRPCError({code: "BAD_REQUEST"})` if no match.
  - `resolvePosition(value: string): LocalizedString` — same.
  - `findDepartmentBySlug(slug: string): LocalizedString | null` — non-throwing, used by filter matching.
  - `findPositionBySlug(slug: string): LocalizedString | null` — same.

- [ ] **Step 1: Write the module**

```ts
// convex/lib/employee-directory.ts
import { CRPCError } from "better-convex/server";
import type { LocalizedString } from "./localized";

type DirectoryEntry = {
  slug: string;
  name: LocalizedString;
};

/** Kept in sync with src/modules/employee/constants.ts departments/positions — duplicated because Convex functions can't import from src/. */
const departmentDirectory: DirectoryEntry[] = [
  { slug: "hr", name: { th: "ฝ่ายบุคลากร", en: "HR" } },
  { slug: "it", name: { th: "ฝ่ายเทคโนโลยีสารสนเทศ", en: "IT" } },
  { slug: "finance", name: { th: "ฝ่ายการเงิน", en: "Finance" } },
  { slug: "marketing", name: { th: "ฝ่ายการตลาด", en: "Marketing" } },
  { slug: "sales", name: { th: "ฝ่ายขาย", en: "Sales" } },
];

const positionDirectory: DirectoryEntry[] = [
  { slug: "manager", name: { th: "ผู้จัดการ", en: "Manager" } },
  { slug: "supervisor", name: { th: "ผู้บังคับการ", en: "Supervisor" } },
  { slug: "staff", name: { th: "พนักงาน", en: "Staff" } },
];

function findInDirectory(
  entries: DirectoryEntry[],
  value: string,
): LocalizedString | null {
  const needle = value.trim().toLowerCase();
  const entry = entries.find(
    (e) =>
      e.slug.toLowerCase() === needle ||
      e.name.th.toLowerCase() === needle ||
      e.name.en.toLowerCase() === needle,
  );
  return entry?.name ?? null;
}

function resolveOrThrow(
  entries: DirectoryEntry[],
  value: string,
  fieldLabel: string,
): LocalizedString {
  const found = findInDirectory(entries, value);
  if (!found) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: `ไม่พบ${fieldLabel}: ${value}`,
    });
  }
  return found;
}

export function findDepartmentBySlug(slug: string): LocalizedString | null {
  return findInDirectory(departmentDirectory, slug);
}

export function findPositionBySlug(slug: string): LocalizedString | null {
  return findInDirectory(positionDirectory, slug);
}

export function resolveDepartment(value: string): LocalizedString {
  return resolveOrThrow(departmentDirectory, value, "แผนก");
}

export function resolvePosition(value: string): LocalizedString {
  return resolveOrThrow(positionDirectory, value, "ตำแหน่ง");
}
```

- [ ] **Step 2: Verify with a throwaway script (no test framework in repo — this substitutes for a unit test)**

Create `scripts/_verify-employee-directory.ts` temporarily:

```ts
import { resolveDepartment, resolvePosition, findDepartmentBySlug } from "../convex/lib/employee-directory";
import assert from "node:assert";

assert.deepStrictEqual(resolveDepartment("hr"), { th: "ฝ่ายบุคลากร", en: "HR" });
assert.deepStrictEqual(resolveDepartment("HR"), { th: "ฝ่ายบุคลากร", en: "HR" });
assert.deepStrictEqual(resolveDepartment("ฝ่ายบุคลากร"), { th: "ฝ่ายบุคลากร", en: "HR" });
assert.deepStrictEqual(resolvePosition("manager"), { th: "ผู้จัดการ", en: "Manager" });
assert.strictEqual(findDepartmentBySlug("nonexistent"), null);
assert.throws(() => resolveDepartment("nonexistent"));
console.log("employee-directory: all checks passed");
```

Run: `npx tsx scripts/_verify-employee-directory.ts`
Expected: `employee-directory: all checks passed`

- [ ] **Step 3: Delete the throwaway script**

```bash
rm scripts/_verify-employee-directory.ts
```

- [ ] **Step 4: Commit**

```bash
git add convex/lib/employee-directory.ts
git commit -m "feat: add employee department/position directory resolver"
```

---

### Task 2: Schema change

**Files:**
- Modify: `convex/functions/schema.ts:79-101` (the `employee` table definition)

**Interfaces:**
- Consumes: `localizedStringField()` helper already defined at the top of `schema.ts` (used by `reward`/`activity`/`news`).
- Produces: `Doc<"employee">.department` / `.position` typed as `{th: string, en: string}` everywhere `_generated/dataModel.d.ts` is used.

- [ ] **Step 1: Change the two field types**

In `convex/functions/schema.ts`, change:

```ts
export const employee = convexTable("employee", {
  employeeId: text().notNull(),
  name: text().notNull(),
  email: text(),
  department: text().notNull(),
  position: text().notNull(),
  rank: text().notNull(),
  division: text().notNull(),
}, (t) => [
```

to:

```ts
export const employee = convexTable("employee", {
  employeeId: text().notNull(),
  name: text().notNull(),
  email: text(),
  department: localizedStringField().notNull(),
  position: localizedStringField().notNull(),
  rank: text().notNull(),
  division: text().notNull(),
}, (t) => [
```

Leave every index below it (`by_department`, `by_division_employeeId`, `by_department_employeeId`, `by_rank_employeeId`, `by_division_department_employeeId`, `by_employeeId`, the three `searchIndex`es) untouched — same field references, same names.

- [ ] **Step 2: Regenerate Convex generated types**

Run: `npx convex codegen`
Expected: exits 0, and `convex/functions/_generated/dataModel.d.ts` now shows `department: {th: string, en: string}` for the `employee` table (open the file and confirm).

- [ ] **Step 3: Confirm backend fails to compile (expected — downstream files not fixed yet)**

Run: `npx tsc --noEmit -p convex/functions/tsconfig.json`
Expected: FAIL, with errors in `employee.ts`, `seed.ts`, `leaderboard.ts`, `activity.ts`, `transaction.ts`, `redemption.ts` — this confirms the type change is actually propagating (a pass here would mean the schema edit didn't take effect).

- [ ] **Step 4: Commit**

```bash
git add convex/functions/schema.ts "convex/functions/_generated"
git commit -m "feat: store employee department/position as localized {th,en} objects"
```

---

### Task 3: `convex/functions/employee.ts` — writes, reads, filters, migration

**Files:**
- Modify: `convex/functions/employee.ts`

**Interfaces:**
- Consumes: `resolveDepartment`, `resolvePosition`, `findDepartmentBySlug`, `findPositionBySlug` from `../lib/employee-directory` (Task 1); `LocalizedString`, `isLocalizedString`, `toLocalizedString`, `localizedSearchText` from `../lib/localized`.
- Produces: no change to any exported function's argument shape (`department`/`position` args stay `z.string()` slugs everywhere) — only the stored/returned value shape changes.

- [ ] **Step 1: Import the new helpers**

At the top of `convex/functions/employee.ts`, add:

```ts
import {
  findDepartmentBySlug,
  findPositionBySlug,
  resolveDepartment,
  resolvePosition,
} from "../lib/employee-directory";
import {
  isLocalizedString,
  localizedSearchText,
  toLocalizedString,
  type LocalizedString,
} from "../lib/localized";
```

- [ ] **Step 2: Resolve on insert (`insertEmployeeWalletAndScheduleSignup`)**

Change (around line 40-48):

```ts
  const employeeDocId = await ctx.db.insert("employee", {
    employeeId: businessEmployeeId,
    name: row.name,
    email: row.email,
    department: row.department,
    position: row.position,
    rank: row.rank,
    division: row.division,
  });
```

to:

```ts
  const employeeDocId = await ctx.db.insert("employee", {
    employeeId: businessEmployeeId,
    name: row.name,
    email: row.email,
    department: resolveDepartment(row.department),
    position: resolvePosition(row.position),
    rank: row.rank,
    division: row.division,
  });
```

(`NewEmployeePayload.department`/`.position` stay `string` — they're still the slug at this call boundary.)

- [ ] **Step 3: Fix `isSystemAdminEmployee`**

Change (around line 70-76):

```ts
function isSystemAdminEmployee(row: {
  position: string;
  rank: string;
  division: string;
}) {
  return row.position === "Admin" && row.rank === "Admin" && row.division === "Admin";
}
```

to:

```ts
function isSystemAdminEmployee(row: {
  position: LocalizedString;
  rank: string;
  division: string;
}) {
  return row.position.en === "Admin" && row.rank === "Admin" && row.division === "Admin";
}
```

- [ ] **Step 4: Fix `EmployeeListRow` type and search/filter matching**

Change (around line 89-97):

```ts
type EmployeeListRow = {
  employeeId: string;
  name: string;
  email: string | null;
  department: string;
  position: string;
  rank: string;
  division: string;
};
```

to:

```ts
type EmployeeListRow = {
  employeeId: string;
  name: string;
  email: string | null;
  department: LocalizedString;
  position: LocalizedString;
  rank: string;
  division: string;
};
```

Change `matchesEmployeeSearch` (around line 119-130):

```ts
function matchesEmployeeSearch(row: EmployeeListRow, normalizedQuery: string) {
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
```

to:

```ts
function matchesEmployeeSearch(row: EmployeeListRow, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  return (
    row.employeeId.toLowerCase().includes(normalizedQuery) ||
    row.name.toLowerCase().includes(normalizedQuery) ||
    localizedSearchText(row.department).toLowerCase().includes(normalizedQuery) ||
    localizedSearchText(row.position).toLowerCase().includes(normalizedQuery) ||
    row.rank.toLowerCase().includes(normalizedQuery) ||
    row.division.toLowerCase().includes(normalizedQuery) ||
    (row.email ?? "").toLowerCase().includes(normalizedQuery)
  );
}
```

Change `matchesEmployeeListFilters` (around line 132-157) — the department slug-array check:

```ts
  if (
    filters.departments.length > 0 &&
    !filters.departments.includes(row.department)
  ) {
    return false;
  }
```

to:

```ts
  if (
    filters.departments.length > 0 &&
    !filters.departments.some(
      (slug) => findDepartmentBySlug(slug)?.en === row.department.en,
    )
  ) {
    return false;
  }
```

- [ ] **Step 5: Fix `buildEmployeeListQuery`'s index-equality branches**

Change (around line 166-231), the two branches that do `.eq("department", departments[0]!)`:

```ts
  if (divisions.length === 1 && departments.length === 1) {
    return ctx.orm.query.employee
      .select()
      .withIndex("by_division_department_employeeId", (q) =>
        q.eq("division", divisions[0]!).eq("department", departments[0]!),
      )
      .orderBy({ employeeId: "asc" })
      .filter(matches)
      .map((row) => row);
  }
```

and

```ts
  if (departments.length === 1) {
    return ctx.orm.query.employee
      .select()
      .withIndex("by_department_employeeId", (q) =>
        q.eq("department", departments[0]!),
      )
      .orderBy({ employeeId: "asc" })
      .filter(matches)
      .map((row) => row);
  }
```

to (resolve the slug to its `{th,en}` object before the index equality; `NEVER_MATCHES` is a sentinel object that can't equal any real seeded department, keeping today's "unknown filter value matches nothing" behavior):

```ts
const NEVER_MATCHES_DEPARTMENT: LocalizedString = { th: " ", en: " " };

// ...inside buildEmployeeListQuery:

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
```

```ts
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
```

Add the `NEVER_MATCHES_DEPARTMENT` constant near the top of the file (module scope, next to the other helpers).

- [ ] **Step 6: Resolve on `update` mutation**

Change (around line 548-554):

```ts
    await ctx.db.patch(input.employeeId, {
      name: input.name,
      department: input.department,
      position: input.position,
      rank: input.rank,
      division: input.division,
    });
```

to:

```ts
    await ctx.db.patch(input.employeeId, {
      name: input.name,
      department: resolveDepartment(input.department),
      position: resolvePosition(input.position),
      rank: input.rank,
      division: input.division,
    });
```

(`create` mutation already routes through `insertEmployeeWalletAndScheduleSignup`, fixed in Step 2 — no separate change needed there. `bulkImport` also routes through the same helper.)

- [ ] **Step 7: Add the migration mutation**

Add near the bottom of the file, after `bulkDelete`:

```ts
/** Backfill department/position จาก string (slug หรือชื่อเดิม) → { th, en } */
export const migrateEmployeeLocalizedFields = privateMutation.mutation(
  async ({ ctx }) => {
    const employees = await ctx.db.query("employee").collect();
    let updated = 0;

    for (const employee of employees) {
      const departmentNeedsUpdate = !isLocalizedString(employee.department);
      const positionNeedsUpdate = !isLocalizedString(employee.position);

      if (!departmentNeedsUpdate && !positionNeedsUpdate) continue;

      const department = departmentNeedsUpdate
        ? (findDepartmentBySlug(employee.department as unknown as string) ??
          toLocalizedString(employee.department as unknown as string))
        : employee.department;
      const position = positionNeedsUpdate
        ? (findPositionBySlug(employee.position as unknown as string) ??
          toLocalizedString(employee.position as unknown as string))
        : employee.position;

      if (!department || !position) continue;

      await ctx.db.patch(employee._id, { department, position });
      updated += 1;
    }

    return { scanned: employees.length, updated };
  },
);
```

This needs `privateMutation` imported — add `privateMutation` to the existing `authMutation, authQuery, privateAuthAction` import from `"../lib/crpc"` at the top of the file.

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit -p convex/functions/tsconfig.json`
Expected: `employee.ts` no longer reports errors (other files still will — fixed in later tasks).

- [ ] **Step 9: Commit**

```bash
git add convex/functions/employee.ts
git commit -m "feat: resolve employee department/position slugs to localized objects on write"
```

---

### Task 4: `convex/functions/seed.ts`

**Files:**
- Modify: `convex/functions/seed.ts:14-57` (`insertEmployee`)

- [ ] **Step 1: Import and use the resolver**

Add import:

```ts
import { resolveDepartment, resolvePosition } from "../lib/employee-directory";
```

Change (around line 37-45):

```ts
    const employeeDocId = await ctx.db.insert("employee", {
      employeeId,
      name: input.name,
      email: input.email,
      department: input.department,
      position: input.position,
      rank: input.rank,
      division: input.division,
    });
```

to:

```ts
    const employeeDocId = await ctx.db.insert("employee", {
      employeeId,
      name: input.name,
      email: input.email,
      department: resolveDepartment(input.department),
      position: resolvePosition(input.position),
      rank: input.rank,
      division: input.division,
    });
```

(`insertEmployee`'s `args` schema stays `department: z.string(), position: z.string()` — unchanged, still slugs.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p convex/functions/tsconfig.json`
Expected: `seed.ts` no longer reports errors.

- [ ] **Step 3: Commit**

```bash
git add convex/functions/seed.ts
git commit -m "feat: resolve department/position in employee seed mutation"
```

---

### Task 5: `convex/functions/leaderboard.ts`

**Files:**
- Modify: `convex/functions/leaderboard.ts:9-17, 38-52`

**Interfaces:**
- Consumes: `localizedSearchText` from `../lib/localized` (same helper used in Task 3).

- [ ] **Step 1: Import the helper**

```ts
import { localizedSearchText } from "../lib/localized";
```

- [ ] **Step 2: Fix `EmployeeListRow` type**

Change (line 9-17):

```ts
type EmployeeListRow = {
  employeeId: string;
  name: string;
  email: string | null;
  department: string;
  position: string;
  rank: string;
  division: string;
};
```

to:

```ts
import type { LocalizedString } from "../lib/localized";

type EmployeeListRow = {
  employeeId: string;
  name: string;
  email: string | null;
  department: LocalizedString;
  position: LocalizedString;
  rank: string;
  division: string;
};
```

(combine this import with the `localizedSearchText` import from Step 1 into one `import { localizedSearchText, type LocalizedString } from "../lib/localized";`)

- [ ] **Step 3: Fix `matchesEmployeeSearch`**

Change (line 38-52):

```ts
    row.department.toLowerCase().includes(normalizedQuery) ||
    row.position.toLowerCase().includes(normalizedQuery) ||
```

to:

```ts
    localizedSearchText(row.department).toLowerCase().includes(normalizedQuery) ||
    localizedSearchText(row.position).toLowerCase().includes(normalizedQuery) ||
```

- [ ] **Step 4: Fix the `department: string | null` types that flow through**

`collectFilteredEmployees`'s return type and `RankedRow` (lines 108-113, 120, 136, 149-157, 190) all declare `department: string | null`. Change every one of these four occurrences from `string | null` to `LocalizedString | null`. The values themselves (`row.department ?? null`, `employee.department`) don't need code changes — only the type annotations.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p convex/functions/tsconfig.json`
Expected: `leaderboard.ts` no longer reports errors.

- [ ] **Step 6: Commit**

```bash
git add convex/functions/leaderboard.ts
git commit -m "fix: update leaderboard employee department/position types to LocalizedString"
```

---

### Task 6: `convex/functions/activity.ts`

**Files:**
- Modify: `convex/functions/activity.ts:90-97, 220-259, 895-916`

- [ ] **Step 1: Fix `isEmployeeEligibleForActivity`'s type signature**

Change (line 90-97):

```ts
function isEmployeeEligibleForActivity(
  activity: {
    category: z.infer<typeof activityCategory>;
    allowedDivisions?: (string | null)[] | null;
    allowedDepartments?: (string | null)[] | null;
  },
  employee: { division: string; department: string },
): boolean {
```

to:

```ts
import type { LocalizedString } from "../lib/localized";

function isEmployeeEligibleForActivity(
  activity: {
    category: z.infer<typeof activityCategory>;
    allowedDivisions?: (string | null)[] | null;
    allowedDepartments?: (string | null)[] | null;
  },
  employee: { division: string; department: LocalizedString },
): boolean {
```

(add the `LocalizedString` import near the top of the file with the other imports; no logic change — `allowedDepartments` matching is dead code per Global Constraints, only `division` is actually compared in the function body.)

- [ ] **Step 2: Fix `listJoinedEmployeeDetails`'s return shape**

At line 242-258, the object literal already spreads `department: employee.department, position: employee.position` — no code change needed, this is inferred TS, but confirm the function's return type isn't hand-declared elsewhere with `string`. Search the file for an explicit return type annotation on `listJoinedEmployeeDetails`; if none exists (it's inferred), no change is needed here beyond what TypeScript infers automatically.

- [ ] **Step 3: Fix the `bu: { department, division }` return shape at line 909-914**

Same as Step 2 — this is a plain object literal with an inferred type; no manual annotation to fix. Confirm by typechecking.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p convex/functions/tsconfig.json`
Expected: `activity.ts` no longer reports errors. If it still does, read the exact error — it will point at any hand-written return-type annotation this plan missed; fix that specific line the same way (change `department: string` to `department: LocalizedString` wherever the error points).

- [ ] **Step 5: Commit**

```bash
git add convex/functions/activity.ts
git commit -m "fix: update activity employee department type to LocalizedString"
```

---

### Task 7: `convex/functions/transaction.ts` — Zod output schemas

**Files:**
- Modify: `convex/functions/transaction.ts:1452-1490` (the `feeds` query's `.paginated({ item: ... })` schema)

**Interfaces:**
- Consumes: none new — defines a local `z.object` shape, following the existing per-file convention (`activity.ts`/`reward.ts` each define their own local `localizedNameSchema`).

- [ ] **Step 1: Add a local schema constant**

Near the top of `convex/functions/transaction.ts`, alongside other local consts, add:

```ts
const localizedFieldSchema = z.object({
  th: z.string(),
  en: z.string(),
});
```

- [ ] **Step 2: Replace all three `department`/`position` string fields**

In the `feeds` query's item schema (around lines 1452-1490), change each of:

```ts
      sender: z.object({
        _id: z.custom<Id<"employee">>(),
        employeeId: z.string(),
        name: z.string(),
        department: z.string(),
        position: z.string(),
        rank: z.string(),
        division: z.string(),
        image: z.string().nullable(),
      }),
      receiver: z.object({
        _id: z.custom<Id<"employee">>(),
        employeeId: z.string(),
        name: z.string(),
        department: z.string(),
        position: z.string(),
        rank: z.string(),
        division: z.string(),
        image: z.string().nullable(),
      }),
```

to:

```ts
      sender: z.object({
        _id: z.custom<Id<"employee">>(),
        employeeId: z.string(),
        name: z.string(),
        department: localizedFieldSchema,
        position: localizedFieldSchema,
        rank: z.string(),
        division: z.string(),
        image: z.string().nullable(),
      }),
      receiver: z.object({
        _id: z.custom<Id<"employee">>(),
        employeeId: z.string(),
        name: z.string(),
        department: localizedFieldSchema,
        position: localizedFieldSchema,
        rank: z.string(),
        division: z.string(),
        image: z.string().nullable(),
      }),
```

And the comment `author` object a few lines further down:

```ts
          author: z.object({
            _id: z.custom<Id<"employee">>(),
            employeeId: z.string(),
            name: z.string(),
            department: z.string(),
            position: z.string(),
            rank: z.string(),
            division: z.string(),
```

to:

```ts
          author: z.object({
            _id: z.custom<Id<"employee">>(),
            employeeId: z.string(),
            name: z.string(),
            department: localizedFieldSchema,
            position: localizedFieldSchema,
            rank: z.string(),
            division: z.string(),
```

- [ ] **Step 3: Search the same file for any other identical `department: z.string()` output-schema occurrences**

Run: `grep -n "department: z.string()" convex/functions/transaction.ts`
If any remain (there may be other `.paginated`/`.output` schemas for different queries beyond `feeds` that also embed sender/receiver/author shapes), apply the identical `localizedFieldSchema` replacement to each.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p convex/functions/tsconfig.json`
Expected: `transaction.ts` no longer reports errors.

- [ ] **Step 5: Commit**

```bash
git add convex/functions/transaction.ts
git commit -m "fix: update transaction feed output schema for localized department/position"
```

---

### Task 8: `convex/functions/redemption.ts`

**Files:**
- Modify: `convex/functions/redemption.ts:228-237`

- [ ] **Step 1: Fix `RedemptionAdminPageRow`'s employee shape**

Change:

```ts
type RedemptionAdminPageRow = {
  redemption: RedemptionListPageRow["redemption"];
  reward: RedemptionListPageRow["reward"];
  employee: {
    _id: Id<"employee">;
    employeeId: string;
    name: string;
    department: string;
    division: string;
  };
};
```

to:

```ts
import type { LocalizedString } from "../lib/localized";

type RedemptionAdminPageRow = {
  redemption: RedemptionListPageRow["redemption"];
  reward: RedemptionListPageRow["reward"];
  employee: {
    _id: Id<"employee">;
    employeeId: string;
    name: string;
    department: LocalizedString;
    division: string;
  };
};
```

(add the import near existing imports; the file already imports `localizedSearchText` from the same module per the earlier grep, so combine into one import line.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p convex/functions/tsconfig.json`
Expected: **all** backend Convex files now typecheck clean (this is the last backend file with an error). If anything still fails, read the error and fix that specific line before moving on — do not proceed to frontend tasks with a broken backend build.

- [ ] **Step 3: Commit**

```bash
git add convex/functions/redemption.ts
git commit -m "fix: update redemption admin row department type to LocalizedString"
```

---

### Task 9: Frontend — `employee-columns.tsx`

**Files:**
- Modify: `src/modules/employee/ui/components/employee-columns.tsx`

- [ ] **Step 1: Render localized department/position**

Change the file's imports and the two plain `accessorKey` columns:

```ts
import type { ApiOutputs } from "@convex/api";
import type { ColumnDef } from "@tanstack/react-table";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { EmployeeActions } from "@/modules/employee/ui/components/employee-actions";

type Employee = ApiOutputs["employee"]["getMany"]["page"][0];

export const columns = (): ColumnDef<Employee>[] => {
  return [
    ...
    {
      accessorKey: "department",
      header: "ฝ่าย",
    },
    {
      accessorKey: "position",
      header: "ตำแหน่ง",
    },
    ...
```

to:

```ts
import type { ApiOutputs } from "@convex/api";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale } from "next-intl";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { EmployeeActions } from "@/modules/employee/ui/components/employee-actions";
import { pickLocalized } from "@/lib/i18n/localized";

type Employee = ApiOutputs["employee"]["getMany"]["page"][0];

function LocalizedCell({ value }: { value: { th: string; en: string } }) {
  const locale = useLocale();
  return <>{pickLocalized(value, locale)}</>;
}

export const columns = (): ColumnDef<Employee>[] => {
  return [
    ...
    {
      accessorKey: "department",
      header: "ฝ่าย",
      cell: ({ row }) => <LocalizedCell value={row.original.department} />,
    },
    {
      accessorKey: "position",
      header: "ตำแหน่ง",
      cell: ({ row }) => <LocalizedCell value={row.original.position} />,
    },
    ...
```

Keep everything else in the file (the `name`/`rank`/`division`/`actions` columns) unchanged.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors from `employee-columns.tsx`.

- [ ] **Step 3: Manual verification**

Run `npm run dev` and (with `npx convex dev` also running against a dev deployment where the migration from Task 3 has been run — see Task 16), open `/th/meta/employees` and `/en/meta/employees`. Confirm the "ฝ่าย"/"ตำแหน่ง" columns show the Thai and English department/position names respectively, not `[object Object]`.

- [ ] **Step 4: Commit**

```bash
git add src/modules/employee/ui/components/employee-columns.tsx
git commit -m "feat: render localized department/position in employee table"
```

---

### Task 10: Frontend — Excel export (2 columns) for employee

**Files:**
- Modify: `src/modules/employee/constants.ts:15-24` (`employeeHeaders`)
- Modify: `src/modules/employee/hooks/use-employee-excel.ts:137-163` (`onExport`)

- [ ] **Step 1: Add EN header columns**

Change `employeeHeaders` in `src/modules/employee/constants.ts`:

```ts
export const employeeHeaders: Record<string, string> = {
  "employeeId": "Employee Id",
  "name": "Name",
  "email": "Email",
  "department": "Department",
  "position": "Position",
  "rank": "Rank",
  "division": "Division",
  "citizenId": "Citizen Id",
}
```

to:

```ts
export const employeeHeaders: Record<string, string> = {
  "employeeId": "Employee Id",
  "name": "Name",
  "email": "Email",
  "department": "Department",
  "departmentEn": "Department (EN)",
  "position": "Position",
  "positionEn": "Position (EN)",
  "rank": "Rank",
  "division": "Division",
  "citizenId": "Citizen Id",
}
```

(`employeeHeaderMapping`, used for import, stays untouched — import still reads a single "Department"/"Position" column, resolved server-side by `resolveDepartment`/`resolvePosition` in `bulkImport`.)

- [ ] **Step 2: Export both languages**

In `src/modules/employee/hooks/use-employee-excel.ts`, change `onExport` (around line 148-157):

```ts
      exportToExcel(
        data.map((e) => ({
          employeeId: e.employeeId,
          name: e.name,
          email: e.email,
          department: e.department,
          position: e.position,
          rank: e.rank,
          division: e.division,
        })),
```

to:

```ts
      exportToExcel(
        data.map((e) => ({
          employeeId: e.employeeId,
          name: e.name,
          email: e.email,
          department: e.department.th,
          departmentEn: e.department.en,
          position: e.position.th,
          positionEn: e.position.en,
          rank: e.rank,
          division: e.division,
        })),
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors from either modified file.

- [ ] **Step 4: Manual verification**

In the running app, go to `/th/meta/employees`, click Export, open the downloaded `.xlsx` and confirm it has both "Department"/"Department (EN)" and "Position"/"Position (EN)" columns with correct values.

- [ ] **Step 5: Commit**

```bash
git add src/modules/employee/constants.ts src/modules/employee/hooks/use-employee-excel.ts
git commit -m "feat: export employee department/position in both TH and EN columns"
```

---

### Task 11: Frontend — transaction feed party cards

**Files:**
- Modify: `src/modules/transactions/ui/components/transaction-review-dialog.tsx:43-56, 72`
- Modify: `src/modules/transactions/ui/components/feeds.tsx:120-133, 152-154`

- [ ] **Step 1: Fix `transaction-review-dialog.tsx`'s `PartyCard`**

Change the prop type and rendering (around line 43-56, 71-72):

```tsx
function PartyCard({
  label,
  name,
  id,
  department,
  image,
  accent,
}: {
  label: string;
  name: string;
  id: string | undefined;
  department: string | undefined;
  image: string | null | undefined;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border-2 border-[#e5e5e5] bg-[#fafafa] p-3">
      <UserAvatar
```

to:

```tsx
import { useLocale } from "next-intl";
import { pickLocalized } from "@/lib/i18n/localized";

function PartyCard({
  label,
  name,
  id,
  department,
  image,
  accent,
}: {
  label: string;
  name: string;
  id: string | undefined;
  department: { th: string; en: string } | undefined;
  image: string | null | undefined;
  accent?: boolean;
}) {
  const locale = useLocale();
  const departmentLabel = department ? pickLocalized(department, locale) : undefined;
  return (
    <div className="flex items-start gap-3 rounded-md border-2 border-[#e5e5e5] bg-[#fafafa] p-3">
      <UserAvatar
```

And where it's rendered (line 71-72 in the original, inside the JSX body — find the line `{id ? <p className="text-xs text-[#777]">รหัส: {id}</p> : null}` and the department line just after it):

```tsx
        {department ? <p className="text-xs text-[#777]">แผนก: {department}</p> : null}
```

to:

```tsx
        {departmentLabel ? <p className="text-xs text-[#777]">แผนก: {departmentLabel}</p> : null}
```

- [ ] **Step 2: Fix `feeds.tsx`'s equivalent `PartyCard`**

Same shape of change: the prop type at line 130 (`department: string | undefined`) becomes `department: { th: string; en: string } | undefined`, and the `t("department", { department })` call at line 154 needs a resolved string, not the object. Add `useLocale` (the component already imports `useTranslations`/`useLocale` per the `FeedDetailDialog` code read earlier — confirm and reuse rather than re-importing) and `pickLocalized`, then change:

```tsx
        {department ? (
          <p className="text-xs text-[#777]">
            {t("department", { department })}
          </p>
        ) : null}
```

to:

```tsx
        {department ? (
          <p className="text-xs text-[#777]">
            {t("department", { department: pickLocalized(department, locale) })}
          </p>
        ) : null}
```

Since `PartyCard` in `feeds.tsx` is a separate function from `FeedDetailDialog`, it needs its own `useLocale()` call (React hooks can't be shared across function boundaries) — add `const locale = useLocale();` inside `PartyCard` itself, not reused from the parent.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors from either file.

- [ ] **Step 4: Manual verification**

Open a transaction feed detail dialog (`/th/(main)` feed, click a transaction) and the admin transaction review dialog (`/th/meta/transactions`), confirm sender/receiver department text renders correctly in both.

- [ ] **Step 5: Commit**

```bash
git add src/modules/transactions/ui/components/transaction-review-dialog.tsx src/modules/transactions/ui/components/feeds.tsx
git commit -m "fix: render localized department in transaction party cards"
```

---

### Task 12: Frontend — redemption shipping columns

**Files:**
- Modify: `src/modules/redemptions/ui/components/redemption-shipping-columns.tsx:1-95`

- [ ] **Step 1: Render pickLocalized**

Add imports:

```ts
import { useLocale } from "next-intl";
import { pickLocalized } from "@/lib/i18n/localized";
```

Change the `cell` for the `"employee"` column (around line 77-95) — it's currently a plain function returning JSX, not a component, so `useLocale()` can't be called inside it directly. Wrap the department text in a small subcomponent:

```tsx
function EmployeeDepartmentLabel({
  department,
}: {
  department: { th: string; en: string };
}) {
  const locale = useLocale();
  return <>{pickLocalized(department, locale)}</>;
}
```

Then change:

```tsx
          <p className="text-sm text-muted-foreground">
            {row.original.employee.employeeId} · {row.original.employee.department}
          </p>
```

to:

```tsx
          <p className="text-sm text-muted-foreground">
            {row.original.employee.employeeId} · <EmployeeDepartmentLabel department={row.original.employee.department} />
          </p>
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors from this file.

- [ ] **Step 3: Manual verification**

Open `/th/meta/redemptions`, confirm each row's employee sub-line shows `EmployeeId · Department` correctly (not `[object Object]`).

- [ ] **Step 4: Commit**

```bash
git add src/modules/redemptions/ui/components/redemption-shipping-columns.tsx
git commit -m "fix: render localized department in redemption shipping columns"
```

---

### Task 13: Frontend — event participant columns and Excel export

**Files:**
- Modify: `src/modules/events/ui/components/participant-columns.tsx:1-75`
- Modify: `src/modules/events/hooks/use-participant-excel.ts:1-90`

- [ ] **Step 1: Fix `participant-columns.tsx`**

Add imports:

```ts
import { useLocale } from "next-intl";
import { pickLocalized } from "@/lib/i18n/localized";
```

The column's `cell` is already a function component context (arrow function returning JSX directly inside `columns()`, called during render) — but `columns()` itself is a plain factory function called once, not a component, so hooks can't go in the outer `columns()` function. Wrap the department span in its own small component:

```tsx
function ParticipantDepartment({ department }: { department: { th: string; en: string } }) {
  const locale = useLocale();
  return <>{pickLocalized(department, locale)}</>;
}
```

Change (around line 69-71):

```tsx
            <span className="text-xs text-muted-foreground">
              {row.original.department}
            </span>
```

to:

```tsx
            <span className="text-xs text-muted-foreground">
              <ParticipantDepartment department={row.original.department} />
            </span>
```

- [ ] **Step 2: Fix `use-participant-excel.ts`'s export**

Add imports:

```ts
import { useLocale } from "next-intl";
import { pickLocalized } from "@/lib/i18n/localized";
```

Inside `useParticipantExcel`, add `const locale = useLocale();` near the top of the function body (alongside the existing `useState`/`useMutation` calls). Change `onExport`'s data mapping (around line 76-83):

```ts
      exportToExcel(
        data.map((e) => ({
          employeeId: e.employeeCode,
          name: e.name,
          department: e.department,
          position: e.position,
          status: e.status,
        })),
```

to:

```ts
      exportToExcel(
        data.map((e) => ({
          employeeId: e.employeeCode,
          name: e.name,
          department: pickLocalized(e.department, locale),
          position: pickLocalized(e.position, locale),
          status: e.status,
        })),
```

(Single localized column, matching current export shape — this file wasn't part of the explicit TH/EN-two-column decision, which was scoped to the employee Excel export only.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors from either file.

- [ ] **Step 4: Manual verification**

Open an event's participant list (`/th/meta/events/[eventId]/join` or wherever participants are listed), confirm department renders as text. Export participants to Excel and confirm the Department/Position columns show readable text.

- [ ] **Step 5: Commit**

```bash
git add src/modules/events/ui/components/participant-columns.tsx src/modules/events/hooks/use-participant-excel.ts
git commit -m "fix: render localized department/position for event participants"
```

---

### Task 14: Frontend — inert `employee.department` form fields (send point / join event)

**Files:**
- Modify: `src/modules/wallets/schema.ts` (the `employee.department` field in `SendTransactionSchema`)
- Modify: `src/modules/wallets/ui/components/send-step.tsx:155-186`
- Modify: `src/modules/events/schema.ts` (the `employee.department` field in `joinEventSchema`)
- Modify: `src/modules/events/ui/views/join-event-view.tsx:79-84, 372-391`

**Context:** These fields hold the selected employee's department in local React Hook Form state for the "send points" and "join event" combobox flows. `Selection`'s option rendering (`src/components/selection.tsx`) does not read or display `department` at all — it's carried but never shown, and never submitted to a mutation beyond the employee id. This task is a type-correctness fix only, not a rendering fix.

- [ ] **Step 1: Fix `SendTransactionSchema`**

In `src/modules/wallets/schema.ts`, find the `employee: z.object({...})` block:

```ts
    employee: z.object({
      id: z.string().min(1, "กรุณาเลือกพนักงาน"),
      name: z.string(),
      email: z.string().optional(),
      department: z.string(),
    }),
```

Change `department: z.string()` to:

```ts
      department: z.object({ th: z.string(), en: z.string() }),
```

- [ ] **Step 2: Fix `send-step.tsx`'s default/onChange values**

The `onClear` handler (around line 155-161) sets:

```ts
              employeeField.onChange({
                id: "",
                name: "",
                email: "",
                department: "",
              });
```

Change `department: ""` to `department: { th: "", en: "" }`.

The rest of the file (`options={employees?.map(...)}`, `onSelect`) already passes `employee.department` through as-is — since the query result's `department` field is now the object, these lines need no code change, only the schema/default fixes above make everything align.

- [ ] **Step 3: Fix `joinEventSchema`**

In `src/modules/events/schema.ts`, find the equivalent `employee: z.object({...})` block (same shape as Step 1) and apply the identical change: `department: z.string()` → `department: z.object({ th: z.string(), en: z.string() })`.

- [ ] **Step 4: Fix `join-event-view.tsx`'s default value**

Change (around line 79-84):

```ts
      employee: {
        id: "",
        name: "",
        email: "",
        department: "",
      },
```

to:

```ts
      employee: {
        id: "",
        name: "",
        email: "",
        department: { th: "", en: "" },
      },
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors from any of the four files. This should also be the last frontend file with errors — a clean run here means the whole frontend compiles.

- [ ] **Step 6: Manual verification**

Open the "send points" flow and the "join event" admin flow, search for an employee, select one, and confirm no runtime error occurs (department isn't displayed here, so there's nothing visual to check beyond "the flow still works end to end").

- [ ] **Step 7: Commit**

```bash
git add src/modules/wallets/schema.ts src/modules/wallets/ui/components/send-step.tsx src/modules/events/schema.ts src/modules/events/ui/views/join-event-view.tsx
git commit -m "fix: update inert employee.department form field type to LocalizedString"
```

---

### Task 15: Full-repo compile sweep

**Files:** none (verification-only task; may touch any file if the sweep finds a miss)

- [ ] **Step 1: Full backend typecheck**

Run: `npx tsc --noEmit -p convex/functions/tsconfig.json`
Expected: exits 0, no errors anywhere.

- [ ] **Step 2: Full frontend typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exits 0, no errors anywhere.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: exits 0 (or only pre-existing warnings unrelated to this change).

- [ ] **Step 4: Grep sweep for anything missed**

Run: `grep -rn "\.department\b\|\.position\b" convex/functions src --include="*.ts" --include="*.tsx"`

Read through the output. For any line touching an `employee`-sourced `department`/`position` that renders it as a bare string (JSX text, template literal, `.toLowerCase()`, string concatenation) and wasn't covered by Tasks 3–14, fix it the same way (`pickLocalized`/`.th`/`.en` for display, `LocalizedString` for types) before proceeding.

- [ ] **Step 5: Commit any sweep fixes**

If Step 4 found anything:

```bash
git add -A
git commit -m "fix: address remaining employee department/position type mismatches"
```

If nothing was found, skip this step (nothing to commit).

---

### Task 16: Deploy schema and run the data migration (manual runbook)

**Files:** none (operational task, no code changes)

This task documents the manual steps to actually roll the schema change out to a real Convex deployment, matching how `reward.ts`'s `migrateLocalizedStrings` was rolled out previously. This is **not** automatable from this plan — it requires access to the target Convex deployment.

- [ ] **Step 1: Push the schema**

Run: `npx convex dev` (or `npx convex deploy` for production) against the target deployment. Convex will validate the new schema; since `department`/`position` are changing from `string` to an object shape, existing documents will briefly be out of sync with the new schema until Step 2 runs — this mirrors exactly how the `reward`/`activity`/`news` localization rollout was done in this repo (see commit `34155e6`).

- [ ] **Step 2: Run the migration mutation**

Open the Convex dashboard for the target deployment → Functions → find `employee:migrateEmployeeLocalizedFields` → run it with no arguments (it's a `privateMutation`, callable from the dashboard).
Expected result: `{ scanned: <total employee count>, updated: <count> }` where `updated` matches however many rows still held a plain string.

- [ ] **Step 3: Verify no plain-string rows remain**

In the dashboard's Data tab, browse the `employee` table and spot-check a handful of rows (including any known seeded "Admin" rows) to confirm `department`/`position` are now `{th, en}` objects, and that the special admin rows now read `{th: "Admin", en: "Admin"}`.

- [ ] **Step 4: Smoke test the running app**

Walk through: `/meta/employees` list + filters + search + Excel export, editing one employee's department/position, the send-points flow, a transaction feed item, an event's participant list, and `/meta/redemptions`. Confirm nothing shows `[object Object]` and nothing throws.

---

## Self-Review Notes

- **Spec coverage:** schema (Task 2), resolver/migration (Tasks 1, 3, 16), employee.ts reads/writes (Task 3), seed.ts (Task 4), all "other consumers" enumerated in the design spec plus the additional ones found during planning — leaderboard.ts (5), activity.ts (6), transaction.ts (7), redemption.ts (8) — and every frontend renderer found in the full-codebase grep (9–14), with a final sweep (15) to catch anything still missed. Excel export 2-column decision covered in Task 10.
- **Placeholder scan:** every step has literal code, not descriptions. Task 6 Steps 2–3 explicitly say "no change needed, confirm via typecheck" rather than hand-waving — that's an intentional no-op, not a placeholder.
- **Type consistency:** `LocalizedString` (from `convex/lib/localized.ts` for backend, inline `{th: string, en: string}` shape for frontend since frontend imports types via `ApiOutputs`, not the backend module directly) is used consistently. `resolveDepartment`/`resolvePosition`/`findDepartmentBySlug`/`findPositionBySlug` names match between Task 1's definition and every later task's usage.
