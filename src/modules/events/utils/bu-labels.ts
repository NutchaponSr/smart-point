import { divisions } from "@/modules/employee/constants";

const BU_EXCEL_SEPARATOR = ", ";

export function getDivisionLabel(slug: string) {
  return divisions.find((d) => d.slug === slug)?.name.th ?? slug;
}

/** แปลง allowedDivisions เป็นค่าในคอลัมน์ BU ของ Excel (ว่าง = ทุก BU) */
export function formatBuExcelColumn(
  allowedDivisions: (string | null)[] | null | undefined,
) {
  const slugs = (allowedDivisions ?? []).filter(
    (slug): slug is string => slug != null && slug !== "",
  );
  return slugs.join(BU_EXCEL_SEPARATOR);
}

function resolveDivisionToken(token: string) {
  const match = divisions.find(
    (division) =>
      division.slug === token ||
      division.name.th === token ||
      division.name.en === token,
  );
  return match?.slug ?? token;
}

/** แปลงค่าจากคอลัมน์ BU ใน Excel เป็น slug array */
export function parseBuExcelColumn(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseBuExcelColumn(item));
  }
  if (value == null || value === "") return [];

  return String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(resolveDivisionToken);
}

/** แสดง BU/สังกัดที่อนุญาตให้เข้าร่วมกิจกรรม (จาก allowedDivisions) */
export function formatAllowedBuLabels(
  allowedDivisions: (string | null)[] | null | undefined,
  _allowedDepartments?: (string | null)[] | null | undefined,
) {
  const divisionLabels = (allowedDivisions ?? [])
    .filter((slug): slug is string => slug != null && slug !== "")
    .map(getDivisionLabel);

  if (divisionLabels.length === 0) {
    return ["ทุก BU"];
  }

  return divisionLabels;
}
