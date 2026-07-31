export type LocalizedString = {
  th: string;
  en: string;
};

export function isLocalizedString(value: unknown): value is LocalizedString {
  return (
    typeof value === "object" &&
    value !== null &&
    "th" in value &&
    "en" in value &&
    typeof (value as LocalizedString).th === "string" &&
    typeof (value as LocalizedString).en === "string"
  );
}

/** รวมข้อความทุกภาษาสำหรับค้นหา */
export function localizedSearchText(
  value: LocalizedString | string | null | undefined,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return `${value.th} ${value.en}`;
}

/** เลือกข้อความภาษาเดียว (ข้อความ error / note ฝั่ง server) */
export function localizedLabel(
  value: LocalizedString | string | null | undefined,
  locale: "th" | "en" = "th",
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const primary = value[locale]?.trim();
  if (primary) return primary;
  return value.th?.trim() || value.en?.trim() || "";
}

/** แปลง string เก่า → { th, en } (ใช้ค่าเดิมทั้งสองภาษา) */
export function toLocalizedString(
  value: LocalizedString | string | null | undefined,
): LocalizedString | null {
  if (value == null) return null;
  if (isLocalizedString(value)) return value;
  const text = value.trim();
  if (!text) return null;
  return { th: text, en: text };
}
