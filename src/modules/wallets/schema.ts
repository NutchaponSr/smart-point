import z from "zod/v4";

export const sendTransactionSchema = z.object({
  employee: z.object({
    id: z.string().min(1, "กรุณาเลือกพนักงาน"),
    name: z.string(),
    email: z.string().optional(),
    department: z.string(),
  }),
  amount: z.number().min(1, "กรุณาระบุจำนวนที่มากกว่า 0"),
  message: z.string().min(1, "กรุณาระบุข้อความ"),
  tags: z.array(z.string()).min(1, "กรุณาระบุป้ายกำกับ"),
}).refine((data) => data.employee.id !== "", {
  message: "กรุณาเลือกพนักงาน",
  path: ["employee"],
});

export type SendTransactionSchema = z.infer<typeof sendTransactionSchema>;

export const stepFields: Record<"send" | "options", (keyof SendTransactionSchema)[]> = {
  send: ["employee", "amount"],
  options: ["message", "tags"],
};
