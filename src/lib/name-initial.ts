const LEADING_THAI_VOWELS = /^[เแโใไ]/;
const THAI_NAME_PREFIXES = ["นาย", "นางสาว", "นาง"] as const;

/** ตัวอักษรแรกสำหรับ avatar จากชื่อ (รองรับคำนำหน้าไทยและสระนำ) */
export function getAvatarInitialFromName(name: string): string {
  if (!name) return "?";

  let cleaned = name.trim();
  for (const prefix of THAI_NAME_PREFIXES) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  for (const ch of cleaned) {
    if (!LEADING_THAI_VOWELS.test(ch)) {
      return ch.toUpperCase();
    }
  }
  return cleaned.charAt(0).toUpperCase();
}
