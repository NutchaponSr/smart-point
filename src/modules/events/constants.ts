const DAY_MS = 86_400_000;

/** ปัดเวลาเป็นรายวัน (UTC) ให้ query key ของ carousel ตรงกันระหว่าง server prefetch และ client */
export const getCarouselNow = () => Math.floor(Date.now() / DAY_MS) * DAY_MS;

/** กิจกรรมสิ้นสุดหลัง endDate ครบทั้งวัน (endDate เก็บเป็น 00:00 ของวันนั้น) */
export function hasActivityEnded(
  endDate: number | null | undefined,
  now = Date.now(),
) {
  if (endDate == null) return false;
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);
  return now > endOfDay.getTime();
}

/** ประเภทกิจกรรมที่กำหนด BU/สังกัดผู้เข้าร่วมได้ */
export const buRestrictedCategories = [
  "internal_bu",
  "specials_point",
] as const;

export type BuRestrictedCategory = (typeof buRestrictedCategories)[number];

export const categories = {
  external: {
    th: "กิจกรรมภายนอก",
    en: "External Activity",
  },
  internal: {
    th: "กิจกรรมภายใน",
    en: "Internal Activity",
  },
  internal_bu: {
    th: "กิจกรรมภายใน BU",
    en: "Internal BU",
  },
  specials_point: {
    th: "กิจกรรมพิเศษ",
    en: "Specials Point",
  },
} as const;

export const statuses = {
  registered: {
    th: "สมัครเข้าร่วม",
    en: "Registered",
  },
  rewarded: {
    th: "รับรางวัล",
    en: "Rewarded",
  },
  attended: {
    th: "เข้าร่วมแล้ว",
    en: "Attended",
  },
} as const;

export const eventHeaderMapping: Record<string, string> = {
  Name: "name",
  Description: "description",
  Point: "point",
  Category: "category",
  "Start Date": "startDate",
  "End Date": "endDate",
  "Max Participants": "maxParticipants",
  BU: "allowedDivisions",
}

export const eventHeaders: Record<string, string> = {
  "name": "Name",
  "description": "Description",
  "point": "Point",
  "category": "Category",
  "startDate": "Start Date",
  "endDate": "End Date",
  "maxParticipants": "Max Participants",
  "allowedDivisions": "BU",
}

export const participantHeaderMapping: Record<string, string> = {
  "Employee Id": "employeeId",
  "Status": "status",
  "Name": "name",
  "Department": "department",
  "Position": "position",
}

export const participantHeaders: Record<string, string> = {
  "employeeId": "Employee Id",
  "name": "Name",
  "department": "Department",
  "position": "Position",
  "status": "Status",
}