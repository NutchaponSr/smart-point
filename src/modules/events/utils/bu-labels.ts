import { divisions } from "@/modules/employee/constants";

export function getDivisionLabel(slug: string) {
  return divisions.find((d) => d.slug === slug)?.name.th ?? slug;
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
