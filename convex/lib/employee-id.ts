/** รหัสพนักงานธุรกิจ — เติมศูนย์นำหน้าให้ครบ 5 หลัก (เช่น 319 → 00319) */
export function normalizeText(employeeId: string, length: number): string {
  const trimmed = employeeId.trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed.padStart(length, "0");
  }
  return trimmed;
}
