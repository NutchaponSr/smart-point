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

const localizedSeedSchema = z.object({
  th: z.string().trim().min(1),
  en: z.string().trim().min(1),
});

export const insertReward = privateMutation
  .input(
    z.object({
      name: localizedSeedSchema,
      description: localizedSeedSchema.optional(),
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
      .filter((q) => q.eq(q.field("name.th"), input.name.th))
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
      name: localizedSeedSchema,
      description: localizedSeedSchema.optional(),
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
      .filter((q) => q.eq(q.field("name.th"), input.name.th))
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
  const L = (th: string, en: string) => ({ th, en });

  const rewards = [
    {
      name: L("บัตรกำนัลเซ็นทรัล 500฿", "Central Gift Voucher 500฿"),
      description: L(
        "บัตรกำนัลห้างเซ็นทรัล มูลค่า 500 บาท",
        "Central department store gift voucher worth 500 THB",
      ),
      pointCost: 200,
      stock: 20,
      isActive: true,
    },
    {
      name: L("บัตรกำนัลเซ็นทรัล 1,000฿", "Central Gift Voucher 1,000฿"),
      description: L(
        "บัตรกำนัลห้างเซ็นทรัล มูลค่า 1,000 บาท",
        "Central department store gift voucher worth 1,000 THB",
      ),
      pointCost: 380,
      stock: 10,
      isActive: true,
    },
    {
      name: L("วันลาพิเศษ 1 วัน", "Extra leave day"),
      description: L(
        "วันหยุดพักผ่อนพิเศษนอกเหนือจากสิทธิ์ปกติ",
        "An extra day off beyond your regular leave entitlement",
      ),
      pointCost: 500,
      stock: -1,
      isActive: true,
      onePerOrder: true,
    },
    {
      name: L("ที่จอดรถพิเศษ 1 เดือน", "Reserved parking 1 month"),
      description: L(
        "สิทธิ์จอดรถในที่จอดรถสำรองเป็นเวลา 1 เดือน",
        "Reserved parking space for 1 month",
      ),
      pointCost: 150,
      stock: 5,
      isActive: true,
    },
    {
      name: L("เสื้อโปโลบริษัท", "Company polo shirt"),
      description: L(
        "เสื้อโปโลสีกรมท่าปักโลโก้บริษัท",
        "Navy polo shirt with company logo embroidery",
      ),
      pointCost: 80,
      stock: 50,
      isActive: true,
    },
    {
      name: L("กระเป๋าผ้าบริษัท", "Company tote bag"),
      description: L(
        "กระเป๋าผ้าดิบพิมพ์โลโก้ ใส่ของได้เยอะ",
        "Canvas tote bag with printed logo — roomy capacity",
      ),
      pointCost: 50,
      stock: 100,
      isActive: true,
    },
    {
      name: L("Grab Food 200฿", "Grab Food 200฿"),
      description: L(
        "Credit Grab Food มูลค่า 200 บาท",
        "Grab Food credit worth 200 THB",
      ),
      pointCost: 90,
      stock: 30,
      isActive: true,
    },
    {
      name: L("คอร์สอบรม Online", "Online training course"),
      description: L(
        "สิทธิ์เรียน Online Course บน Coursera หรือ Udemy 1 คอร์ส",
        "One online course credit on Coursera or Udemy",
      ),
      pointCost: 300,
      stock: -1,
      isActive: true,
      onePerOrder: true,
    },
    {
      name: L("ประกันสุขภาพเสริม 3 เดือน", "Supplementary health insurance 3 months"),
      description: L(
        "ความคุ้มครองสุขภาพเสริมนอกเหนือจากประกันบริษัท",
        "Supplementary health coverage beyond company insurance",
      ),
      pointCost: 600,
      stock: 10,
      isActive: true,
    },
    {
      name: L("ทำงาน Work From Home 5 วัน", "Work from home 5 days"),
      description: L(
        "สิทธิ์ Work From Home พิเศษ 5 วัน (ใช้ได้ภายใน 3 เดือน)",
        "5 extra work-from-home days (usable within 3 months)",
      ),
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
  const L = (th: string, en: string) => ({ th, en });
  const activities = [
    {
      name: L("Town Hall Q2 — ร่วมฟังและรับแต้ม", "Town Hall Q2 — attend and earn points"),
      description: L(
        "เข้าร่วม Town Hall ครบตามเงื่อนไข HR",
        "Attend Town Hall and meet HR requirements",
      ),
      point: 50,
      startDate: now - week,
      endDate: now + week * 4,
      maxParticipants: 200,
      isActive: true,
      category: "internal" as const,
    },
    {
      name: L("Safety Walk ประจำเดือน", "Monthly Safety Walk"),
      description: L(
        "เดินตรวจความปลอดภัยกับทีมจป.",
        "Safety inspection walk with the safety team",
      ),
      point: 30,
      startDate: now - week,
      endDate: now + week * 2,
      maxParticipants: 40,
      isActive: true,
      category: "internal_bu" as const,
      allowedDivisions: ["SBM", "SFT3"],
    },
    {
      name: L("Wellness Week — ส่วนลดแลกของรางวัล", "Wellness Week — reward discount"),
      description: L(
        "เข้าร่วมกิจกรรมครบแล้ว HR จะอัปเดตสถานะเป็นเข้าร่วม — ใช้สิทธิ์ส่วนลดแต้มเมื่อ checkout ตะกร้าได้ครั้งหนึ่ง",
        "After completing the activity, HR marks attendance — unlock a one-time checkout point discount",
      ),
      point: 100,
      startDate: now - week,
      endDate: now + week * 8,
      maxParticipants: undefined,
      isActive: true,
      category: "specials_point" as const,
      allowedDivisions: ["SAT", "SDS", "SBM", "ICP1", "ICP2", "SFT1", "SFT2", "SFT3", "SAA"],
    },
    {
      name: L("BU Hackathon 2026", "BU Hackathon 2026"),
      description: L(
        "แข่งขันไอเดียนวัตกรรมภายใน BU ทีมละ 3-5 คน",
        "Internal BU innovation hackathon, teams of 3–5",
      ),
      point: 120,
      startDate: now + week,
      endDate: now + week * 3,
      maxParticipants: 60,
      isActive: true,
      category: "internal_bu" as const,
      allowedDivisions: ["ICP1", "ICP2"],
    },
    {
      name: L("BU Knowledge Sharing — Lunch & Learn", "BU Knowledge Sharing — Lunch & Learn"),
      description: L(
        "แชร์ความรู้ช่วงพักเที่ยงประจำ BU เดือนนี้",
        "Monthly BU lunch-and-learn knowledge sharing",
      ),
      point: 20,
      startDate: now,
      endDate: now + week * 2,
      maxParticipants: 30,
      isActive: true,
      category: "internal_bu" as const,
      allowedDivisions: ["SFT1", "SFT2", "SFT3"],
    },
    {
      name: L("BU Team Building — Outing ประจำปี", "BU Team Building — annual outing"),
      description: L(
        "กิจกรรมสานสัมพันธ์ภายใน BU ณ ต่างจังหวัด 2 วัน 1 คืน",
        "BU bonding trip: 2 days 1 night out of town",
      ),
      point: 80,
      startDate: now + week * 2,
      endDate: now + week * 4,
      maxParticipants: 50,
      isActive: true,
      category: "internal_bu" as const,
      allowedDivisions: ["SAT"],
    },
    {
      name: L("BU 5ส Big Cleaning Day", "BU 5S Big Cleaning Day"),
      description: L(
        "ร่วมกิจกรรม 5ส ประจำไตรมาสของ BU",
        "Join the quarterly BU 5S cleaning day",
      ),
      point: 25,
      startDate: now - week,
      endDate: now + week,
      maxParticipants: undefined,
      isActive: true,
      category: "internal_bu" as const,
      allowedDivisions: ["SBM"],
    },
    {
      name: L("วิ่งการกุศล Charity Run 10K", "Charity Run 10K"),
      description: L(
        "ร่วมวิ่งการกุศลกับพันธมิตรภายนอก พร้อมส่งหลักฐาน BIB",
        "Join the external charity run and submit BIB proof",
      ),
      point: 60,
      startDate: now + week,
      endDate: now + week * 5,
      maxParticipants: 100,
      isActive: true,
      category: "external" as const,
    },
    {
      name: L("บริจาคโลหิตประจำไตรมาส", "Quarterly blood donation"),
      description: L(
        "บริจาคโลหิตกับสภากาชาดไทย แนบใบรับรองการบริจาค",
        "Donate blood with Thai Red Cross and attach the certificate",
      ),
      point: 40,
      startDate: now,
      endDate: now + week * 6,
      maxParticipants: undefined,
      isActive: true,
      category: "external" as const,
    },
    {
      name: L("อบรม First Aid & CPR", "First Aid & CPR training"),
      description: L(
        "อบรมปฐมพยาบาลเบื้องต้นและ CPR โดยวิทยากรภายใน",
        "Basic first aid and CPR training by internal instructors",
      ),
      point: 45,
      startDate: now + week,
      endDate: now + week * 2,
      maxParticipants: 25,
      isActive: true,
      category: "internal" as const,
    },
    {
      name: L("โครงการพนักงานดีเด่นประจำปี", "Employee of the Year program"),
      description: L(
        "แต้มพิเศษสำหรับพนักงานที่ได้รับคัดเลือกดีเด่นประจำปี",
        "Special points for employees selected as Employee of the Year",
      ),
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
