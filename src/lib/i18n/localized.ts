export type LocalizedString = {
  th: string;
  en: string;
};

export type AppLocale = "th" | "en";

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

/** เลือกข้อความตาม locale — ว่างแล้ว fallback เป็น th แล้ว en */
export function pickLocalized(
  value: LocalizedString | string | null | undefined,
  locale: string,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const key = locale === "en" ? "en" : "th";
  const primary = value[key]?.trim();
  if (primary) return primary;
  return value.th?.trim() || value.en?.trim() || "";
}
