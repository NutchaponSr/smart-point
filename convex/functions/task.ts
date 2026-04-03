import { publicMutation, publicQuery } from "../lib/crpc";

export const get = publicQuery
  .query(async ({ ctx }) => {
    return await ctx.db.query("tasks").collect();
  });

export const create = publicMutation
  .mutation(async ({ ctx }) => {
    return await ctx.db.insert("tasks", { title: "New Task", description: "New Description" });
  });