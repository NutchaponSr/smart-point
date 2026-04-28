import z from "zod/v4";

import {
  getSmartCultureTagPoints,
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
    amount: z.number().min(1, "กรุณาระบุจำนวนที่มากกว่า 0"),
    message: z.string().min(1, "กรุณาระบุข้อความ"),
    tags: z
      .string()
      .min(1, "กรุณาเลือกแท็ก SMART Culture")
      .refine(isSmartCultureTagId, {
        message: "รหัสแท็กไม่ถูกต้อง",
      }),
  })
  .refine((data) => data.employee.id !== "", {
    message: "กรุณาเลือกพนักงาน",
    path: ["employee"],
  })
  .refine(
    (data) => {
      if (!isSmartCultureTagId(data.tags)) return true;
      const pts = getSmartCultureTagPoints(data.tags);
      return pts !== null && data.amount === pts;
    },
    {
      message: "จำนวนแต้มต้องตรงกับระดับพฤติกรรมที่เลือก",
      path: ["amount"],
    },
  );

export type SendTransactionSchema = z.infer<typeof sendTransactionSchema>;

export const stepFields: Record<"send" | "options", (keyof SendTransactionSchema)[]> = {
  send: ["employee", "tags", "amount"],
  options: ["message"],
};
