# Employee department/position localization (TH/EN)

## Goal

`employee.department` and `employee.position` currently store a **slug**
(`"hr"`, `"manager"`, ...) that is resolved to a `{ th, en }` display name only
in the frontend, via `src/modules/employee/constants.ts`. This makes the raw
DB values Thai-only in practice and forces every consumer to re-do the
slug → name lookup.

This change makes the two fields store the localized `{ th, en }` object
directly on the `employee` document, the same way `reward.name`,
`activity.name`, and `news.title` already do (`localizedStringField()` in
`convex/functions/schema.ts`, helpers in `convex/lib/localized.ts` and
`src/lib/i18n/localized.ts`).

`name` (the employee's own name) and `rank`/`division` are **out of scope** —
confirmed with the user these stay as plain strings.

## Why store the object instead of keeping the slug

Considered and rejected: keep the slug on `employee` and only add a
denormalized `{th,en}` display field alongside it. Rejected because the user
explicitly chose the same pattern as `reward.name`/`activity.name` — a single
source of truth on the record itself, no separate lookup needed at read time.

Trade-off accepted: filtering/indexing now compares against the full object
value instead of a short string, and Excel/Convex function args need a
resolution step (see below). This trade-off was discussed with the user
(index/filter/Excel/`activity.allowedDepartments` impact) and the object-store
approach was chosen anyway.

## Schema change

```ts
// convex/functions/schema.ts
export const employee = convexTable("employee", {
  employeeId: text().notNull(),
  name: text().notNull(),
  email: text(),
  department: localizedStringField().notNull(),
  position: localizedStringField().notNull(),
  rank: text().notNull(),
  division: text().notNull(),
}, (t) => [
  index("by_department").on(t.department),
  index("by_division_employeeId").on(t.division, t.employeeId),
  index("by_department_employeeId").on(t.department, t.employeeId),
  index("by_rank_employeeId").on(t.rank, t.employeeId),
  index("by_division_department_employeeId").on(t.division, t.department, t.employeeId),
  uniqueIndex("by_employeeId").on(t.employeeId),
  searchIndex("search_name").on(t.name),
  searchIndex("search_email").on(t.email),
  searchIndex("search_employeeId").on(t.employeeId),
]);
```

No index *names* or field lists change — only the underlying column type.
Equality lookups on these indexes must pass the full `{th, en}` object (see
resolution helper below), not a slug.

## Resolution helper (new, server-side)

`department`/`position` are a **controlled vocabulary** (fixed dropdown from
`constants.ts`), unlike `reward.name`'s free text. To avoid trusting
client-supplied `th`/`en` text for a field that's supposed to be one of a
fixed set, the client keeps sending the **slug** everywhere it does today
(form, Excel cell, bulk import), and a new small server-side module resolves
slug → `{th, en}`:

```ts
// convex/lib/employee-directory.ts
export function resolveDepartment(slug: string): LocalizedString { ... }
export function resolvePosition(slug: string): LocalizedString { ... }
```

Backed by the same data as `src/modules/employee/constants.ts` (duplicated
into `convex/lib` since Convex functions can't import from `src/`). Throws
`CRPCError({ code: "BAD_REQUEST" })` on an unknown slug. Also expose the
reverse-ish matcher used by filtering (see below).

This means **`employee-form.tsx`'s dropdown logic is unchanged** — it still
binds to a slug string for the Radix `DropdownMenuRadioGroup`. The
slug → object conversion happens entirely server-side in Convex mutations.

## Convex functions to update (`convex/functions/employee.ts`)

- `create`, `update`, `bulkImport`, `seed.ts#insertEmployee`,
  `seed.ts#seedEmployee`: args keep `department: z.string()` /
  `position: z.string()` (the slug), call `resolveDepartment`/
  `resolvePosition` before `ctx.db.insert`/`ctx.db.patch`.
- `buildEmployeeListQuery`: the single-value equality path
  (`.withIndex(..., q => q.eq("department", departments[0]!))`) resolves the
  filter slug to its object first.
- `matchesEmployeeListFilters`: multi-select fallback path currently does
  `filters.departments.includes(row.department)` (string). Change to compare
  against each selected slug's resolved object (structural equality), or
  simpler — compare `row.department.en` against each selected slug's resolved
  `.en` (english names are unique in `constants.ts`, so this is a safe stable
  key without needing deep-equal).
- `matchesEmployeeSearch`: replace `row.department.toLowerCase().includes(...)`
  with `localizedSearchText(row.department).toLowerCase().includes(...)`
  (helper already exists in `convex/lib/localized.ts`).
- `getMany`/`getOne`/`search`/`exportAll` return the object as-is; no
  transform needed since the DB now holds `{th,en}` directly.

## Migration (backfill existing rows)

Same pattern as `reward.ts#migrateLocalizedStrings`: a new
`migrateEmployeeLocalizedFields` `privateMutation` in `employee.ts` that scans
the `employee` table, and for any row where `department`/`position` is still
a plain string (`typeof x === "string"`), resolves it via
`resolveDepartment`/`resolvePosition` (matching by slug — existing data *is*
the slug) and `ctx.db.patch`s it. Run once manually via the Convex dashboard
after deploy, same as the existing reward/activity/news migrations were run.

## Frontend updates

- `employee-columns.tsx`: `department`/`position` columns get a custom `cell`
  rendering `row.original.department.th` (currently plain `accessorKey`
  auto-render, which would print `[object Object]` otherwise).
- `employee-preview.tsx`: drop the `departments.find(...)`/`positions.find(...)`
  lookups — `department`/`position` from the form are already the resolved
  slug at form-level, so preview keeps using the constants lookup for the
  *live form preview* (form still holds slugs pre-submit — no change needed
  here, since the form itself is unaffected).
- `employee-form.tsx`: **no change** (dropdown still keyed by slug).
- `use-employee-excel.ts` / `constants.ts` (`employeeHeaderMapping`,
  `employeeHeaders`):
  - Import: unchanged — still one "Department"/"Position" column, resolved
    server-side the same as the form/bulkImport path (accepts the same slugs
    the template already documents).
  - Export: **two columns** per user's choice — add
    `"Department (EN)"`/`"Position (EN)"` to `employeeHeaders`, and
    `onExport` maps `department: e.department.th` +
    `departmentEn: e.department.en` (same for position) into the exported
    rows.

## Other consumers to fix (type-level, `department: string` → object)

- `convex/functions/activity.ts`: `isEmployeeEligibleForActivity`'s
  `employee: { division: string; department: string }` param type, and the
  `bu: { department: employee.department, division: employee.division }`
  return shape (used for BU display). `allowedDepartments` matching is
  currently dead code (`normalizeActivityBuFields` always forces it to `[]`),
  so no behavioral risk there — just a type fix.
- `listJoinedEmployeeDetails` in `activity.ts` — passes through
  `department`/`position` in a list of participant details; verify any
  frontend consumer of that shape renders `.th` instead of the raw value.
- Grep for any other `.department`/`.position` reads on an `employee` doc
  outside the `employee` module (analytics screens, transaction views) as
  part of implementation — not enumerated exhaustively here.

## Out of scope

- `employee.name`, `rank`, `division` — stay plain strings.
- `activity.allowedDepartments` — left as `string[]` of slugs (matching logic
  is currently unused/dead code); not migrated to objects.
- No UI locale switching added to the admin `/meta/employee` area — this is a
  data-model change (record department/position in both languages), not an
  i18n-routing change like the `[locale]` app previously got.
