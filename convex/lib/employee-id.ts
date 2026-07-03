/** รหัสพนักงานธุรกิจ — เติมศูนย์นำหน้าให้ครบ 5 หลัก (เช่น 319 → 00319) */
export function normalizeEmployeeId(employeeId: string): string {
  const trimmed = employeeId.trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed.padStart(5, "0");
  }
  return trimmed;
}
