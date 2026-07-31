import z from "zod/v4";

const localizedNameSchema = z.object({
  th: z.string().trim().min(1, { message: "กรุณากรอกชื่อ (ไทย)" }),
  en: z.string().trim().min(1, { message: "Please enter name (English)" }),
});

/** ในฟอร์มเก็บ object เสมอ — ว่างทั้งคู่แปลงเป็น null ตอนส่ง API */
const localizedDescriptionFormSchema = z.object({
  th: z.string().trim(),
  en: z.string().trim(),
});

/** ฟิลด์ร่วม: ฟอร์ม (ไม่รวม `image` — ใช้เฉพาะในฟอร์ม) */
const rewardCoreFields = {
  name: localizedNameSchema,
  description: localizedDescriptionFormSchema,
  /** สอดคล้องกับ `reward.create` (integer ≥ 0) */
  pointCost: z.coerce
    .number()
    .int({ message: "จำนวนพอยต์ต้องเป็นจำนวนเต็ม" })
    .min(0, { message: "กรุณากรอกจำนวนคะแนน" }),
  /** -1 = ไม่จำกัด, 0 = หมดสต็อก (สอดคล้องกับ cart / reward.update) */
  stock: z.coerce
    .number()
    .int({ message: "สต็อกต้องเป็นจำนวนเต็ม" })
    .refine((n) => n === -1 || n >= 0, {
      message: "กรอกจำนวนคงเหลือ (≥0) หรือ -1 สำหรับไม่จำกัด",
    }),
  onePerOrder: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().default(true),
};

export const rewardSchema = z.object({
  ...rewardCoreFields,
  image: z.string().trim().optional().nullable(),
});

/** Excel: แบนคอลัมน์ th/en */
export const rewardExportSchema = z.object({
  nameTh: z.string().trim().min(1, { message: "กรุณากรอกชื่อ (ไทย)" }),
  nameEn: z.string().trim().min(1, { message: "Please enter name (English)" }),
  descriptionTh: z.string().trim().nullable(),
  descriptionEn: z.string().trim().nullable(),
  pointCost: z.coerce
    .number()
    .int({ message: "จำนวนพอยต์ต้องเป็นจำนวนเต็ม" })
    .min(0, { message: "กรุณากรอกจำนวนคะแนน" }),
  stock: z.coerce.number().min(-1, { message: "กรุณากรอกจำนวนคงเหลือ" }),
  onePerOrder: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().default(true),
});

export function toApiDescription(
  description: { th: string; en: string } | null | undefined,
): { th: string; en: string } | null {
  if (description == null) return null;
  if (description.th.trim() === "" && description.en.trim() === "") return null;
  return {
    th: description.th.trim(),
    en: description.en.trim(),
  };
}

/** ค่าหลัง parse — ใช้เวลา submit/บันทึก */
export type RewardSchema = z.infer<typeof rewardSchema>;
/** สถานะในฟอร์ม — สอดคล้องกับ z.coerce (input ≠ output) สำหรับ zodResolver + RHF */
export type RewardFormInput = z.input<typeof rewardSchema>;
export type RewardExportSchema = z.infer<typeof rewardExportSchema>;
