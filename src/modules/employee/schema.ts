import z from "zod/v4";

/** Shared fields: form + Excel import ใช้รูปแบบเดียวกัน ยกเว้น employeeId / citizenId ที่ parse ต่างกัน */
const employeeNameFields = {
  name: z.string().trim().min(1, { message: "กรุณากรอกชื่อ" }),
  email: z.string().optional().nullable(),
  department: z.string().trim().min(1, { message: "กรุณากรอกแผนก" }),
  position: z.string().trim().min(1, { message: "กรุณากรอกตำแหน่ง" }),
  rank: z.string().trim().min(1, { message: "กรุณากรอกระดับ" }),
  division: z.string().trim().min(1, { message: "กรุณากรอกหน่วยงาน" }),
};

/** ฟอร์ม: รหัส / เลขประชาชน เป็นสตริงจาก input */
export const employeeSchema = z.object({
  ...employeeNameFields,
  employeeId: z.string().trim().min(1, { message: "กรุณากรอกรหัสพนักงาน" }),
  citizenId: z.string().trim().min(1, { message: "กรุณากรอกเลขบัตรประชาชน" }).max(5, { message: "กรุณากรอกเลขบัตรประชาชน 5 หลัก" }),
});

/**
 * นำเข้า Excel: คอลัมน์มักเป็นตัวเลข / สตริงผสม — coerce ก่อน map ไป API
 * (หลีกเลี่ยง z.coerce ในฟอร์มเพื่อไม่ให้ input type กลายเป็น `unknown` กับ zodResolver)
 */
export const employeeExportSchema = z.object({
  ...employeeNameFields,
  employeeId: z.coerce.number(),
  citizenId: z.coerce.number(),
});

export type EmployeeSchema = z.infer<typeof employeeSchema>;
export type EmployeeExportSchema = z.infer<typeof employeeExportSchema>;
