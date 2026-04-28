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
}

export const eventHeaders: Record<string, string> = {
  "name": "Name",
  "description": "Description",
  "point": "Point",
  "category": "Category",
  "startDate": "Start Date",
  "endDate": "End Date",
  "maxParticipants": "Max Participants",
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