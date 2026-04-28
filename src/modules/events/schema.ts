import z from "zod/v4";

export const eventSchema = z.object({
  name: z.string().min(1, { message: "กรุณากรอกชื่อ" }),
  description: z.string().min(1, { message: "กรุณากรอกนิยาม" }),
  point: z.number().min(1, { message: "กรุณากรอกจำนวนคะแนน" }),
  category: z.enum(["external", "internal", "internal_bu", "specials_point"]),
  startDate: z.number(),
  endDate: z.number(),
  maxParticipants: z.number().min(1, { message: "กรุณากรอกจำนวนผู้เข้าร่วม" }),
}).refine((data) => data.startDate <= data.endDate, {
  message: "วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด",
  path: ["startDate"],
});

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
  name: z.string(),
  department: z.string(),
  position: z.string(),
  status: z.enum(["registered", "attended", "rewarded", "cancelled"]),
});

export type EventSchema = z.infer<typeof eventSchema>;
export type JoinEventSchema = z.infer<typeof joinEventSchema>;