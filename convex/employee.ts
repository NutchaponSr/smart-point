import { query } from "./_generated/server";

export const getMany = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("employee").collect();
  }
})