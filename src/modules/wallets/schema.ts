import z from "zod/v4";

import {
  isSmartCultureTagId,
} from "@/modules/transactions/constants";

export const sendTransactionSchema = z
  .object({
    employee: z.object({
      id: z.string().min(1, "กรุณาเลือกพนักงาน"),
      name: z.string(),
      email: z.string().optional(),
      department: z.string(),
    }),
    amount: z.union([z.literal(5), z.literal(10), z.literal(20)], {
      error: "กรุณาเลือก 5, 10 หรือ 20 แต้ม",
    }),
    message: z.string().min(1, "กรุณาระบุข้อความ"),
    tags: z
      .string()
      .optional()
      .refine((value) => !value || isSmartCultureTagId(value), {
        message: "รหัสแท็กไม่ถูกต้อง",
      }),
  })
  .refine((data) => data.employee.id !== "", {
    message: "กรุณาเลือกพนักงาน",
    path: ["employee"],
  });

export type SendTransactionSchema = z.infer<typeof sendTransactionSchema>;

export const stepFields: Record<"send", (keyof SendTransactionSchema)[]> = {
  send: ["employee", "message", "amount", "tags"],
};
