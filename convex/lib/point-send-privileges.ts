/** Admin1 — ส่งพอยต์ให้ใครก็ได้ จำนวนเท่าไหร่ก็ได้ (ไม่จำกัดลิมิตรายเดือน) */
export const UNLIMITED_POINT_SEND_EMPLOYEE_ID = "00001";

export function canSendUnlimitedPoints(publicEmployeeId: string): boolean {
  return publicEmployeeId === UNLIMITED_POINT_SEND_EMPLOYEE_ID;
}
