/** จำกัดแถวต่อ mutation — อยู่ใต้ Convex IO limit (1,000) เมื่อแถวใหม่ ~4 IO/แถว */
export const BULK_IMPORT_CHUNK_SIZE = 200;

export const employeeHeaderMapping: Record<string, string> = {
  "Employee Id": "employeeId",
  "Name (TH)": "nameTh",
  "Name (EN)": "nameEn",
  "Email": "email",
  "Department (TH)": "departmentTh",
  "Department (EN)": "departmentEn",
  "Position (TH)": "positionTh",
  "Position (EN)": "positionEn",
  "Rank": "rank",
  "Division": "division",
  "Citizen Id": "citizenId",
};

export const employeeHeaders: Record<string, string> = {
  employeeId: "Employee Id",
  nameTh: "Name (TH)",
  nameEn: "Name (EN)",
  email: "Email",
  departmentTh: "Department (TH)",
  departmentEn: "Department (EN)",
  positionTh: "Position (TH)",
  positionEn: "Position (EN)",
  rank: "Rank",
  division: "Division",
  citizenId: "Citizen Id",
};

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

/** BU / สังกัดของพนักงาน — ใช้ร่วมกับกิจกรรม internal_bu และ specials_point */
export const divisions = [
  { slug: "SAT", name: { th: "SAT", en: "SAT" } },
  { slug: "SDS", name: { th: "SDS", en: "SDS" } },
  { slug: "SBM", name: { th: "SBM", en: "SBM" } },
  { slug: "ICP1", name: { th: "ICP1", en: "ICP1" } },
  { slug: "ICP2", name: { th: "ICP2", en: "ICP2" } },
  { slug: "SFT1", name: { th: "SFT1", en: "SFT1" } },
  { slug: "SFT2", name: { th: "SFT2", en: "SFT2" } },
  { slug: "SFT3", name: { th: "SFT3", en: "SFT3" } },
  { slug: "SAA", name: { th: "SAA", en: "SAA" } },
] as const;

export type DivisionSlug = (typeof divisions)[number]["slug"];