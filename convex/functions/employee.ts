import z from "zod/v4";

import { authQuery } from "../lib/crpc";

export const search = authQuery
  .input(
    z.object({
      query: z.string().min(1),
    })
  )
  .query(async ({ ctx, input }) => {
    const q = input.query.toLowerCase();
    const currentEmployeeId = ctx.user.employeeId;

    const [id, name] = await Promise.all([
      ctx.db
        .query("employee")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", input.query))
        .take(5),
      ctx.db
        .query("employee")
        .collect()
        .then((rows) => rows
          .filter((row) => row.name.toLowerCase().includes(q) || (row.email ?? "").toLowerCase().includes(q))
          .slice(0, 10)
        )
    ]);

    const seen = new Set<string>();
    const results = [...id, ...name].filter((e) => {
      if (e._id === currentEmployeeId) return false;
      if (seen.has(e.employeeId)) return false;

      seen.add(e.employeeId);
      return true;
    });

    return results.slice(0, 10);
  });
