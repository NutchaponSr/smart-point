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