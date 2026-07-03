/** จำกัดแถวต่อ mutation — อยู่ใต้ Convex IO limit (1,000) เมื่อแถวใหม่ ~4 IO/แถว */
export const BULK_IMPORT_CHUNK_SIZE = 200;

export const employeeHeaderMapping: Record<string, string> = {
  "Employee Id": "employeeId",
  "Name": "name",
  "Email": "email",
  "Department": "department",
  "Position": "position",
  "Rank": "rank",
  "Division": "division",
  "Citizen Id": "citizenId",
};

export const employeeHeaders: Record<string, string> = {
  "employeeId": "Employee Id",
  "name": "Name",
  "email": "Email",
  "department": "Department",
  "position": "Position",
  "rank": "Rank",
  "division": "Division",
  "citizenId": "Citizen Id",
}

export const departments = [
  {
    slug: "hr",
    name: {
      th: "ฝ่ายบุคลากร",
      en: "HR",
    },
  },
  {
    slug: "it",
    name: {
      th: "ฝ่ายเทคโนโลยีสารสนเทศ",
      en: "IT",
    },
  },
  {
    slug: "finance",
    name: {
      th: "ฝ่ายการเงิน",
      en: "Finance",
    },
  },
  {
    slug: "marketing",
    name: {
      th: "ฝ่ายการตลาด",
      en: "Marketing",
    },
  },
  {
    slug: "sales",
    name: {
      th: "ฝ่ายขาย",
      en: "Sales",
    },
  }
];

export const positions = [
  {
    slug: "manager",
    name: {
      th: "ผู้จัดการ",
      en: "Manager",
    },
  },
  {
    slug: "supervisor",
    name: {
      th: "ผู้บังคับการ",
      en: "Supervisor",
    },
  },
  {
    slug: "staff",
    name: {
      th: "พนักงาน",
      en: "Staff",
    },
  },
];

export const ranks = [
  {
    slug: "ceo",
    name: {
      th: "คุณกรรมการผู้บริหาร",
      en: "CEO",
    },
  },
  {
    slug: "manager",
    name: {
      th: "ผู้จัดการ",
      en: "Manager",
    },
  },
  {
    slug: "supervisor",
    name: {
      th: "ผู้บังคับการ",
      en: "Supervisor",
    },
  },
  {
    slug: "staff",
    name: {
      th: "พนักงาน",
      en: "Staff",
    },
  },
];

export const divisions = [
  {
    slug: "headquarters",
    name: {
      th: "สำนักงานใหญ่",
      en: "Headquarters",
    },
  },
  {
    slug: "branch",
    name: {
      th: "สาขา",
      en: "Branch",
    },
  },
];