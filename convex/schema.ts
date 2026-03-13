import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  employee: defineTable({
    employeeId: v.string(),
    name: v.string(),
    email: v.string(),
    department: v.string(),
    position: v.string(),
    rank: v.string(),
    division: v.string(),
  })
    .index("by_employeeId", ["employeeId"])
    .index("by_department", ["department"]),
  
  wallet: defineTable({
    employeeId: v.id("employee"),
    givingBudget: v.number(),
    receivingBudget: v.number(),
    lastBudgetUpdate: v.number(),
  })
    .index("by_employeeId", ["employeeId"]),

  recognition: defineTable({
    senderId: v.id("employee"),
    receiverId: v.id("employee"),
    point: v.number(),
    tag: v.union(
      v.literal("transparent_promise"),
      v.literal("caring_for_learning"),
      v.literal("collaboration"),
      v.literal("customer_first"),
      v.literal("innovation")
    ),
    tier: v.union(
      v.literal("small_win"),
      v.literal("above_beyond"),
      v.literal("champion")
    ),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_createdAt", ["createdAt"]),

  reward: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    pointCost: v.number(),
    category: v.union(
      v.literal("merchandise"),
      v.literal("experience"),
      v.literal("financial")
    ),
    active: v.boolean(),
    quantity: v.number(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_active", ["active"]),

  redemption: defineTable({
    employeeId: v.id("employee"),
    rewardId: v.id("reward"),
    recognitionId: v.id("recognition"),
    pointSpent: v.number(),
    quantity: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
  })
    .index("by_employee", ["employeeId"])
    .index("by_status", ["status"]),
})