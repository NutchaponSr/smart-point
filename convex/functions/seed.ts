import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { optionalAuthAction, privateMutation } from "../lib/crpc";
import { normalizeText } from "../lib/employee-id";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

function defaultSignupEmail(): string {
  return `example@somboon.co.th`;
}

export const insertEmployee = privateMutation
  .input(
    z.object({
      employeeId: z.string(),
      name: z.string(),
      email: z.string().optional(),
      department: z.string(),
      position: z.string(),
      rank: z.string(),
      division: z.string(),
      password: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const employeeId = normalizeText(input.employeeId, 5);

    const existing = await ctx.db
      .query("employee")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
      .first();

    if (existing) return null;

    const employeeDocId = await ctx.db.insert("employee", {
      employeeId,
      name: input.name,
      email: input.email,
      department: input.department,
      position: input.position,
      rank: input.rank,
      division: input.division,
    });

    // init wallet ทันที
    await ctx.db.insert("wallet", {
      employeeId: employeeDocId,
      givingBudget: 100,
      receivingBudget: 0,
      specialBudget: 5,
      lastBudgetUpdate: Date.now(),
    });

    return employeeDocId;
  });

export const insertReward = privateMutation
  .input(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      image: z.string().optional(),
      pointCost: z.int().min(1),
      stock: z.int().min(-1),
      isActive: z.boolean(),
      onePerOrder: z.boolean().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .query("reward")
      .filter((q) => q.eq(q.field("name"), input.name))
      .first();

    if (existing) return null;

    const { onePerOrder, ...rest } = input;
    return await ctx.db.insert("reward", {
      ...rest,
      ...(onePerOrder !== undefined ? { onePerOrder } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

export const insertActivity = privateMutation
  .input(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      point: z.number().int().min(1),
      startDate: z.number(),
      endDate: z.number().optional(),
      maxParticipants: z.number().int().positive().optional(),
      isActive: z.boolean(),
      category: z.enum(["external", "internal", "internal_bu", "specials_point"]),
      allowedDivisions: z.array(z.string()).optional(),
      allowedDepartments: z.array(z.string()).optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .query("activity")
      .filter((q) => q.eq(q.field("name"), input.name))
      .first();

    if (existing) return null;

    const { allowedDivisions, allowedDepartments, ...rest } = input;

    return await ctx.db.insert("activity", {
      ...rest,
      allowedDivisions: allowedDivisions ?? [],
      allowedDepartments: allowedDepartments ?? [],
    });
  });

export const seedEmployee = optionalAuthAction
  .input(
    z.object({
      employees: z.array(
        z.object({
          employeeId: z.string(),
          name: z.string(),
          email: z.string().optional(),
          department: z.string(),
          position: z.string(),
          rank: z.string(),
          division: z.string(),
          password: z.string(),
        }),
      ),
    }),
  )
  .action(async ({ ctx, input }) => {
    let created = 0;
    let skipped = 0;

    for (const emp of input.employees) {
      const employeeId = normalizeText(emp.employeeId, 5);
      const password = normalizeText(emp.password, 12);

      const empId = await ctx.runMutation(internal.seed.insertEmployee, {
        employeeId,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        position: emp.position,
        rank: emp.rank,
        division: emp.division,
        password: emp.password,
      });

      if (!empId) {
        skipped++;
        continue;
      }

      try {
        await ctx.auth.api.signUpEmail({
          body: {
            name: emp.name,
            email: emp.email ?? defaultSignupEmail(),
            password: normalizeText(emp.password, 5),
            username: employeeId,
            employeeId: empId,
            role: "user",
          },
        });
        created++;
      } catch (err) {
        console.error(`Failed to sign up employee ${employeeId}:`, err);
      }
    }

    console.log(`Seed done: ${created} created, ${skipped} skipped`);
    return { created, skipped };
  });

export const seedReward = optionalAuthAction.action(async ({ ctx }) => {
  const rewards = [
    {
      name: "Gift Voucher Central 500฿",
      description: "บัตรกำนัลห้างเซ็นทรัล มูลค่า 500 บาท",
      pointCost: 200,
      stock: 20,
      isActive: true,
    },
    {
      name: "Gift Voucher Central 1,000฿",
      description: "บัตรกำนัลห้างเซ็นทรัล มูลค่า 1,000 บาท",
      pointCost: 380,
      stock: 10,
      isActive: true,
    },
    {
      name: "วันลาพิเศษ 1 วัน",
      description: "วันหยุดพักผ่อนพิเศษนอกเหนือจากสิทธิ์ปกติ",
      pointCost: 500,
      stock: -1,
      isActive: true,
      onePerOrder: true,
    },
    {
      name: "ที่จอดรถพิเศษ 1 เดือน",
      description: "สิทธิ์จอดรถในที่จอดรถสำรองเป็นเวลา 1 เดือน",
      pointCost: 150,
      stock: 5,
      isActive: true,
    },
    {
      name: "เสื้อโปโลบริษัท",
      description: "เสื้อโปโลสีกรมท่าปักโลโก้บริษัท",
      pointCost: 80,
      stock: 50,
      isActive: true,
    },
    {
      name: "กระเป๋าผ้าบริษัท",
      description: "กระเป๋าผ้าดิบพิมพ์โลโก้ ใส่ของได้เยอะ",
      pointCost: 50,
      stock: 100,
      isActive: true,
    },
    {
      name: "Grab Food 200฿",
      description: "Credit Grab Food มูลค่า 200 บาท",
      pointCost: 90,
      stock: 30,
      isActive: true,
    },
    {
      name: "คอร์สอบรม Online",
      description: "สิทธิ์เรียน Online Course บน Coursera หรือ Udemy 1 คอร์ส",
      pointCost: 300,
      stock: -1,
      isActive: true,
      onePerOrder: true,
    },
    {
      name: "ประกันสุขภาพเสริม 3 เดือน",
      description: "ความคุ้มครองสุขภาพเสริมนอกเหนือจากประกันบริษัท",
      pointCost: 600,
      stock: 10,
      isActive: true,
    },
    {
      name: "ทำงาน Work From Home 5 วัน",
      description: "สิทธิ์ Work From Home พิเศษ 5 วัน (ใช้ได้ภายใน 3 เดือน)",
      pointCost: 250,
      stock: -1,
      isActive: true,
      onePerOrder: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const reward of rewards) {
    const id = await ctx.runMutation(internal.seed.insertReward, reward);
    if (id) created++;
    else skipped++;
  }

  console.log(`Seed rewards done: ${created} created, ${skipped} skipped`);
  return { created, skipped };
});

export const seedActivity = optionalAuthAction.action(async ({ ctx }) => {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const activities = [
    {
      name: "Town Hall Q2 — ร่วมฟังและรับแต้ม",
      description: "เข้าร่วม Town Hall ครบตามเงื่อนไข HR",
      point: 50,
      startDate: now - week,
      endDate: now + week * 4,
      maxParticipants: 200,
      isActive: true,
      category: "internal" as const,
    },
    {
      name: "Safety Walk ประจำเดือน",
      description: "เดินตรวจความปลอดภัยกับทีมจป.",
      point: 30,
      startDate: now - week,
      endDate: now + week * 2,
      maxParticipants: 40,
      isActive: true,
      category: "internal_bu" as const,
      allowedDivisions: ["SBM", "SFT3"],
    },
    {
      name: "Wellness Week — ส่วนลดแลกของรางวัล",
      description:
        "เข้าร่วมกิจกรรมครบแล้ว HR จะอัปเดตสถานะเป็นเข้าร่วม — ใช้สิทธิ์ส่วนลดแต้มเมื่อ checkout ตะกร้าได้ครั้งหนึ่ง",
      point: 100,
      startDate: now - week,
      endDate: now + week * 8,
      maxParticipants: undefined,
      isActive: true,
      category: "specials_point" as const,
      allowedDivisions: ["SAT", "SDS", "SBM", "ICP1", "ICP2", "SFT1", "SFT2", "SFT3", "SAA"],
    },
    {
      name: "BU Hackathon 2026",
      description: "แข่งขันไอเดียนวัตกรรมภายใน BU ทีมละ 3-5 คน",
      point: 120,
      startDate: now + week,
      endDate: now + week * 3,
      maxParticipants: 60,
      isActive: true,
      category: "internal_bu" as const,
      allowedDivisions: ["ICP1", "ICP2"],
    },
    {
      name: "BU Knowledge Sharing — Lunch & Learn",
      description: "แชร์ความรู้ช่วงพักเที่ยงประจำ BU เดือนนี้",
      point: 20,
      startDate: now,
      endDate: now + week * 2,
      maxParticipants: 30,
      isActive: true,
      category: "internal_bu" as const,
      allowedDivisions: ["SFT1", "SFT2", "SFT3"],
    },
    {
      name: "BU Team Building — Outing ประจำปี",
      description: "กิจกรรมสานสัมพันธ์ภายใน BU ณ ต่างจังหวัด 2 วัน 1 คืน",
      point: 80,
      startDate: now + week * 2,
      endDate: now + week * 4,
      maxParticipants: 50,
      isActive: true,
      category: "internal_bu" as const,
      allowedDivisions: ["SAT"],
    },
    {
      name: "BU 5ส Big Cleaning Day",
      description: "ร่วมกิจกรรม 5ส ประจำไตรมาสของ BU",
      point: 25,
      startDate: now - week,
      endDate: now + week,
      maxParticipants: undefined,
      isActive: true,
      category: "internal_bu" as const,
      allowedDivisions: ["SBM"],
    },
    {
      name: "วิ่งการกุศล Charity Run 10K",
      description: "ร่วมวิ่งการกุศลกับพันธมิตรภายนอก พร้อมส่งหลักฐาน BIB",
      point: 60,
      startDate: now + week,
      endDate: now + week * 5,
      maxParticipants: 100,
      isActive: true,
      category: "external" as const,
    },
    {
      name: "บริจาคโลหิตประจำไตรมาส",
      description: "บริจาคโลหิตกับสภากาชาดไทย แนบใบรับรองการบริจาค",
      point: 40,
      startDate: now,
      endDate: now + week * 6,
      maxParticipants: undefined,
      isActive: true,
      category: "external" as const,
    },
    {
      name: "อบรม First Aid & CPR",
      description: "อบรมปฐมพยาบาลเบื้องต้นและ CPR โดยวิทยากรภายใน",
      point: 45,
      startDate: now + week,
      endDate: now + week * 2,
      maxParticipants: 25,
      isActive: true,
      category: "internal" as const,
    },
    {
      name: "โครงการพนักงานดีเด่นประจำปี",
      description: "แต้มพิเศษสำหรับพนักงานที่ได้รับคัดเลือกดีเด่นประจำปี",
      point: 200,
      startDate: now - week,
      endDate: now + week * 12,
      maxParticipants: 10,
      isActive: true,
      category: "specials_point" as const,
      allowedDivisions: ["SFT3", "ICP2"],
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const row of activities) {
    const id = await ctx.runMutation(internal.seed.insertActivity, row);
    if (id) created++;
    else skipped++;
  }

  console.log(`Seed activities done: ${created} created, ${skipped} skipped`);
  return { created, skipped };
});
