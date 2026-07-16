import z from "zod/v4";

import {
  isSmartCultureTagId,
} from "@/modules/transactions/constants";

const standardAmountSchema = z.union([z.literal(5), z.literal(10), z.literal(20)], {
  error: "กรุณาเลือก 5, 10 หรือ 20 แต้ม",
});

const unlimitedAmountSchema = z
  .number()
  .int("จำนวนแต้มต้องเป็นจำนวนเต็ม")
  .positive("กรุณาระบุจำนวนแต้ม");

function buildSendTransactionSchema(unlimitedSend: boolean) {
  return z
    .object({
      employee: z.object({
        id: z.string().min(1, "กรุณาเลือกพนักงาน"),
        name: z.string(),
        email: z.string().optional(),
        department: z.string(),
      }),
      amount: unlimitedSend ? unlimitedAmountSchema : standardAmountSchema,
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
}

export const sendTransactionSchema = buildSendTransactionSchema(false);

export function createSendTransactionSchema(unlimitedSend: boolean) {
  return buildSendTransactionSchema(unlimitedSend);
}

export type SendTransactionSchema = z.infer<
  ReturnType<typeof buildSendTransactionSchema>
>;

export const stepFields: Record<"send", (keyof SendTransactionSchema)[]> = {
  send: ["employee", "message", "amount", "tags"],
};
