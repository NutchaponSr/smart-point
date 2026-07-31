import z from "zod/v4";

/** ฟิลด์ร่วม: ฟอร์ม + Excel (ไม่รวม `image` — ใช้เฉพาะในฟอร์ม) */
const rewardCoreFields = {
  name: z.string().trim().min(1, { message: "กรุณากรอกชื่อ" }),
  description: z.string().trim().nullable(),
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

export const rewardExportSchema = z.object({
  ...rewardCoreFields,
  stock: z.coerce.number().min(-1, { message: "กรุณากรอกจำนวนคงเหลือ" }),
});

/** ค่าหลัง parse — ใช้เวลา submit/บันทึก */
export type RewardSchema = z.infer<typeof rewardSchema>;
/** สถานะในฟอร์ม — สอดคล้องกับ z.coerce (input ≠ output) สำหรับ zodResolver + RHF */
export type RewardFormInput = z.input<typeof rewardSchema>;
export type RewardExportSchema = z.infer<typeof rewardExportSchema>;
