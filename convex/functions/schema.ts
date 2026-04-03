import { boolean, convexTable, defineSchema, index, text } from "better-convex/orm";

export const tasks = convexTable("task", {
  title: text(),
  description: text(),
  completed: boolean(),
}, (t) => [
  index("by_completed").on(t.completed),
]);

export const tables = {
  tasks,
}

export default defineSchema(tables, {
  defaults: {
    defaultLimit: 100,
  },
});