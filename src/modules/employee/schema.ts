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

/** ฟอร์มสร้าง */
export const employeeSchema = z.object({
  email: z.string().optional().nullable(),
  name: localizedNameSchema,
  department: localizedDepartmentSchema,
  position: localizedPositionSchema,
  rank: z.string().trim().min(1, { message: "กรุณากรอกระดับ" }),
  division: z.string().trim().min(1, { message: "กรุณากรอกหน่วยงาน" }),
  employeeId: z.string().trim().min(1, { message: "กรุณากรอกรหัสพนักงาน" }),
  citizenId: z
    .string()
    .trim()
    .min(1, { message: "กรุณากรอกเลขบัตรประชาชน" })
    .max(5, { message: "กรุณากรอกเลขบัตรประชาชน 5 หลัก" }),
});

/** ฟอร์มแก้ไข */
export const employeeEditSchema = z.object({
  name: localizedNameSchema,
  employeeId: z.string().trim().min(1, { message: "กรุณากรอกรหัสพนักงาน" }),
  department: localizedDepartmentSchema,
  position: localizedPositionSchema,
  rank: z.string().trim().min(1, { message: "กรุณากรอกระดับ" }),
  division: z.string().trim().min(1, { message: "กรุณากรอกหน่วยงาน" }),
  citizenId: z
    .string()
    .trim()
    .refine((v) => v.length === 0 || v.length <= 5, {
      message: "กรุณากรอกเลขบัตรประชาชน 5 หลัก",
    }),
  newPassword: z
    .string()
    .trim()
    .refine((v) => v.length === 0 || (v.length >= 5 && v.length <= 20), {
      message: "รหัสผ่านต้องมี 5–20 ตัวอักษร หรือเว้นว่างถ้าไม่เปลี่ยน",
    }),
});

/**
 * นำเข้า Excel: คอลัมน์ localization แยก TH/EN — coerce ตัวเลขก่อน map ไป API
 */
export const employeeExportSchema = z.object({
  employeeId: z.coerce.number(),
  nameTh: z.string().trim().min(1, { message: "กรุณากรอกชื่อ (ไทย)" }),
  nameEn: z.string().trim().min(1, { message: "Please enter name (English)" }),
  email: z.string().optional().nullable(),
  departmentTh: z.string().trim().min(1, { message: "กรุณากรอกแผนก (ไทย)" }),
  departmentEn: z
    .string()
    .trim()
    .min(1, { message: "Please enter department (English)" }),
  positionTh: z.string().trim().min(1, { message: "กรุณากรอกตำแหน่ง (ไทย)" }),
  positionEn: z
    .string()
    .trim()
    .min(1, { message: "Please enter position (English)" }),
  rank: z.string().trim().min(1, { message: "กรุณากรอกระดับ" }),
  division: z.string().trim().min(1, { message: "กรุณากรอกหน่วยงาน" }),
  /**
   * ห้าม coerce เป็นตัวเลขแล้ว pad เพราะช่องว่าง/null จาก Excel จะกลายเป็น 0 → "00000"
   * ซึ่งจะถูกใช้เป็นรหัสผ่านเริ่มต้นที่ผิดและอาจชนกันข้ามแถว
   */
  citizenId: z.preprocess(
    (value) => (value == null ? "" : String(value).trim()),
    z
      .string()
      .min(1, { message: "กรุณากรอกเลขบัตรประชาชน" })
      .max(5, { message: "กรุณากรอกเลขบัตรประชาชน 5 หลัก" })
      .regex(/^\d+$/, { message: "เลขบัตรประชาชนต้องเป็นตัวเลข" }),
  ),
});

export type EmployeeSchema = z.infer<typeof employeeSchema>;
export type EmployeeEditSchema = z.infer<typeof employeeEditSchema>;
export type EmployeeExportSchema = z.infer<typeof employeeExportSchema>;
