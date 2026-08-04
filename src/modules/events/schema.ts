import z from "zod/v4";

import { divisions } from "@/modules/employee/constants";
import { parseBuExcelColumn } from "@/modules/events/utils/bu-labels";
import {
  excelDateField,
  excelOptionalDateField,
} from "@/modules/events/utils/excel-fields";

const divisionSlugs = divisions.map((division) => division.slug);
const validDivisionSlugs = new Set<string>(divisionSlugs);

const allowedDivisionsField = z.array(z.string());

const allowedDivisionsExcelField = z
  .union([z.string(), z.array(z.string()), z.null()])
  .optional()
  .transform((value) => parseBuExcelColumn(value ?? ""))
  .pipe(
    z.array(z.string()).superRefine((slugs, ctx) => {
      for (const slug of slugs) {
        if (!validDivisionSlugs.has(slug)) {
          ctx.addIssue({
            code: "custom",
            message: `BU ไม่ถูกต้อง: ${slug} (ใช้ slug เช่น ${divisionSlugs.join(", ")})`,
          });
        }
      }
    }),
  );

const localizedNameSchema = z.object({
  th: z.string().trim().min(1, { message: "กรุณากรอกชื่อ (ไทย)" }),
  en: z.string().trim().min(1, { message: "Please enter name (English)" }),
});

const localizedDescriptionSchema = z.object({
  th: z.string().trim().min(1, { message: "กรุณากรอกนิยาม (ไทย)" }),
  en: z.string().trim().min(1, { message: "Please enter description (English)" }),
});

const eventObjectSchema = z.object({
  name: localizedNameSchema,
  description: localizedDescriptionSchema,
  point: z.number().min(1, { message: "กรุณากรอกจำนวนคะแนน" }),
  category: z.enum(["external", "internal", "internal_bu", "specials_point"]),
  startDate: z.number(),
  endDate: z.number(),
  maxParticipants: z.number().min(1, { message: "กรุณากรอกจำนวนผู้เข้าร่วม" }),
  allowedDivisions: allowedDivisionsField,
  allowedDepartments: z.array(z.string()),
});

const eventDateOrderRefine = (data: { startDate: number; endDate: number }) =>
  data.startDate <= data.endDate;

const eventDateOrderRefineOptions = {
  message: "วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด",
  path: ["startDate"],
};

export const eventSchema = eventObjectSchema.refine(
  eventDateOrderRefine,
  eventDateOrderRefineOptions,
);

/** นำเข้า Excel: คอลัมน์ BU เป็นสตริงคั่นด้วย comma + ชื่อแยก th/en */
export const eventExcelSchema = z
  .object({
    nameTh: z.string().trim().min(1, { message: "กรุณากรอกชื่อ (ไทย)" }),
    nameEn: z.string().trim().min(1, { message: "Please enter name (English)" }),
    descriptionTh: z
      .string()
      .trim()
      .min(1, { message: "กรุณากรอกนิยาม (ไทย)" }),
    descriptionEn: z
      .string()
      .trim()
      .min(1, { message: "Please enter description (English)" }),
    point: z.coerce.number().min(1, { message: "กรุณากรอกจำนวนคะแนน" }),
    category: z.enum(["external", "internal", "internal_bu", "specials_point"]),
    startDate: excelDateField,
    endDate: excelOptionalDateField,
    maxParticipants: z.coerce
      .number()
      .min(1, { message: "กรุณากรอกจำนวนผู้เข้าร่วม" }),
    allowedDivisions: allowedDivisionsExcelField,
    allowedDepartments: z.array(z.string()).default([]),
  })
  .refine(
    (data) => data.endDate == null || data.startDate <= data.endDate,
    eventDateOrderRefineOptions,
  );

export const joinEventSchema = z.object({
  employee: z.object({
    id: z.string().min(1, "กรุณาเลือกพนักงาน"),
    name: z.string(),
    email: z.string().optional(),
    department: z.string(),
  }),
});

export const participantSchema = z.object({
  employeeId: z.coerce.number().min(1, "กรุณาเลือกพนักงาน"),
  nameTh: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  departmentTh: z.string().optional().nullable(),
  departmentEn: z.string().optional().nullable(),
  positionTh: z.string().optional().nullable(),
  positionEn: z.string().optional().nullable(),
  status: z.enum(["registered", "attended", "rewarded", "cancelled"]),
});

export type EventSchema = z.infer<typeof eventSchema>;
export type EventFormInput = z.input<typeof eventSchema>;
export type JoinEventSchema = z.infer<typeof joinEventSchema>;
