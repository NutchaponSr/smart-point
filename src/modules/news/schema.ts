import z from "zod/v4";

const localizedTitleSchema = z.object({
  th: z.string().trim().min(1, { message: "กรุณากรอกหัวข้อ (ไทย)" }),
  en: z.string().trim().min(1, { message: "Please enter title (English)" }),
});

const localizedBodySchema = z.object({
  th: z.string().trim().min(1, { message: "กรุณากรอกเนื้อหา (ไทย)" }),
  en: z.string().trim().min(1, { message: "Please enter body (English)" }),
});

/** ในฟอร์มเก็บ object เสมอ — ว่างทั้งคู่แปลงเป็น null ตอนส่ง API */
const localizedSummaryFormSchema = z.object({
  th: z.string().trim(),
  en: z.string().trim(),
});

export const newsSchema = z.object({
  title: localizedTitleSchema,
  summary: localizedSummaryFormSchema,
  body: localizedBodySchema,
  isPublished: z.coerce.boolean().default(false),
  isPinned: z.coerce.boolean().default(false),
});

export function toApiSummary(
  summary: { th: string; en: string } | null | undefined,
): { th: string; en: string } | null {
  if (summary == null) return null;
  if (summary.th.trim() === "" && summary.en.trim() === "") return null;
  return {
    th: summary.th.trim(),
    en: summary.en.trim(),
  };
}

export type NewsSchema = z.infer<typeof newsSchema>;
export type NewsFormInput = z.input<typeof newsSchema>;
