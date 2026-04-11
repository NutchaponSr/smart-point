import z from "zod/v4";

import { optionalAuthAction, privateMutation } from "../lib/crpc";

import { internal } from "./_generated/api";

export const insertEmployee = privateMutation
  .input(z.object({
    employeeId: z.string(),
    name: z.string(),
    email: z.string().optional(),
    department: z.string(),
    position: z.string(),
    rank: z.string(),
    division: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .query("employee")
      .withIndex("by_employeeId", (q) =>
        q.eq("employeeId", input.employeeId)
      )
      .first();

    if (existing) return null;

    const employeeDocId = await ctx.db.insert("employee", {
      employeeId: input.employeeId,
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
    })
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

export const seedEmployee = optionalAuthAction
  .input(z.object({
    employees: z.array(z.object({
      employeeId: z.string(),
      name: z.string(),
      email: z.string().optional(),
      department: z.string(),
      position: z.string(),
      rank: z.string(),
      division: z.string(),
      password: z.string(),
    })),
  }))
  .action(async ({ ctx, input }) => {
    let created = 0;
    let skipped = 0;

    for (const emp of input.employees) {
      const empId = await ctx.runMutation(
        internal.seed.insertEmployee,
        {
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          position: emp.position,
          rank: emp.rank,
          division: emp.division,
        }
      );

      if (!empId) {
        skipped++;
        continue;
      }

      try {
        await ctx.auth.api.signUpEmail({
          body: {
            name: emp.name,
            email: emp.email ? emp.email : `example@somboon.co.th`,
            password: emp.password,
            username: emp.employeeId,
            employeeId: empId,
          },
        });
      } catch (err) {
        console.error(`Failed to sign up employee ${emp.employeeId}:`, err);
      }

      created++;
    }

    console.log(`Seed done: ${created} created, ${skipped} skipped`);
    return { created, skipped };
  });

export const seedReward = optionalAuthAction
  .action(async ({ ctx }) => {
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