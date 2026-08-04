import z from "zod/v4";

const localizedNameSchema = z.object({
  th: z.string().trim().min(1, { message: "กรุณากรอกชื่อ (ไทย)" }),
  en: z.string().trim().min(1, { message: "Please enter name (English)" }),
});

const localizedDepartmentSchema = z.object({
  th: z.string().trim().min(1, { message: "กรุณากรอกแผนก (ไทย)" }),
  en: z.string().trim().min(1, { message: "Please enter department (English)" }),
});

const localizedPositionSchema = z.object({
  th: z.string().trim().min(1, { message: "กรุณากรอกตำแหน่ง (ไทย)" }),
  en: z.string().trim().min(1, { message: "Please enter position (English)" }),
});

const citizenIdRequiredSchema = z
  .string()
  .trim()
  .regex(/^\d{1,5}$/, {
    message: "กรุณากรอกเลขบัตรประชาชน 1–5 หลักท้าย (ตัวเลขเท่านั้น)",
  })
  .refine((v) => v.padStart(5, "0") !== "00000", {
    message: "เลขบัตรประชาชนไม่ถูกต้อง",
  });

/** ฟอร์มสร้าง */
export const employeeSchema = z.object({
  email: z.string().optional().nullable(),
  name: localizedNameSchema,
  department: localizedDepartmentSchema,
  position: localizedPositionSchema,
  rank: z.string().trim().min(1, { message: "กรุณากรอกระดับ" }),
  division: z.string().trim().min(1, { message: "กรุณากรอกหน่วยงาน" }),
  employeeId: z.string().trim().min(1, { message: "กรุณากรอกรหัสพนักงาน" }),
  citizenId: citizenIdRequiredSchema,
});

/** ฟอร์มแก้ไข */
export const employeeEditSchema = z.object({
  name: localizedNameSchema,
  employeeId: z.string().trim().min(1, { message: "กรุณากรอกรหัสพนักงาน" }),
  department: localizedDepartmentSchema,
  position: localizedPositionSchema,
  rank: z.string().trim().min(1, { message: "กรุณากรอกระดับ" }),
  division: z.string().trim().min(1, { message: "กรุณากรอกหน่วยงาน" }),
  newPassword: z
    .string()
    .trim()
    .refine((v) => v.length === 0 || (v.length >= 5 && v.length <= 20), {
      message: "รหัสผ่านต้องมี 5–20 ตัวอักษร หรือเว้นว่างถ้าไม่เปลี่ยน",
    }),
});

/**
 * นำเข้า Excel: คอลัมน์ localization แยก TH/EN
 * EN optional — ไฟล์เก่ามีแค่ Name/Department/Position จะเติม EN จาก TH ใน hook
 */
export const employeeExportSchema = z.object({
  employeeId: z.coerce.number(),
  nameTh: z.string().trim().min(1, { message: "กรุณากรอกชื่อ (ไทย)" }),
  nameEn: z.string().trim().optional().nullable(),
  email: z.string().optional().nullable(),
  departmentTh: z.string().trim().min(1, { message: "กรุณากรอกแผนก (ไทย)" }),
  departmentEn: z.string().trim().optional().nullable(),
  positionTh: z.string().trim().min(1, { message: "กรุณากรอกตำแหน่ง (ไทย)" }),
  positionEn: z.string().trim().optional().nullable(),
  rank: z.string().trim().min(1, { message: "กรุณากรอกระดับ" }),
  division: z.string().trim().min(1, { message: "กรุณากรอกหน่วยงาน" }),
  /**
   * ห้าม coerce เป็นตัวเลขแล้ว pad เพราะช่องว่าง/null จาก Excel จะกลายเป็น 0 → "00000"
   */
  citizenId: z.preprocess(
    (value) => (value == null ? "" : String(value).trim()),
    citizenIdRequiredSchema,
  ),
});

/** เติม EN จาก TH เมื่อไฟล์เก่าไม่มีคอลัมน์ EN */
export function withLocalizedEnFallback(row: {
  nameTh: string;
  nameEn?: string | null;
  departmentTh: string;
  departmentEn?: string | null;
  positionTh: string;
  positionEn?: string | null;
}) {
  return {
    nameTh: row.nameTh,
    nameEn: row.nameEn?.trim() || row.nameTh,
    departmentTh: row.departmentTh,
    departmentEn: row.departmentEn?.trim() || row.departmentTh,
    positionTh: row.positionTh,
    positionEn: row.positionEn?.trim() || row.positionTh,
  };
}

export type EmployeeSchema = z.infer<typeof employeeSchema>;
export type EmployeeEditSchema = z.infer<typeof employeeEditSchema>;
export type EmployeeExportSchema = z.infer<typeof employeeExportSchema>;
