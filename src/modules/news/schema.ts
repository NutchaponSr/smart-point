import z from "zod/v4";

export const newsSchema = z.object({
  title: z.string().trim().min(1, { message: "กรุณากรอกหัวข้อ" }),
  summary: z.string().trim().nullable().optional(),
  body: z.string().trim().min(1, { message: "กรุณากรอกเนื้อหา" }),
  isPublished: z.coerce.boolean().default(false),
  isPinned: z.coerce.boolean().default(false),
});

export type NewsSchema = z.infer<typeof newsSchema>;
export type NewsFormInput = z.input<typeof newsSchema>;
