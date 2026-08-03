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
